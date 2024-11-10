import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if no apps exist
let app;
let analytics;
let db;
let storage;
let auth;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase instance');
  }

  // Initialize services
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
  
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);

} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Add a more comprehensive test function
export async function testFirebaseConnection() {
  try {
    // Test Firestore
    const workersRef = collection(db, 'users');
    const snapshot = await getDocs(workersRef);
    
    // Test Authentication
    const currentUser = auth.currentUser;
    
    // Test Storage
    const storageRef = storage.ref();
    
    console.log('Firebase connection test:', {
      success: true,
      firestoreConnection: true,
      documentsFound: snapshot.size,
      authInitialized: !!auth,
      storageInitialized: !!storage,
      currentUser: currentUser?.email || 'No user logged in'
    });
    
    return {
      success: true,
      firestoreConnection: true,
      documentsFound: snapshot.size,
      authInitialized: !!auth,
      storageInitialized: !!storage,
      currentUser: currentUser?.email || 'No user logged in'
    };
  } catch (error) {
    console.error('Firebase connection test failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Verify Firebase configuration
export function verifyFirebaseConfig() {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration keys:', missingKeys);
    return false;
  }
  
  return true;
}

export { firebaseConfig, app, db, storage, analytics, auth };
