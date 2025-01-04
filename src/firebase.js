// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjjrqOWF0DT86d6c9y5IzFrQxZFDV_OfY",
  authDomain: "socialconnect-fba29.firebaseapp.com",
  projectId: "socialconnect-fba29",
  storageBucket: "socialconnect-fba29.firebasestorage.app",
  messagingSenderId: "646853313435",
  appId: "1:646853313435:web:b8d65faf9176bca7ea973e",
  measurementId: "G-6RMZLLN232",
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Dienste initialisieren
const auth = getAuth(app);
const db = getFirestore(app);

// Authentifizierte Benutzersession überprüfen
const checkUserSession = (callback) => {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
import { signOut } from 'firebase/auth';

const logout = async () => {
  try {
    await signOut(auth);
    console.log('Benutzer abgemeldet');
  } catch (err) {
    console.error('Fehler beim Logout:', err.message);
  }
};




export { auth, db, checkUserSession, logout };
