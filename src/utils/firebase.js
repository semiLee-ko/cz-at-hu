import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// cu-at-hu project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTXTPxQPj9xe41kgyR4KM044JYTtCV9xc",
    authDomain: "cu-at-hu.firebaseapp.com",
    projectId: "cu-at-hu",
    storageBucket: "cu-at-hu.firebasestorage.app",
    messagingSenderId: "327180517352",
    appId: "1:327180517352:web:22e1b54e75a635255f2e5d",
    measurementId: "G-ZES3KMKMFD"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app, 'asia-northeast3'); // Seoul region

/**
 * Initializes Firebase and performs anonymous sign-in to allow calling functions.
 */
export const initFirebase = async () => {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log("✅ Firebase Anonymous Sign-in Success");
        }
    } catch (error) {
        console.error("❌ Firebase Init/Auth Error:", error);
        throw error;
    }
};
