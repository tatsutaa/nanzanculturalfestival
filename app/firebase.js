import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Import the Realtime Database client.

const firebaseConfig = {
  apiKey: "AIzaSyBs2Fm33hl_nhpKbv9Vx18Sm2Pe1Fs6B1g",
  authDomain: "my-ticket-app-5b992.firebaseapp.com",
  // Realtime Database URL for this Firebase project.
  databaseURL: "https://my-ticket-app-5b992-default-rtdb.firebaseio.com/",
  projectId: "my-ticket-app-5b992",
  storageBucket: "my-ticket-app-5b992.firebasestorage.app",
  messagingSenderId: "825896838698",
  appId: "1:825896838698:web:8800f62570070b48e54553",
  measurementId: "G-FWL7NHZ59Y"
};

// Reuse the existing app instance to avoid initializing Firebase more than once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app, firebaseConfig.databaseURL);

// Export the database instance for use throughout the application.
export { auth, db };
