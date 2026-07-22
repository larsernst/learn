"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/lernen");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Registrierung fehlgeschlagen.");
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      {error && (
        <div className="badge badge--danger">
          {error}
        </div>
      )}
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort (min. 8 Zeichen)</label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? "Wird erstellt …" : "Konto erstellen"}
      </button>
      <p className="muted text-sm">
        Bereits registriert?{" "}
        <Link href="/login">Hier anmelden</Link>.
      </p>
    </form>
  );
}