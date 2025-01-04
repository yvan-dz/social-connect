"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; // Firestore- und Auth-Instanz importieren
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

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
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            {post.imageURL && (
              <img
                src={post.imageURL}
                alt="Post-Bild"
                style={{ width: "100%", maxHeight: "300px", objectFit: "cover", marginTop: "10px" }}
              />
            )}
            <p style={{ color: "#555", fontSize: "12px" }}>
              Gepostet am{" "}
              {post.createdAt?.seconds
                ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                : "Gerade eben"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
