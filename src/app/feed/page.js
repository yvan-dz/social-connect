"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; // Firestore- und Auth-Instanz importieren
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "@/styles/myPosts.css"; // Import der CSS-Datei

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedContent, setUpdatedContent] = useState("");

  // Aktuell eingeloggten Benutzer überprüfen
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Listener entfernen
  }, []);

  // Posts des aktuellen Benutzers aus Firestore abrufen
  useEffect(() => {
    if (user) {
      const postsCollection = collection(db, "posts");
      const q = query(
        postsCollection,
        where("authorId", "==", user.uid), // Nur Posts des aktuellen Benutzers
        orderBy("createdAt", "desc") // Nach Erstellungsdatum sortieren
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      });

      return () => unsubscribe(); // Listener entfernen
    }
  }, [user]);

  // Post löschen
  const handleDelete = async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
      alert("Post erfolgreich gelöscht!");
    } catch (err) {
      console.error("Fehler beim Löschen:", err.message);
    }
  };

  // Post bearbeiten
  const handleEdit = (post) => {
    setEditingPost(post.id);
    setUpdatedTitle(post.title);
    setUpdatedContent(post.content);
  };

  // Änderungen speichern
  const handleSave = async () => {
    try {
      const postRef = doc(db, "posts", editingPost);
      await updateDoc(postRef, {
        title: updatedTitle,
        content: updatedContent,
      });
      alert("Post erfolgreich aktualisiert!");
      setEditingPost(null); // Bearbeitungsmodus verlassen
    } catch (err) {
      console.error("Fehler beim Aktualisieren:", err.message);
    }
  };

  return (
    <div className="my-posts-container">
      <h1 className="my-posts-title">Meine Posts</h1>
      {posts.length === 0 ? (
        <p className="my-posts-empty">Du hast noch keine Beiträge erstellt.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post-item">
            {editingPost === post.id ? (
              <>
                <input
                  type="text"
                  value={updatedTitle}
                  onChange={(e) => setUpdatedTitle(e.target.value)}
                  className="edit-input"
                />
                <textarea
                  value={updatedContent}
                  onChange={(e) => setUpdatedContent(e.target.value)}
                  className="edit-textarea"
                />
                <button
                  onClick={handleSave}
                  className="save-button"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingPost(null)}
                  className="cancel-button"
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                {post.imageURL && (
                  <img
                    src={post.imageURL}
                    alt="Post-Bild"
                    className="post-image"
                  />
                )}
                <p className="post-date">
                  Gepostet am{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Gerade eben"}
                </p>
                <button
                  onClick={() => handleEdit(post)}
                  className="edit-button"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="delete-button"
                >
                  Löschen
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
