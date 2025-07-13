// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCElqHBona1E_RQCMlWaWdOIikzTtaJW7s",
  authDomain: "homegrown-backend.firebaseapp.com",
  databaseURL: "https://homegrown-backend-default-rtdb.firebaseio.com",
  projectId: "homegrown-backend",
  storageBucket: "homegrown-backend.firebasestorage.app",
  messagingSenderId: "1045921702088",
  appId: "1:1045921702088:web:9438417834f6b63644c5fd",
  measurementId: "G-T0K7BSJB4M",
};

// export auth and provider
const app = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth = getAuth(app);
export const provider: GoogleAuthProvider = new GoogleAuthProvider();
