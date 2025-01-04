"use client";

import { useRouter } from "next/navigation";
import { logout } from "../src/firebase"; // Dein Logout
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth"; // Firebase Auth Listener
import { auth, db } from "../src/firebase"; // Firebase-Instanz
import { doc, setDoc, getDoc } from "firebase/firestore"; // Firestore-Funktionen

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Überprüfe den Authentifizierungsstatus
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Benutzer authentifiziert, Profil in Firestore prüfen
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Benutzerprofil erstellen, falls es nicht existiert
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

    return () => unsubscribe(); // Aufräumen, wenn die Komponente entladen wird
  }, []);

  const handleLogout = async () => {
    await logout();
    alert("Erfolgreich abgemeldet!");
    router.push("/auth/login"); // Weiterleitung zur Login-Seite nach Logout
  };

  return (
    <nav
      style={{
        padding: "10px",
        backgroundColor: "#333",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h1
          style={{ margin: 0, cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          SocialConnect
        </h1>
      </div>
      <div>
        {user ? (
          <>
            <button
              style={{
                marginRight: "10px",
                color: "#fff",
                backgroundColor: "#555",
                padding: "5px 10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => router.push(`/profile/${user.uid}`)}
            >
              Profil
            </button>
            <button
              style={{
                marginRight: "10px",
                color: "#fff",
                backgroundColor: "#555",
                padding: "5px 10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => router.push("/friends")}
            >
              Freunde
            </button>
            <button
              style={{
                color: "#fff",
                backgroundColor: "#555",
                padding: "5px 10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              style={{
                marginLeft: "10px",
                color: "#fff",
                backgroundColor: "#555",
                padding: "5px 10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => router.push("/auth/login")}
            >
              Login
            </button>
            <button
              style={{
                marginLeft: "10px",
                color: "#fff",
                backgroundColor: "#555",
                padding: "5px 10px",
                border: "none",
                cursor: "pointer",
              }}
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
