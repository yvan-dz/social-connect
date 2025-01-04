import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Storage importieren

const firebaseConfig = {
  apiKey: "AIzaSyDjjrqOWF0DT86d6c9y5IzFrQxZFDV_OfY",
  authDomain: "socialconnect-fba29.firebaseapp.com",
  projectId: "socialconnect-fba29",
  storageBucket: "socialconnect-fba29.appspot.com", // Richtiges Storage-Bucket
  messagingSenderId: "646853313435",
  appId: "1:646853313435:web:b8d65faf9176bca7ea973e",
  measurementId: "G-6RMZLLN232",
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Dienste initialisieren
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Storage initialisieren

// Authentifizierte Benutzersession überprüfen
const checkUserSession = (callback) => {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Logout-Funktion
const logout = async () => {
  try {
    await signOut(auth);
    console.log("Benutzer abgemeldet");
  } catch (err) {
    console.error("Fehler beim Logout:", err.message);
  }
};

// Dienste exportieren
export { auth, db, storage, checkUserSession, logout }; // Speicher exportieren
