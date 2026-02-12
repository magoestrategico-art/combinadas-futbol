// Configuración de Firebase para Next.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQ9lUF8GAUFqLzyED4i41zctEhLKumA9E",
  authDomain: "combinadasdefutbol.firebaseapp.com",
  projectId: "combinadasdefutbol",
  storageBucket: "combinadasdefutbol.firebasestorage.app",
  messagingSenderId: "1070298239357",
  appId: "1:1070298239357:web:bea64a5c0f2084879ebc14"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
