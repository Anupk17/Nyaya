// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIOPTKnnrO3kJ0G8Sxp9ZCTCn2hKSMNi0",
  authDomain: "nyaya-c8c0a.firebaseapp.com",
  projectId: "nyaya-c8c0a",
  storageBucket: "nyaya-c8c0a.firebasestorage.app",
  messagingSenderId: "1019420107130",
  appId: "1:1019420107130:web:a905a5a3e5573d34c036c3",
  measurementId: "G-JVRYJFNBFQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };
