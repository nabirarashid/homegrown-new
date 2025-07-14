// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


// export auth and provider
const app = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth = getAuth(app);
export const provider: GoogleAuthProvider = new GoogleAuthProvider();
