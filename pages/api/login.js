process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase'; 
import jwt from 'jsonwebtoken';
import https from 'https';

const db = getFirestore(app);
const auth = getAuth(app);

async function fetchUserDataByEmail(email) {
  const userDocRef = doc(db, 'users', email);
  try {
    const userDocSnapshot = await getDoc(userDocRef);
    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data();
    } else {
      throw new Error('User not found in Firestore');
    }
  } catch (error) {
    throw new Error(`Error fetching user data: ${error.message}`);
  }
}

export default async function handler(req, res) {
  const { email, password } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch Firestore data
    const userData = await fetchUserDataByEmail(email);

    if (!userData.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Trigger SAP B1 Service Layer Authentication
    const sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD,
      }),
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    if (!sapLoginResponse.ok) {
      throw new Error('SAP B1 Service Layer login failed');
    }

    const sapLoginData = await sapLoginResponse.json();
    const sessionId = sapLoginData.SessionId;

    // Set session cookies securely
    res.setHeader('Set-Cookie', [
      `B1SESSION=${sessionId}; HttpOnly; Secure; SameSite=None`,
    ]);

    // Generate JWT token
    const token = { uid: user.uid, isAdmin: userData.isAdmin };
    const secretKey = 'kdaJLPhRtGKGTLiAThdvHnVR0H544DOGM3Q2OBerQk4L0z1zzcaOVqU0afHK6ab';
    const customToken = jwt.sign(token, secretKey, { expiresIn: '30m' });

    return res.status(200).json({
      message: 'Login successful',
      uid: user.uid,
      email: user.email,
      fullName: userData.fullName,
      isAdmin: userData.isAdmin,
      customToken,
      sessionId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
