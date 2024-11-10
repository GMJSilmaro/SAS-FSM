process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../firebase';
import { serverLogActivity } from '../../utils/serverLogActivity';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { serialize } from 'cookie';

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 60, // 30 minutes
  httpOnly: true
};

// Add CORS headers
export const config = {
  api: {
    externalResolver: true,
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Add request validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('🔐 Server: Login request received', {
      method: req.method,
      body: { email: req.body.email, passwordLength: req.body?.password?.length }
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    let workerId = null;

    console.log('🔍 Server: Attempting Firebase authentication...');
    
    // Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    console.log('✅ Server: Firebase auth successful', {
      uid: user.uid,
      email: user.email
    });

    // Get user details from Firestore
    console.log('📚 Server: Fetching Firestore user data...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ Server: User not found in Firestore');
      return res.status(404).json({ message: 'User not found in database' });
    }

    const userData = querySnapshot.docs[0].data();
    console.log('📋 Server: User data retrieved', {
      workerId: userData.workerId,
      role: userData.role
    });

    // SAP B1 Login
    console.log('🔄 Server: Attempting SAP B1 login...');
    const sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD
      })
    });

    console.log('🔍 Server: SAP B1 response status:', sapLoginResponse.status);

    const sapLoginData = await sapLoginResponse.json();
    const sessionId = sapLoginData.SessionId;
    const sessionExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const customToken = await user.getIdToken();

    // Set all required cookies with proper configuration
    const cookies = [
      `B1SESSION=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `B1SESSION_EXPIRY=${sessionExpiryTime.toISOString()}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `ROUTEID=.node4; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `customToken=${customToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `uid=${user.uid}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `email=${email}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `workerId=${userData.workerId}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `isAdmin=${userData.role === 'admin'}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `LAST_ACTIVITY=${Date.now()}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`
    ];

    // Set cookies in response header
    res.setHeader('Set-Cookie', cookies);

    console.log('🔐 Server: Setting session cookies:', {
      sessionId: sessionId.substring(0, 8) + '...',
      expiryTime: sessionExpiryTime.toISOString()
    });

    // Log successful login
    await serverLogActivity(userData.workerId, 'LOGIN_SUCCESS', {
      email,
      timestamp: new Date().toISOString(),
      userDetails: {
        workerId: userData.workerId,
        isAdmin: userData.isAdmin === 'true',
        role: userData.role
      }
    });

    // Return success response with cookie information
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: {
        email,
        workerId: userData.workerId,
        uid: user.uid,
        isAdmin: userData.role === 'admin'
      },
      cookies: cookies.map(cookie => {
        const [name, value] = cookie.split('=');
        return { name, value: value.split(';')[0] };
      })
    });

  } catch (error) {
    console.error('❌ Server: Login error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Log SAP B1 login failure
    await serverLogActivity(workerId || 'SYSTEM', 'SAP_B1_LOGIN_FAILED', {
      timestamp: new Date().toISOString(),
      error: error.message
    });

    // Log login failure with detailed error
    await serverLogActivity(workerId || 'SYSTEM', 'LOGIN_FAILED', {
      email,
      timestamp: new Date().toISOString(),
      error: error.message,
      errorCode: error.code,
      stack: error.stack
    });

    // Clear all cookies on error
    const clearCookies = [
      'B1SESSION',
      'B1SESSION_EXPIRY',
      'ROUTEID',
      'customToken',
      'uid',
      'email',
      'workerId',
      'isAdmin',
      'LAST_ACTIVITY'
    ].map(name => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

    res.setHeader('Set-Cookie', clearCookies);

    return res.status(401).json({
      message: 'Authentication failed',
      error: error.message
    });
  }
}
