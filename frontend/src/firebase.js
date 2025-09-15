// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
const firebaseConfig = {
  apiKey: "AIzaSyDiQD9PWdSM6M2d7pYsvCFMe_FK0xn8vww",
  authDomain: "n8n--automation-468307.firebaseapp.com",
  projectId: "n8n-gmail-automation-468307",
  storageBucket: "n8n-gmail-automation-468307.firebasestorage.app",
  messagingSenderId: "588647730713",
  appId: "1:588647730713:web:e9d41b86a3545d3611a488",
  measurementId: "G-BSFQENVV8D",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const functions = getFunctions(app);
const provider = new GoogleAuthProvider();

provider.addScope("https://www.googleapis.com/auth/userinfo.email");

// Helper to sign in
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user; // Firebase User object
}

// Helper to sign out
async function signOut() {
  await firebaseSignOut(auth);
}

export { auth, provider, signInWithGoogle, signOut };
