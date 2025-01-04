"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [editComment, setEditComment] = useState(null); // Bearbeitungsmodus
  const [updatedCommentText, setUpdatedCommentText] = useState(""); // Neuer Kommentartext

  // Überprüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Beiträge aus Firestore abrufen
  useEffect(() => {
    const fetchPosts = () => {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("createdAt", "desc"));
  
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (postDoc) => {
            const post = postDoc.data();
            const userRef = doc(db, "users", post.authorId); // Sicherstellen, dass `doc` korrekt verwendet wird
            const userSnap = await getDoc(userRef);
            const username = userSnap.exists() ? userSnap.data().name : "Unbekannt";
  
            return {
              id: postDoc.id,
              ...post,
              authorName: username, // username als authorName
            };
          })
        );
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
      const postSnapshot = await getDoc(postRef);
      const postData = postSnapshot.data();

      const likes = postData.likes || [];
      const dislikes = postData.dislikes || [];

      if (type === "like" && !likes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          dislikes: arrayRemove(userId),
        });
      } else if (type === "dislike" && !dislikes.includes(userId)) {
        await updateDoc(postRef, {
          dislikes: arrayUnion(userId),
          likes: arrayRemove(userId),
        });
      }
    } catch (err) {
      console.error("Fehler beim Abstimmen:", err);
    }
  };

  // Kommentar hinzufügen
const handleComment = async (postId) => {
  if (!user) {
    alert("Bitte melde dich an, um einen Kommentar zu schreiben.");
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() && userDoc.data().name ? userDoc.data().name : "Unbekannt";
    const profileImage = userDoc.exists() && userDoc.data().profileImage ? userDoc.data().profileImage : null;

    if (!commentText[postId] || commentText[postId].trim() === "") {
      alert("Kommentartext darf nicht leer sein.");
      return;
    }

    const postRef = doc(db, "posts", postId);
    const comment = {
      text: commentText[postId].trim(),
      username,
      profileImage,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(postRef, {
      comments: arrayUnion(comment),
    });

    setCommentText((prev) => ({ ...prev, [postId]: "" })); // Kommentar-Feld zurücksetzen
  } catch (err) {
    console.error("Fehler beim Hinzufügen eines Kommentars:", err);
  }
};

  

  // Kommentar bearbeiten
  const handleEditComment = async (postId, comment) => {
    const postRef = doc(db, "posts", postId);
    try {
      const updatedComments = posts
        .find((post) => post.id === postId)
        .comments.map((c) =>
          c.createdAt === comment.createdAt && c.userId === comment.userId
            ? { ...c, text: updatedCommentText }
            : c
        );

      await updateDoc(postRef, {
        comments: updatedComments,
      });

      setEditComment(null);
    } catch (err) {
      console.error("Fehler beim Bearbeiten eines Kommentars:", err);
    }
  };

  // Kommentar löschen
  const handleDeleteComment = async (postId, comment) => {
    const postRef = doc(db, "posts", postId);
    try {
      await updateDoc(postRef, {
        comments: arrayRemove(comment),
      });
    } catch (err) {
      console.error("Fehler beim Löschen eines Kommentars:", err);
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
                  Ersteller: <strong>{post.authorName}</strong> | Erstellt am:{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Unbekannt"}
                </p>
                <div>
                  <h4>Kommentare:</h4>
                  <ul>
                    {post.comments?.map((comment, index) => (
                      <li key={index} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
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
                            {editComment === comment.createdAt ? (
                              <input
                                type="text"
                                value={updatedCommentText}
                                onChange={(e) => setUpdatedCommentText(e.target.value)}
                                style={{ marginLeft: "10px" }}
                              />
                            ) : (
                              <p>{comment.text}</p>
                            )}
                          </div>
                          {comment.userId === user.uid && (
                            <div style={{ marginLeft: "auto", cursor: "pointer" }}>
                              <button
                                onClick={() =>
                                  editComment
                                    ? handleEditComment(post.id, comment)
                                    : setEditComment(comment.createdAt)
                                }
                              >
                                ✏️
                              </button>
                              <button onClick={() => handleDeleteComment(post.id, comment)}>🗑️</button>
                            </div>
                          )}
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
                  />
                  <button onClick={() => handleComment(post.id)}>Senden</button>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <p>Bitte melde dich an.</p>
      )}
    </div>
  );
}
