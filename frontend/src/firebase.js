import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration
// Get these values from Firebase Console: https://console.firebase.google.com/
// Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "AIzaSyAjhDzuvXIXuAUEL88tQ5WZIQauswoN_a4",
    authDomain: "hbox-c2bf7.firebaseapp.com",
    projectId: "hbox-c2bf7",
    storageBucket: "hbox-c2bf7.firebasestorage.app",
    messagingSenderId: "98031449991",
    appId: "1:98031449991:web:f73d121a3a8aeffbe14522",
    measurementId: "G-8PFFJ0MRG4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };