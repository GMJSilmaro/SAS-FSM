import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminDb;
let adminAuth;

export function initAdmin() {
  try {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

      if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY is not configured');
      }

      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('FIREBASE_CLIENT_EMAIL is not configured');
      }

      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error('FIREBASE_PROJECT_ID is not configured');
      }

      const app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      });

      adminDb = getFirestore(app);
      adminAuth = getAuth(app);

      console.log('Firebase Admin initialized successfully');
    } else {
      console.log('Using existing Firebase Admin instance');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Test admin connection
export async function testAdminConnection() {
  try {
    const snapshot = await adminDb.collection('users').limit(1).get();
    return {
      success: true,
      documentsFound: snapshot.size
    };
  } catch (error) {
    console.error('Firebase Admin connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export { adminDb, adminAuth }; 