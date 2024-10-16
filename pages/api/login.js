process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Use this only in development

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase'; // Import the Firebase app directly
import jwt from 'jsonwebtoken';
import https from 'https';

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Fetch user data based on workerId from Firestore
async function fetchUserData(workerId) {
  const userDocRef = doc(db, 'users', workerId);
  try {
    const userDocSnapshot = await getDoc(userDocRef);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      console.log('User data fetched from Firestore:', userData);
      return userData; // Return the user data
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    console.error('Error fetching user data from Firestore:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const { workerId, password } = req.body;
  console.log('Received request:', { workerId, password });

  try {
    const userData = await fetchUserData(workerId);
    console.log('Fetched user data:', userData);

    if (!userData.isAdmin) {
      console.log('Access denied. User is not an admin.');
      return res.status(401).json({ message: 'Access denied. You are not authorized.' });
    }

    const email = userData.email;
    await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in with email and password');

    // Trigger SAP B1 Service Layer Authentication
    const sapLoginResponse = await fetch(process.env.SAP_SERVICE_LAYER_BASE_URL + 'Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD,
      }),
      agent: new https.Agent({ rejectUnauthorized: false }), // Avoid this in production
    });

    if (sapLoginResponse.ok) {
      const sapLoginData = await sapLoginResponse.json();
      const sessionId = sapLoginData.SessionId;
      const sessionTimeout = 30;

      res.setHeader('Set-Cookie', [
        `B1SESSION=${sessionId}; HttpOnly; Secure; SameSite=None`,
        `ROUTEID=.node4; Secure; SameSite=None`,
      ]);

      const token = { uid: auth.currentUser.uid, isAdmin: userData.isAdmin };
      const secretKey = 'kdaJLPhRtGKGTLiAThdvHnVR0H544DOGM3Q2OBerQk4L0z1zzcaOVqU0afHK6ab'; 
      const customToken = jwt.sign(token, secretKey, { expiresIn: '30m' });

      console.log('Generated custom token:', customToken);

      return res.status(200).json({
        message: 'Login successful',
        uid: auth.currentUser.uid,
        workerId,
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        isAdmin: userData.isAdmin,
        token,
        customToken,
        sessionId, 
        sessionTimeout,
      });
    } else {
      console.error('SAP B1 Service Layer login failed:', sapLoginResponse.statusText);
      return res.status(500).json({ message: 'SAP B1 Service Layer login failed' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// import { initializeApp } from 'firebase/app';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
// import { getFirestore, doc, getDoc } from 'firebase/firestore';
// // import { firebaseConfig } from '../../firebase'; // Import your Firebase config
// import jwt from 'jsonwebtoken';
// import https from 'https';
// import { app } from '../../firebase';
// const auth = getAuth(app);

// // // Initialize Firebase app
// // if (!initializeApp.length) {
// //   initializeApp(firebaseConfig);
// // }

// // Fetch user data based on workerId from Firestore
// async function fetchUserData(workerId) {
//   const db = getFirestore();
//   const userDocRef = doc(db, 'users', workerId);
//   try {
//     const userDocSnapshot = await getDoc(userDocRef);
//     if (userDocSnapshot.exists()) {
//       const userData = userDocSnapshot.data();
//       console.log('User data fetched from Firestore:', userData);
//       return userData; // Return the user data
//     } else {
//       throw new Error('Invalid credentials');
//     }
//   } catch (error) {
//     console.error('Error fetching user data from Firestore:', error);
//     throw error;
//   }
// }

// export default async function handler(req, res) {
//   const { workerId, password } = req.body;
//   console.log('Received request:', { workerId, password });

//   try {
//     const userData = await fetchUserData(workerId);
//     console.log('Fetched user data:', userData);

//     if (!userData.isAdmin) {
//       console.log('Access denied. User is not an admin.');
//       return res.status(401).json({ message: 'Access denied. You are not authorized.' });
//     }

//     const email = userData.email;
//     const auth = getAuth();
//     await signInWithEmailAndPassword(auth, email, password);
//     console.log('User signed in with email and password');

//     // Trigger SAP B1 Service Layer Authentication
//     const sapLoginResponse = await fetch(process.env.SAP_SERVICE_LAYER_BASE_URL + 'Login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         CompanyDB: process.env.SAP_B1_COMPANY_DB,
//         UserName: process.env.SAP_B1_USERNAME,
//         Password: process.env.SAP_B1_PASSWORD,
//       }),
//       agent: new https.Agent({ rejectUnauthorized: false }), // Disable cert verification
//     });

//     if (sapLoginResponse.ok) {
//       const sapLoginData = await sapLoginResponse.json();
//       const sessionId = sapLoginData.SessionId;
//       const sessionTimeout = 30;

//       res.setHeader('Set-Cookie', [
//         `B1SESSION=${sessionId}; HttpOnly; Secure; SameSite=None`,
//         `ROUTEID=.node4; Secure; SameSite=None`,
//       ]);

//       const token = { uid: auth.currentUser.uid, isAdmin: userData.isAdmin };
//       const secretKey = 'kdaJLPhRtGKGTLiAThdvHnVR0H544DOGM3Q2OBerQk4L0z1zzcaOVqU0afHK6ab'; 
//       const customToken = jwt.sign(token, secretKey, { expiresIn: '30m' });

//       console.log('Generated custom token:', customToken);

//       return res.status(200).json({
//         message: 'Login successful',
//         uid: auth.currentUser.uid,
//         workerId,
//         firstName: userData.firstName,
//         middleName: userData.middleName,
//         lastName: userData.lastName,
//         isAdmin: userData.isAdmin,
//         token,
//         customToken,
//         sessionId, 
//         sessionTimeout,
//       });
//     } else {
//       console.error('SAP B1 Service Layer login failed:', sapLoginResponse.statusText);
//       return res.status(500).json({ message: 'SAP B1 Service Layer login failed' });
//     }
//   } catch (error) {
//     console.error('Error logging in:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }
