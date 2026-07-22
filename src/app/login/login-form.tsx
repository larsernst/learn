"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/lernen");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Anmeldung fehlgeschlagen.");
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      {error && (
        <div className="badge badge--danger">
          {error}
        </div>
      )}
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
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? "Prüfe …" : "Anmelden"}
      </button>
      <p className="muted text-sm">
        Noch kein Konto?{" "}
        <Link href="/registrieren">Jetzt registrieren</Link>.
      </p>
    </form>
  );
}