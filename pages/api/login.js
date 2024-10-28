process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { renewSAPSession } from '../../utils/renewSAPSession';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
import { app } from '../../firebase'; 
import jwt from 'jsonwebtoken';
import https from 'https';

const db = getFirestore(app);
const auth = getAuth(app);

// Add this constant at the top level
const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 60 // 30 minutes in seconds
};

// Fetch Firestore data by email to get workerId and user details
async function fetchUserDataByEmail(email) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email)); 
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('User not found in Firestore');
    }
    
    const userData = querySnapshot.docs[0].data();
    return userData;
  } catch (error) {
    throw new Error(`Error fetching user data: ${error.message}`);
  }
}

export default async function handler(req, res) { 
  const agent = new https.Agent({
    rejectUnauthorized: false // Only for testing
  });
  const { email, password } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData = await fetchUserDataByEmail(email);

    if (user.uid !== userData.uid) {
      return res.status(403).json({ message: 'UID does not match the user data in Firestore.' });
    }

    if (userData.activeUser === false) {
      return res.status(403).json({ message: 'Account is not active. Please contact an administrator to renew.' });
    }

    if (userData.expirationDate) {
      const expirationDate = userData.expirationDate.toDate 
        ? userData.expirationDate.toDate() 
        : new Date(userData.expirationDate); 

      const currentDate = new Date();
      if (currentDate >= expirationDate) {
        return res.status(403).json({ message: 'Account has expired. Please contact an administrator.' });
      }
    }

    if (!userData.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    console.log('Attempting SAP B1 connection test');
    const sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD
      }),
      agent: agent
    });

    if (!sapLoginResponse.ok) {
      const errorText = await sapLoginResponse.text();
      throw new Error(`SAP B1 responded with status: ${sapLoginResponse.status}, message: ${errorText}`);
    }

    const sapLoginData = await sapLoginResponse.json();
    console.log('SAP B1 connection successful');

    const sessionId = sapLoginData.SessionId;
    const sessionExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    // Generate custom token
    const token = { 
      uid: user.uid, 
      isAdmin: userData.isAdmin,
      expirationDate: userData.expirationDate ? new Date(userData.expirationDate).toISOString() : null
    };
    const secretKey = process.env.JWT_SECRET_KEY || 'your_fallback_secret_key';
    const customToken = jwt.sign(token, secretKey, { expiresIn: '30m' });

    // Set cookies using res.setHeader
    res.setHeader('Set-Cookie', [
      `B1SESSION=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `B1SESSION_EXPIRY=${sessionExpiryTime.toISOString()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `ROUTEID=.node4; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `customToken=${customToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `uid=${user.uid}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `email=${email}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `workerId=${userData.workerId}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `isAdmin=${userData.isAdmin}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `LAST_ACTIVITY=${Date.now()}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`
    ]);

    return res.status(200).json({
      message: 'Login successful',
      uid: user.uid,
      email: user.email,
      workerId: userData.workerId,
      fullName: userData.fullName,
      isAdmin: userData.isAdmin,
      customToken,
      sessionId
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during login', 
      error: error.message 
    });
  }
}

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// import { renewSAPSession } from '../../utils/renewSAPSession';

// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
// import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
// import { app } from '../../firebase'; 
// import jwt from 'jsonwebtoken';
// import https from 'https';

// const db = getFirestore(app);
// const auth = getAuth(app);

// // Fetch Firestore data by email to get workerId and user details
// async function fetchUserDataByEmail(email) {
//   const usersRef = collection(db, 'users');
//   const q = query(usersRef, where('email', '==', email)); 
  
//   try {
//     const querySnapshot = await getDocs(q);
//     if (querySnapshot.empty) {
//       throw new Error('User not found in Firestore');
//     }
    
//     const userData = querySnapshot.docs[0].data();
//     return userData;
//   } catch (error) {
//     throw new Error(`Error fetching user data: ${error.message}`);
//   }
// }

// export default async function handler(req, res) { 
//   const agent = new https.Agent({
//     rejectUnauthorized: false // Only for testing
//   });
//   const { email, password } = req.body;

//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     const userData = await fetchUserDataByEmail(email);

//     if (user.uid !== userData.uid) {
//       return res.status(403).json({ message: 'UID does not match the user data in Firestore.' });
//     }

//     if (userData.activeUser === false) {
//       return res.status(403).json({ message: 'Account is not active. Please contact an administrator to renew.' });
//     }

//     if (userData.expirationDate) {
//       const expirationDate = userData.expirationDate.toDate 
//         ? userData.expirationDate.toDate() 
//         : new Date(userData.expirationDate); 

//       const currentDate = new Date();
//       if (currentDate >= expirationDate) {
//         return res.status(403).json({ message: 'Account has expired. Please contact an administrator.' });
//       }
//     }

//     if (!userData.isAdmin) {
//       return res.status(403).json({ message: 'Access denied. Admins only.' });
//     }

//     console.log('Attempting SAP B1 connection test');
//     const sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         CompanyDB: process.env.SAP_B1_COMPANY_DB,
//         UserName: process.env.SAP_B1_USERNAME,
//         Password: process.env.SAP_B1_PASSWORD
//       }),
//       agent: agent
//     });

//     if (!sapLoginResponse.ok) {
//       const errorText = await sapLoginResponse.text();
//       throw new Error(`SAP B1 responded with status: ${sapLoginResponse.status}, message: ${errorText}`);
//     }

//     const sapLoginData = await sapLoginResponse.json();
//     console.log('SAP B1 connection successful');

//     const sessionId = sapLoginData.SessionId;
//     const sessionExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
//     res.setHeader('Set-Cookie', [
//       `B1SESSION=${sessionId}; HttpOnly; Secure; SameSite=None`,
//       `ROUTEID=.node4; Secure; SameSite=None`,
//       `B1SESSION_EXPIRY=${sessionExpiryTime.toISOString()}; HttpOnly; Secure; SameSite=None`
//     ]);

//     const token = { 
//       uid: user.uid, 
//       isAdmin: userData.isAdmin,
//       expirationDate: userData.expirationDate ? new Date(userData.expirationDate).toISOString() : null
//     };
//     const secretKey = process.env.JWT_SECRET_KEY || 'your_fallback_secret_key';
//     const customToken = jwt.sign(token, secretKey, { expiresIn: '30m' });
    
//     return res.status(200).json({
//       message: 'Login successful',
//       uid: user.uid,
//       email: user.email,
//       workerId: userData.workerId, 
//       fullName: userData.fullName,
//       isAdmin: userData.isAdmin,
//       expirationDate: userData.expirationDate ? new Date(userData.expirationDate).toISOString() : null,
//       customToken,
//       sessionId,
//     });
    
//   } catch (error) {
//     console.error('Login error:', error);
//     console.error('Error stack:', error.stack);
//     return res.status(500).json({ message: 'An error occurred during login', error: error.message, stack: error.stack });
//   }
// }
