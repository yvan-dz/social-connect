"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import "@/styles/chat.css"; // Importiere das CSS

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
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [friendName, setFriendName] = useState("");
  const [friendId, setFriendId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setFriendName(queryParams.get("friendName") || "Unbekannt");
    setFriendId(queryParams.get("friendId") || "");
  }, []);

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

  useEffect(() => {
    if (!user || !friendId) return;

    const chatId = [user.uid, friendId].sort().join("_");
    const messagesQuery = collection(db, "chats", chatId, "messages");

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [user, friendId]);

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
    <div className="chat-container">
      <h1 className="chat-title">
        Chat: {user?.displayName} 🤝 {friendName}
      </h1>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">Keine Nachrichten.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.senderId === user.uid ? "chat-message-sender" : "chat-message-receiver"
              }`}
            >
              {editingMessage === msg.id ? (
                <div className="chat-edit">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="chat-edit-input"
                  />
                  <button onClick={() => editMessage(msg.id)} className="chat-edit-save">
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setEditingText("");
                    }}
                    className="chat-edit-cancel"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <p>
                  {msg.senderName}: {msg.text}
                </p>
              )}
              {msg.senderId === user.uid && (
                <div className="chat-actions">
                  <button
                    onClick={() => {
                      setEditingMessage(msg.id);
                      setEditingText(msg.text);
                    }}
                    className="chat-action-edit"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="chat-action-delete"
                  >
                    Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="chat-input-field"
        />
        <button onClick={sendMessage} className="chat-input-send">
          Senden
        </button>
      </div>
    </div>
  );
}
