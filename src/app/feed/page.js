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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Meine Posts</h1>
      {posts.length === 0 ? (
        <p>Du hast noch keine Beiträge erstellt.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              marginBottom: "20px",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            {editingPost === post.id ? (
              <>
                <input
                  type="text"
                  value={updatedTitle}
                  onChange={(e) => setUpdatedTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                />
                <textarea
                  value={updatedContent}
                  onChange={(e) => setUpdatedContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "10px",
                    height: "100px",
                  }}
                />
                <button
                  onClick={handleSave}
                  style={{
                    padding: "10px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingPost(null)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <h2>{post.title}</h2>
                <p>{post.content}</p>
                {post.imageURL && (
                  <img
                    src={post.imageURL}
                    alt="Post-Bild"
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "cover",
                      marginTop: "10px",
                    }}
                  />
                )}
                <p style={{ color: "#555", fontSize: "12px" }}>
                  Gepostet am{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Gerade eben"}
                </p>
                <button
                  onClick={() => handleEdit(post)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
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
