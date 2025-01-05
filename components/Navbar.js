"use client";

import { useRouter } from "next/navigation";
import { logout } from "../src/firebase"; // Dein Logout
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth"; // Firebase Auth Listener
import { auth, db } from "../src/firebase"; // Firebase-Instanz
import { doc, setDoc, getDoc } from "firebase/firestore"; // Firestore-Funktionen
import "@/styles/navbar.css"; // Importiere das CSS

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Überprüfe den Authentifizierungsstatus
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: "Neuer Benutzer",
            email: currentUser.email,
            photoURL: currentUser.photoURL || null,
          });
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    alert("Erfolgreich abgemeldet!");
    router.push("/auth/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => router.push("/")}>
        SocialConnect
      </div>
      <div className="navbar-links">
        <button className="navbar-button" onClick={() => router.push("/")}>
          Home
        </button>
        {user ? (
          <>
            <button
              className="navbar-button"
              onClick={() => router.push(`/profile/${user.uid}`)}
            >
              Profil
            </button>
            <button
              className="navbar-button"
              onClick={() => router.push("/friends")}
            >
              Freunde
            </button>
            <button
              className="navbar-button navbar-chat"
              onClick={() => router.push("/chatlist")}
            >
              Chat
            </button>
            <button className="navbar-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="navbar-button"
              onClick={() => router.push("/auth/login")}
            >
              Login
            </button>
            <button
              className="navbar-button"
              onClick={() => router.push("/auth/register")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
