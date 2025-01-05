"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const friendName = searchParams.get("friendName");
  const friendId = searchParams.get("friendId");

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Benutzer überprüfen
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser({ ...currentUser, displayName: userDoc.data().name });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Nachrichten abrufen
  useEffect(() => {
    if (!user || !friendId) return;

    const chatId = [user.uid, friendId].sort().join("_"); // Chat-ID erstellen
    const messagesQuery = collection(db, "chats", chatId, "messages");

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [user, friendId]);

  // Nachricht senden
  const sendMessage = async () => {
    if (!messageText.trim() || !user || !friendId) return;

    const chatId = [user.uid, friendId].sort().join("_");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText.trim(),
        senderId: user.uid,
        senderName: user.displayName || "Unbekannt",
        createdAt: serverTimestamp(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
    }
  };

  // Nachricht bearbeiten
  const editMessage = async (messageId) => {
    const chatId = [user.uid, friendId].sort().join("_");

    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      await updateDoc(messageRef, {
        text: editingText,
      });
      setEditingMessage(null);
      setEditingText("");
    } catch (error) {
      console.error("Fehler beim Bearbeiten der Nachricht:", error);
    }
  };

  // Nachricht löschen
  const deleteMessage = async (messageId) => {
    const chatId = [user.uid, friendId].sort().join("_");

    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error("Fehler beim Löschen der Nachricht:", error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>
        Chat: {user?.displayName} 🤝 {friendName}
      </h1>
      <div
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "10px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <p>Keine Nachrichten.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: "10px",
                textAlign: msg.senderId === user.uid ? "right" : "left",
              }}
            >
             
              {editingMessage === msg.id ? (
                <div>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    style={{
                      margin: "5px 0",
                      padding: "5px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                  />
                  <button
                    onClick={() => editMessage(msg.id)}
                    style={{
                      padding: "5px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setEditingText("");
                    }}
                    style={{
                      padding: "5px",
                      backgroundColor: "#F44336",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginLeft: "5px",
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <p
                  style={{
                    margin: "5px 0",
                    backgroundColor: msg.senderId === user.uid ? "#4CAF50" : "#007BFF",
                    color: "white",
                    display: "inline-block",
                    padding: "10px",
                    borderRadius: "10px",
                    maxWidth: "70%",
                    wordWrap: "break-word",
                  }}
                >
                  {msg.senderName}: {msg.text}
                </p>
              )}
              {msg.senderId === user.uid && (
                <div>
                  <button
                    onClick={() => {
                      setEditingMessage(msg.id);
                      setEditingText(msg.text);
                    }}
                    style={{
                      marginRight: "10px",
                      padding: "5px",
                      backgroundColor: "#FFA500",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    style={{
                      padding: "5px",
                      backgroundColor: "#F44336",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Nachricht schreiben..."
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            marginRight: "10px",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px",
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
  );
}
