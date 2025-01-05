"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>ChatListe</h1>
      {friends.length === 0 ? (
        <p>Keine Freunde gefunden.</p>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.friendId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              marginBottom: "10px",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>{friend.friendName}</strong>
            </p>
            <button
              onClick={() => startChat(friend)}
              style={{
                padding: "5px 10px",
                border: "none",
                backgroundColor: "#007BFF",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Chat
            </button>
          </div>
        ))
      )}
    </div>
  );
}
