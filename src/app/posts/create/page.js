"use client";

import { useState } from "react";
import { auth, db } from "../../../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import "@/styles/post.css"; // Importiere das CSS

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
      let username = "Unbekannt";
      if (auth.currentUser?.uid) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          username = userDoc.data().name || "Unbekannt";
        }
      }

      const postCollection = collection(db, "posts");
      await addDoc(postCollection, {
        title,
        content,
        imageURL: imageURL || null,
        username,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        comments: [],
        likes: [],
        dislikes: [],
      });

      alert("Post erfolgreich erstellt!");
      setTitle("");
      setContent("");
      setImageURL("");
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="post-container">
      <h1 className="post-title">Neuen Beitrag erstellen</h1>
      <form className="post-form" onSubmit={handlePostSubmit}>
        <div className="post-form-group">
          <label htmlFor="title">Titel:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="post-form-group">
          <label htmlFor="content">Inhalt:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="post-form-group">
          <label htmlFor="imageURL">Bild-URL (optional):</label>
          <input
            type="url"
            id="imageURL"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <button className="post-submit-button" type="submit" disabled={isLoading}>
          {isLoading ? "Wird erstellt..." : "Post erstellen"}
        </button>
      </form>
      {error && <p className="post-error-message">{error}</p>}
    </div>
  );
}
