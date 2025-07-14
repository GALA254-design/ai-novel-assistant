import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBascx_lxNBvjYA6wdPB2RDU12WL7XUops",
  authDomain: "ai-novel-assistant-a5e90.firebaseapp.com",
  projectId: "ai-novel-assistant-a5e90",
  storageBucket: "ai-novel-assistant-a5e90.firebasestorage.app",
  messagingSenderId: "19293849433",
  appId: "1:19293849433:web:e249cc53d6cbd971bf6e48",
  measurementId: "G-2D39FQE7PQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app); 