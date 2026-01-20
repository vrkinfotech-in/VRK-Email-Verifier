import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize App Check
// IMPORTANT: Replace 'RECAPTCHA_SITE_KEY' with your actual reCAPTCHA v3 site key from Firebase Console
// App Check is disabled to prevent "Token" errors and white screen issues.
// if (typeof window !== "undefined") {
//     window.appCheck = initializeAppCheck(app, {
//         provider: new ReCaptchaV3Provider('6LckQE8sAAAAALld0_qVpO3b0ZlDt5S0rlEqyxv0'),
//         isTokenAutoRefreshEnabled: true
//     });
// }

// Helper to connect to emulator if on localhost
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    // Note: App Check emulator debug token setup would go here if needed
}
