"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfilePage() {
  const [id, setId] = useState(""); // Benutzer-ID
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Benutzer-Authentifizierung prüfen
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
      } else {
        setId(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Benutzerprofil aus Firestore abrufen
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setName(data.name || "");
          setBio(data.bio || "");
          setPhotoURL(data.photoURL || ""); // Falls kein Profilbild vorhanden
        } else {
          setError("Profil nicht gefunden.");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [id]);

  // Profil aktualisieren
  const handleUpdate = async () => {
    try {
      const docRef = doc(db, "users", id);

      await updateDoc(docRef, {
        name,
        bio,
        photoURL, // Direkt den Link speichern
      });

      alert("Profil erfolgreich aktualisiert!");
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return <div>Fehler: {error}</div>;
  }

  if (!profile) {
    return <div>Profil wird geladen...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Benutzerprofil</h1>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={photoURL || "/default-profile.png"}
          alt="Profilbild"
          style={{ width: "150px", height: "150px", borderRadius: "50%" }}
        />
        <input
          type="url"
          placeholder="Profilbild-URL eingeben"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          style={{ display: "block", marginTop: "10px", width: "100%", padding: "8px" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Bio:</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px", height: "100px" }}
        />
      </div>
      <button
        onClick={handleUpdate}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#333",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Profil aktualisieren
      </button>
      <button
        onClick={() => router.push("/posts/create")} // Weiterleitung zur Post-Erstellung
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Neuen Beitrag erstellen
      </button>
      <button
        onClick={() => router.push("/feed")} // Weiterleitung zur "Meine Posts"-Seite
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#555",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Meine Beiträge anzeigen
      </button>
    </div>
  );
}
