"use client";

import { useState } from "react";
import { auth, db } from "../../../firebase"; // Firebase-Instanzen importieren
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../firebase"; // Firebase Storage
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageURL = null;

      if (image) {
        const imageRef = ref(storage, `posts/${Date.now()}-${image.name}`);
        const uploadResult = await uploadBytes(imageRef, image);
        imageURL = await getDownloadURL(uploadResult.ref);
      }

      const postCollection = collection(db, "posts");
      await addDoc(postCollection, {
        title,
        content,
        imageURL,
        authorName: auth.currentUser?.displayName || "Unbekannt",
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      alert("Post erfolgreich erstellt!");
      setTitle("");
      setContent("");
      setImage(null);
      router.push("/"); // Nach erfolgreicher Erstellung zur Startseite weiterleiten
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Neuen Post erstellen</h1>
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
          <label htmlFor="image">Bild (optional):</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ display: "block", marginTop: "5px" }}
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
