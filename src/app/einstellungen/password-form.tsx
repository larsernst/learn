"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      reset();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Passwort konnte nicht geändert werden.");
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      {error && (
        <div className="badge badge--danger">
          {error}
        </div>
      )}
      {saved && <span className="badge badge--success">Passwort geändert</span>}
      <div className="field">
        <label htmlFor="currentPassword">Aktuelles Passwort</label>
        <input
          id="currentPassword"
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="field">
        <label htmlFor="newPassword">Neues Passwort</label>
        <input
          id="newPassword"
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="muted text-sm" style={{ marginTop: 4 }}>
          Mindestens 8 Zeichen.
        </p>
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Neues Passwort bestätigen</label>
        <input
          id="confirmPassword"
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? "Speichern …" : "Passwort ändern"}
      </button>
    </form>
  );
}
