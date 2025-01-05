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
import "@/styles/friend.css"; // CSS importieren

export default function FriendsPage() {
  const [user, setUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = () => {
      const usersCollection = collection(db, "users");

      const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
        const usersData = snapshot.docs
          ? snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((u) => u.name !== "Max Mustermann")
          : [];
        setUsers(usersData);
      });

      return () => unsubscribe();
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, "friendships"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (document) => {
          try {
            const data = document.data();
            if (!data.senderId) throw new Error("Sender ID fehlt.");

            const senderRef = doc(db, "users", data.senderId);
            const senderDoc = await getDoc(senderRef);
            const senderName = senderDoc.exists()
              ? senderDoc.data().name
              : "Unbekannt";

            return {
              id: document.id,
              senderName,
              ...data,
            };
          } catch (error) {
            console.error("Fehler beim Abrufen einer Anfrage:", error);
            return null;
          }
        })
      );
      setFriendRequests(requests.filter((r) => r !== null));
    });

    return () => unsubscribe();
  }, [user]);

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
          try {
            const data = document.data();
            const friendId =
              data.senderId === user.uid ? data.receiverId : data.senderId;
            if (!friendId) throw new Error("Friend ID fehlt.");

            const friendRef = doc(db, "users", friendId);
            const friendDoc = await getDoc(friendRef);
            const friendName = friendDoc.exists()
              ? friendDoc.data().name
              : "Unbekannt";

            return {
              id: document.id,
              friendName,
              friendId,
            };
          } catch (error) {
            console.error("Fehler beim Abrufen eines Freundes:", error);
            return null;
          }
        })
      );
      setFriends(friendsData.filter((f) => f !== null));
    });

    return () => unsubscribe();
  }, [user]);

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
      alert(
        "Freundschaftsanfrage bereits gesendet oder ihr seid schon Freunde."
      );
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

  const handleFriendRequest = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "friendships", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Die Anfrage existiert nicht.");
      }

      const requestData = requestDoc.data();

      await updateDoc(requestRef, {
        status: newStatus,
      });

      if (newStatus === "accepted") {
        const reverseFriendshipRef = collection(db, "friendships");
        await addDoc(reverseFriendshipRef, {
          senderId: requestData.receiverId,
          receiverId: requestData.senderId,
          status: "accepted",
          createdAt: serverTimestamp(),
        });
      }

      alert(
        `Anfrage wurde ${
          newStatus === "accepted" ? "angenommen" : "abgelehnt"
        }!`
      );
    } catch (err) {
      console.error("Fehler beim Beantworten der Anfrage:", err);
    }
  };

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
    <div className="container">
      {user ? (
        <>
          <h1>Freundschaftsfunktionen</h1>

          <div className="user-list">
            <h3>Vorgeschlagene Nutzer</h3>
            {users.length === 0 ? (
              <p className="no-data">Keine Benutzer gefunden.</p>
            ) : (
              <ul>
                {users
                  .filter((u) => u.id !== user.uid)
                  .map((u) => (
                    <li key={u.id} className="user-item">
                      {u.photoURL && (
                        <img src={u.photoURL} alt="Profilbild" />
                      )}
                      <div>
                        <p className="name">{u.name || "Unbekannt"}</p>
                        <p className="email">{u.email}</p>
                      </div>
                      <button
                        className="send-button"
                        onClick={() => sendFriendRequest(u.id)}
                      >
                        Anfrage senden
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="friend-requests">
            <h3>Freundschaftsanfragen</h3>
            {friendRequests.length === 0 ? (
              <p className="no-data">Keine ausstehenden Anfragen.</p>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="request-item">
                  <p>
                    Anfrage von: <strong>{request.senderName}</strong>
                  </p>
                  <button
                    className="accept-button"
                    onClick={() => handleFriendRequest(request.id, "accepted")}
                  >
                    Annehmen
                  </button>
                  <button
                    className="decline-button"
                    onClick={() => handleFriendRequest(request.id, "declined")}
                  >
                    Ablehnen
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="friends-list">
            <h3>Meine Freunde</h3>
            {friends.length === 0 ? (
              <p className="no-data">Keine Freunde gefunden.</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  <p>
                    Freund: <strong>{friend.friendName}</strong>
                  </p>
                  <button
                    className="remove-button"
                    onClick={() => removeFriend(friend.friendId)}
                  >
                    Entfernen
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="welcome-message">
          <h1>Willkommen bei der Freundschaftsfunktion!</h1>
          <p>Bitte registriere dich oder logge dich ein, um loszulegen.</p>
        </div>
      )}
    </div>
  );
}
