"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});

  // Überprüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Beiträge aus Firestore abrufen
  useEffect(() => {
    const fetchPosts = async () => {
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
    };

    fetchPosts();
  }, []);

  // Like/Dislike-Handler
  const handleVote = async (postId, type) => {
    if (!user) {
      alert("Bitte melde dich an, um zu voten.");
      return;
    }

    const postRef = doc(db, "posts", postId);
    const userId = user.uid;

    try {
      const postSnapshot = await getDoc(postRef); // Daten des Dokuments abrufen
      const postData = postSnapshot.data();

      const likes = postData.likes || [];
      const dislikes = postData.dislikes || [];

      if (type === "like" && !likes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          dislikes: arrayRemove(userId), // Entfernt ein Dislike, falls vorhanden
        });
      } else if (type === "dislike" && !dislikes.includes(userId)) {
        await updateDoc(postRef, {
          dislikes: arrayUnion(userId),
          likes: arrayRemove(userId), // Entfernt ein Like, falls vorhanden
        });
      }
    } catch (err) {
      console.error("Fehler beim Abstimmen:", err);
    }
  };

  // Kommentar-Handler
const handleComment = async (postId) => {
  if (!user) {
    alert("Bitte melde dich an, um einen Kommentar zu schreiben.");
    return;
  }

  try {
    // Benutzerinformationen aus der `users`-Sammlung abrufen
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() && userDoc.data().name ? userDoc.data().name : "Unbekannt";
    const profileImage = userDoc.exists() && userDoc.data().profileImage ? userDoc.data().profileImage : null;

    if (!commentText[postId] || commentText[postId].trim() === "") {
      alert("Kommentartext darf nicht leer sein.");
      return;
    }

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      comments: arrayUnion({
        text: commentText[postId].trim(),
        username,
        profileImage,
        createdAt: new Date().toISOString(),
      }),
    });
    setCommentText((prev) => ({ ...prev, [postId]: "" })); // Kommentar-Feld zurücksetzen
  } catch (err) {
    console.error("Fehler beim Hinzufügen eines Kommentars:", err);
  }
};


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
                      borderRadius: "5px",
                    }}
                  />
                )}
                <p style={{ color: "#555", fontSize: "12px" }}>
                  Gepostet von {post.username || "Unbekannt"} am{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Gerade eben"}
                </p>
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={() => handleVote(post.id, "like")}
                    style={{
                      marginRight: "10px",
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    👍 {post.likes?.length || 0}
                  </button>
                  <button
                    onClick={() => handleVote(post.id, "dislike")}
                    style={{
                      marginRight: "10px",
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#F44336",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    👎 {post.dislikes?.length || 0}
                  </button>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <h4>Kommentare:</h4>
                  <ul style={{ padding: 0, listStyleType: "none" }}>
                    {post.comments?.map((comment, index) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "5px",
                        }}
                      >
                        {comment.profileImage && (
                          <img
                            src={comment.profileImage}
                            alt="Profilbild"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              marginRight: "10px",
                            }}
                          />
                        )}
                        <div>
                          <strong>{comment.username}</strong>
                          <p style={{ margin: 0 }}>{comment.text}</p>
                          <span style={{ fontSize: "12px", color: "#555" }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <input
                    type="text"
                    value={commentText[post.id] || ""}
                    onChange={(e) =>
                      setCommentText((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    placeholder="Einen Kommentar schreiben..."
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                    }}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    style={{
                      marginTop: "5px",
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#007BFF",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Senden
                  </button>
                </div>
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
