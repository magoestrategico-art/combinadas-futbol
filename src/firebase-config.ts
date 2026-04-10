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

const firebaseAdminConfig = {
  type: "service_account",
  project_id: "combinadasdefutbol",
  private_key_id: "<PRIVATE_KEY_ID>",
  private_key: "<PRIVATE_KEY>\n",
  client_email: "firebase-adminsdk-fbsvc@combinadasdefutbol.iam.gserviceaccount.com",
  client_id: "110198729008814897029",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40combinadasdefutbol.iam.gserviceaccount.com"
};

export default firebaseAdminConfig;
