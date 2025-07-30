// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDs9idThueAyWztDDtUvaibZHJtFhrAni0",
  authDomain: "mco1-87cfe.firebaseapp.com",
  databaseURL: "https://mco1-87cfe-default-rtdb.firebaseio.com",
  projectId: "mco1-87cfe",
  storageBucket: "mco1-87cfe.firebasestorage.app",
  messagingSenderId: "475039425191",
  appId: "1:475039425191:web:c1cc84cc7bafdda186b182",
  measurementId: "G-GN60Z7N8N5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); // declare só uma vez aqui
export const auth = getAuth(app);         // ✅ Aqui corrige o erro!
export const db = getFirestore(app);      // ✅ Firestore