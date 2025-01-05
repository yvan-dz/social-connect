"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "@/styles/profile.css"; // Importiere das CSS

export default function ProfilePage() {
  const [id, setId] = useState(""); // Benutzer-ID
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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
          setPhotoURL(data.photoURL || "");
        } else {
          setError("Profil nicht gefunden.");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const docRef = doc(db, "users", id);

      await updateDoc(docRef, {
        name,
        bio,
        photoURL,
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
    <div className="profile-container">
      <h1>Benutzerprofil</h1>
      <div className="profile-picture-section">
        <img
          src={photoURL || "/default-profile.png"}
          alt="Profilbild"
          className="profile-picture"
        />
        <input
          type="url"
          placeholder="Profilbild-URL eingeben"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          className="profile-input"
        />
      </div>
      <div className="profile-input-group">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="profile-input"
        />
      </div>
      <div className="profile-input-group">
        <label>Bio:</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="profile-textarea"
        />
      </div>
      <button onClick={handleUpdate} className="profile-button primary">
        Profil aktualisieren
      </button>
      <button
        onClick={() => router.push("/posts/create")}
        className="profile-button secondary"
      >
        Neuen Beitrag erstellen
      </button>
      <button
        onClick={() => router.push("/feed")}
        className="profile-button tertiary"
      >
        Meine Beiträge anzeigen
      </button>
    </div>
  );
}
