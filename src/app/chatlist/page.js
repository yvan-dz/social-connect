"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import "@/styles/chatList.css"; // Importiere das CSS

export default function ChatList() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const router = useRouter();

  // Überprüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Freunde abrufen
  useEffect(() => {
    if (!user) return;

    const friendsQuery = query(
      collection(db, "friendships"),
      where("status", "==", "accepted"),
      where("receiverId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      const friendsData = await Promise.all(
        snapshot.docs.map(async (document) => {
          const data = document.data();
          const friendId =
            data.senderId === user.uid ? data.receiverId : data.senderId;

          const friendRef = doc(db, "users", friendId);
          const friendDoc = await getDoc(friendRef);
          const friendName = friendDoc.exists() ? friendDoc.data().name : "Unbekannt";

          return {
            id: document.id,
            friendName,
            friendId,
          };
        })
      );
      setFriends(friendsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Chat starten
  const startChat = (friend) => {
    router.push(`/chat?friendName=${friend.friendName}&friendId=${friend.friendId}`);
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">ChatListe</h1>
      {friends.length === 0 ? (
        <p className="chat-empty">Keine Freunde gefunden.</p>
      ) : (
        friends.map((friend) => (
          <div key={friend.friendId} className="chat-item">
            <p className="chat-friend-name">
              <strong>{friend.friendName}</strong>
            </p>
            <button
              className="chat-button"
              onClick={() => startChat(friend)}
            >
              Chat
            </button>
          </div>
        ))
      )}
    </div>
  );
}
