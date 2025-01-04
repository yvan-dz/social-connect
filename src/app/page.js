"use client";

import { useEffect, useState } from "react";
import { auth, db } from "./firebase"; // Firebase-Instanz importieren
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  // Überprüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Beiträge aus Firestore abrufen
  useEffect(() => {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // Fake-Beiträge hinzufügen, falls die Sammlung leer ist
  useEffect(() => {
    const addFakePosts = async () => {
      const postsCollection = collection(db, "posts");
      const snapshot = await onSnapshot(postsCollection, (snap) => {
        if (snap.empty) {
          const fakePosts = [
            {
              title: "Erster Beitrag",
              content: "Dies ist ein Testbeitrag.",
              authorName: "Admin",
              createdAt: serverTimestamp(),
            },
            {
              title: "Zweiter Beitrag",
              content: "Ein weiterer Testbeitrag.",
              authorName: "Admin",
              createdAt: serverTimestamp(),
            },
            {
              title: "Dritter Beitrag",
              content: "Dies ist ein Beispielbeitrag.",
              authorName: "Admin",
              createdAt: serverTimestamp(),
            },
            {
              title: "Vierter Beitrag",
              content: "Noch ein Testbeitrag.",
              authorName: "Admin",
              createdAt: serverTimestamp(),
            },
          ];
          fakePosts.forEach(async (post) => {
            await addDoc(postsCollection, post);
          });
        }
      });
    };
    addFakePosts();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      {user ? (
        <>
          <h1>Beiträge</h1>
          {posts.length === 0 ? (
            <p>Keine Beiträge verfügbar.</p>
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
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "cover",
                      marginTop: "10px",
                    }}
                  />
                )}
                <p style={{ color: "#555", fontSize: "12px" }}>
                  Gepostet von {post.authorName || "Unbekannt"} am{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Gerade eben"}
                </p>
              </div>
            ))
          )}
        </>
      ) : (
        <div>
          <h1>Willkommen bei SocialConnect!</h1>
          <p>Bitte registriere dich oder logge dich ein, um loszulegen.</p>
        </div>
      )}
    </div>
  );
}
