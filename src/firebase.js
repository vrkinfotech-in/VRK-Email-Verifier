import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZLpxiopN9pY17qs83NLyPW8SmOKw15Ok",
    authDomain: "vrk-email-verifier.firebaseapp.com",
    projectId: "vrk-email-verifier",
    storageBucket: "vrk-email-verifier.firebasestorage.app",
    messagingSenderId: "851069128142",
    appId: "1:851069128142:web:d036b29b608211cd18ef9f",
    measurementId: "G-Q8QBF46BGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Helper to connect to emulator if on localhost
// Note: When deployed, this condition is false, so it uses real Auth.
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    // connectAuthEmulator(auth, "http://127.0.0.1:9099");
    // Commented out emulator connection to allow testing with REAL auth on localhost 
    // if you want to verify the config works before deploying.
    // To use emulator again, uncomment above.
}
