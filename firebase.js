import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvIXUF3JMGvsakHw6U9vUabVhyBM13GG8",
  authDomain: "potensi-db.firebaseapp.com",
  projectId: "potensi-db",
  storageBucket: "potensi-db.appspot.com",
  messagingSenderId: "1075549750844",
  appId: "1:1075549750844:web:286062f6d24af6608f6539",
  measurementId: "G-YGKW881Q7K"
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
