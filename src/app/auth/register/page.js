"use client";

import { useState } from "react";
import { auth } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import "@/styles/register.css"; // Importiere das CSS

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Registrierung erfolgreich!");
      router.push("/auth/login"); // Weiterleitung zur Login-Seite nach erfolgreicher Registrierung
    } catch (err) {
      setError("Fehler bei der Registrierung. Bitte versuchen Sie es erneut.");
    }
  };

  return (
    <div className="register-container">
      <h1 className="register-title">Registrieren</h1>
      <form className="register-form" onSubmit={handleRegister}>
        <div className="register-input-group">
          <label htmlFor="email" className="register-label">E-Mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="register-input"
          />
        </div>
        <div className="register-input-group">
          <label htmlFor="password" className="register-label">Passwort:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />
        </div>
        <button type="submit" className="register-button">
          Registrieren
        </button>
      </form>
      {error && <p className="register-error">{error}</p>}
    </div>
  );
}
