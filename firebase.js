import { initializeApp } from "firebase/app";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const db = getFirestore(app); 
const storage = getStorage(app);
const auth = getAuth(app);

// Add a test function to verify connection and permissions
export async function testFirebaseConnection() {
  try {
    const workersRef = collection(db, 'workers');
    const snapshot = await getDocs(workersRef);
    
    console.log('Firebase connection test:', {
      success: true,
      documentsFound: snapshot.size,
      firstDoc: snapshot.docs[0]?.data()
    });
    
    return {
      success: true,
      documentsFound: snapshot.size,
      firstDoc: snapshot.docs[0]?.data()
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export firebaseConfig if needed elsewhere
export { firebaseConfig, app, db, storage, analytics, auth };
