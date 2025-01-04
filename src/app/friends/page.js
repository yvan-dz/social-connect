"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export default function FriendsPage() {
  const [user, setUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]); // Liste aller Benutzer
  const [sentRequests, setSentRequests] = useState([]); // Gesendete Anfragen

  // Überprüfen, ob der Benutzer eingeloggt ist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Liste aller Benutzer abrufen
  useEffect(() => {
    const fetchUsers = () => {
      const usersCollection = collection(db, "users");

      const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
        const usersData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u) => u.name !== "Max Mustermann"); // "Max Mustermann" entfernen
        setUsers(usersData);
      });

      return () => unsubscribe();
    };

    fetchUsers();
  }, []);

  // Freundschaftsanfragen abrufen
  useEffect(() => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, "friendships"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const senderDoc = await getDoc(doc(db, "users", data.senderId));
          const senderName = senderDoc.exists() ? senderDoc.data().name : "Unbekannt";

          return {
            id: doc.id,
            senderName,
            ...data,
          };
        })
      );
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [user]);

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
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const friendId =
            data.senderId === user.uid ? data.receiverId : data.senderId;
          const friendDoc = await getDoc(doc(db, "users", friendId));
          const friendName = friendDoc.exists() ? friendDoc.data().name : "Unbekannt";

          return {
            id: doc.id,
            friendName,
            friendId,
          };
        })
      );
      setFriends(friendsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Gesendete Freundschaftsanfragen abrufen
  useEffect(() => {
    if (!user) return;

    const sentQuery = query(
      collection(db, "friendships"),
      where("senderId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(sentQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => doc.data().receiverId);
      setSentRequests(requests);
    });

    return () => unsubscribe();
  }, [user]);

  // Freundschaftsanfrage senden
  const sendFriendRequest = async (receiverId) => {
    if (!receiverId.trim()) {
      alert("Bitte wähle einen Benutzer aus.");
      return;
    }

    if (!user) {
      alert("Bitte melde dich an, um eine Freundschaftsanfrage zu senden.");
      return;
    }

    if (
      sentRequests.includes(receiverId) ||
      friends.some((f) => f.friendId === receiverId)
    ) {
      alert("Freundschaftsanfrage bereits gesendet oder ihr seid schon Freunde.");
      return;
    }

    try {
      const friendRequestsCollection = collection(db, "friendships");
      await addDoc(friendRequestsCollection, {
        senderId: user.uid,
        receiverId: receiverId.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Freundschaftsanfrage gesendet!");
    } catch (err) {
      console.error("Fehler beim Senden der Freundschaftsanfrage:", err);
    }
  };

  // Freundschaftsanfrage beantworten
  const handleFriendRequest = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "friendships", requestId);
      await updateDoc(requestRef, {
        status: newStatus,
      });
      alert(
        `Anfrage wurde ${
          newStatus === "accepted" ? "angenommen" : "abgelehnt"
        }!`
      );
    } catch (err) {
      console.error("Fehler beim Beantworten der Anfrage:", err);
    }
  };

  // Freundschaft entfernen
  const removeFriend = async (friendId) => {
    try {
      const friendDoc = friends.find((f) => f.friendId === friendId);
      if (friendDoc) {
        const friendshipRef = doc(db, "friendships", friendDoc.id);
        await deleteDoc(friendshipRef);
        alert("Freund entfernt!");
      }
    } catch (err) {
      console.error("Fehler beim Entfernen eines Freundes:", err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      {user ? (
        <>
          <h1>Freundschaftsfunktionen</h1>

          {/* Benutzerliste anzeigen */}
          <div style={{ marginBottom: "20px" }}>
            <h3>Vorgeschlagene Nutzer</h3>
            {users.length === 0 ? (
              <p>Keine Benutzer gefunden.</p>
            ) : (
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {users
                  .filter((u) => u.id !== user.uid) // Aktuellen Benutzer ausschließen
                  .map((u) => (
                    <li
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "10px",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                      }}
                    >
                      {u.photoURL && (
                        <img
                          src={u.photoURL}
                          alt="Profilbild"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            marginRight: "10px",
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: "bold" }}>
                          {u.name || "Unbekannt"}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                          {u.email}
                        </p>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(u.id)}
                        style={{
                          padding: "5px 10px",
                          border: "none",
                          backgroundColor: "#007BFF",
                          color: "white",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Anfrage senden
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Freundschaftsanfragen anzeigen */}
          <div style={{ marginBottom: "20px" }}>
            <h3>Freundschaftsanfragen</h3>
            {friendRequests.length === 0 ? (
              <p>Keine ausstehenden Anfragen.</p>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                  }}
                >
                  <p>
                    Anfrage von: <strong>{request.senderName}</strong>
                  </p>
                  <button
                    onClick={() => handleFriendRequest(request.id, "accepted")}
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
                    Annehmen
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, "declined")}
                    style={{
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#F44336",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Ablehnen
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Freunde anzeigen */}
          <div>
            <h3>Meine Freunde</h3>
            {friends.length === 0 ? (
              <p>Keine Freunde gefunden.</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                  }}
                >
                  <p>
                    Freund: <strong>{friend.friendName}</strong>
                  </p>
                  <button
                    onClick={() => removeFriend(friend.friendId)}
                    style={{
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#FF0000",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Entfernen
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div>
          <h1>Willkommen bei der Freundschaftsfunktion!</h1>
          <p>Bitte registriere dich oder logge dich ein, um loszulegen.</p>
        </div>
      )}
    </div>
  );
}
