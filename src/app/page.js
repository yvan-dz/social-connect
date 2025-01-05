"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import "@/styles/home.css";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [editComment, setEditComment] = useState(null);
  const [updatedCommentText, setUpdatedCommentText] = useState("");

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
            const userRef = doc(db, "users", post.authorId);
            const userSnap = await getDoc(userRef);
            const username = userSnap.exists() ? userSnap.data().name : "Unbekannt";

            return {
              id: postDoc.id,
              ...post,
              authorName: username,
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

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
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
    <div className="container">
      {user ? (
        <>
          <h1>Beiträge</h1>
          {posts.length === 0 ? (
            <p className="no-posts">Keine Beiträge verfügbar.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                {post.imageURL && (
                  <img
                    src={post.imageURL}
                    alt="Post-Bild"
                    className="post-image"
                  />
                )}
                <p className="post-meta">
                  Ersteller: <strong>{post.authorName}</strong> | Erstellt am:{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Unbekannt"}
                </p>
                <div className="post-actions">
                  <button
                    className="like-button"
                    onClick={() => handleVote(post.id, "like")}
                  >
                    👍 {post.likes?.length || 0}
                  </button>
                  <button
                    className="dislike-button"
                    onClick={() => handleVote(post.id, "dislike")}
                  >
                    👎 {post.dislikes?.length || 0}
                  </button>
                </div>
                <div className="comments-section">
                  <h4>Kommentare:</h4>
                  <ul className="comments-list">
                    {post.comments?.map((comment, index) => (
                      <li key={index} className="comment">
                        <div className="comment-wrapper">
                          {comment.profileImage && (
                            <img
                              src={comment.profileImage}
                              alt="Profilbild"
                              className="comment-image"
                            />
                          )}
                          <div className="comment-content">
                            <strong>{comment.username}</strong>
                            {editComment === comment.createdAt ? (
                              <input
                                type="text"
                                value={updatedCommentText}
                                onChange={(e) =>
                                  setUpdatedCommentText(e.target.value)
                                }
                                className="comment-edit-input"
                              />
                            ) : (
                              <p>{comment.text}</p>
                            )}
                          </div>
                          {comment.userId === user.uid && (
                            <div className="comment-actions">
                              <button
                                className="edit-button"
                                onClick={() =>
                                  editComment
                                    ? handleEditComment(post.id, comment)
                                    : setEditComment(comment.createdAt)
                                }
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-button"
                                onClick={() =>
                                  handleDeleteComment(post.id, comment)
                                }
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="comment-input-wrapper">
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={(e) =>
                        setCommentText((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      className="comment-input"
                      placeholder="Einen Kommentar schreiben..."
                    />
                    <button
                      className="send-button"
                      onClick={() => handleComment(post.id)}
                    >
                      Senden
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <p className="not-logged-in">Bitte melde dich an.</p>
      )}
    </div>
  );
  
}
