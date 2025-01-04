"use client";

import { useState } from "react";
import { auth, db } from "../../../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Benutzername aus der `users`-Sammlung abrufen
      let username = "Unbekannt"; // Standardwert
      if (auth.currentUser?.uid) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          username = userDoc.data().name || "Unbekannt";
        }
      }

      // Post-Daten in Firestore speichern
      const postCollection = collection(db, "posts");
      await addDoc(postCollection, {
        title,
        content,
        imageURL: imageURL || null, // Optionales Bild
        username, // Benutzername aus der users-Sammlung
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        comments: [], // Leeres Array für Kommentare
        likes: [], // Leeres Array für Likes
        dislikes: [], // Leeres Array für Dislikes
      });

      alert("Post erfolgreich erstellt!");
      setTitle("");
      setContent("");
      setImageURL("");
      router.push("/"); // Zurück zur Startseite
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Neuen Beitrag erstellen</h1>
      <form onSubmit={handlePostSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="title">Titel:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="content">Inhalt:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              height: "100px",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="imageURL">Bild-URL (optional):</label>
          <input
            type="url"
            id="imageURL"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isLoading ? "#888" : "#333",
            color: "#fff",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Wird erstellt..." : "Post erstellen"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}
