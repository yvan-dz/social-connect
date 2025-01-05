"use client";

import { useState } from "react";
import { auth } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import "@/styles/login.css"; // Importiere das CSS

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login erfolgreich!");
      router.push("/"); // Weiterleitung zur Startseite nach Login
    } catch (err) {
      setError("Fehler beim Anmelden. Bitte überprüfen Sie Ihre Daten.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-input-group">
          <label htmlFor="email" className="login-label">E-Mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="login-input-group">
          <label htmlFor="password" className="login-label">Passwort:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <button type="submit" className="login-button">
          Anmelden
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
}
