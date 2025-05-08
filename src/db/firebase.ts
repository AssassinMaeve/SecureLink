import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW9dCjmoHw-vniMsMUP2WC1jGpGe92PWY",
  authDomain: "link-50f75.firebaseapp.com",
  projectId: "link-50f75",
  storageBucket: "link-50f75", // fixed here
  messagingSenderId: "572814694330",
  appId: "1:572814694330:web:22916c24ea31e9e6b3af83",
  measurementId: "G-1GTPR8PP4R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth to use in Login page
export const auth = getAuth(app);
export const db = getFirestore(app); // ✅ Firestore instance
export const storage = getStorage(app, "gs://link-50f75"); // ✅ Storage instance