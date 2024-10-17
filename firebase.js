import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAN7o4-N5unSUCtU7amZKRA4TRV7WjJ01Y",
  authDomain: "sas-fsm.firebaseapp.com",
  projectId: "sas-fsm",
  storageBucket: "sas-fsm.appspot.com",
  messagingSenderId: "653364522600",
  appId: "1:653364522600:web:fc90ef9dedda2181a9d5dd",
  measurementId: "G-JX36QS06TM"
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

// Export firebaseConfig if needed elsewhere
export { firebaseConfig, app, db, storage, analytics, auth };
