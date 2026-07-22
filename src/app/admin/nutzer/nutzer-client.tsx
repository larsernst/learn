"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ROLE, EDITOR_ROLE } from "@/lib/roles";

type User = {
  id: string;
  name: string;
  email: string;
  mcqEnabled: boolean;
  createdAt: string;
  roles: string[];
};

export default function NutzerClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function jsonHeaders(): Record<string, string> {
    return { "Content-Type": "application/json" };
  }

  // 401/403 → Server leitet bereits um, aber falls der API-Call zurückkommt,
  // zeigen wir eine verständliche Nachricht statt "Token ungültig".
  function handleAuthFail(status: number): boolean {
    if (status === 401 || status === 403) {
      setError("Keine Admin-Berechtigung. Bitte als Admin anmelden.");
      return true;
    }
    return false;
  }

  const loadUsers = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
    const res = await fetch(url);
    setLoading(false);
    if (handleAuthFail(res.status)) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Nutzer konnten nicht geladen werden.");
      return;
    }
    const data = await res.json();
    setUsers(data.users as User[]);
  }, []);

  useEffect(() => {
    loadUsers(query);
  }, [query, loadUsers]);

  async function saveEdit(
    id: string,
    data: {
      name?: string;
      email?: string;
      mcqEnabled?: boolean;
      addRoles?: string[];
      removeRoles?: string[];
    }
  ) {
    setSuccess(null);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    if (handleAuthFail(res.status)) return;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setEditingId(null);
    setSuccess("Nutzer aktualisiert.");
    await loadUsers(query);
  }

  async function resetPassword(id: string, name: string, newPassword: string) {
    setSuccess(null);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ userId: id, newPassword }),
    });
    if (handleAuthFail(res.status)) return;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Passwort konnte nicht zurückgesetzt werden.");
      return;
    }
    setSuccess(`Passwort für „${name}“ zurückgesetzt.`);
  }

  async function removeUser(user: User) {
    if (!window.confirm(`Nutzer „${user.name}" (${user.email}) wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setSuccess(null);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (handleAuthFail(res.status)) return;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setSuccess(`Nutzer „${user.name}" gelöscht.`);
    await loadUsers(query);
  }

  return (
    <div className="stack">
      {error && (
        <div className="badge badge--danger">
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}

      <div className="field">
        <label htmlFor="search">Suche</label>
        <input
          id="search"
          type="search"
          className="input"
          placeholder="Name oder E-Mail …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <span className="muted text-sm">
        {loading ? "Lädt …" : `${users.length} Nutzer`}
      </span>

      {users.length === 0 && !loading ? (
        <p className="muted">Keine Nutzer gefunden.</p>
      ) : (
        <div className="stack">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              editing={editingId === u.id}
              onEdit={() => setEditingId(u.id)}
              onCancel={() => setEditingId(null)}
              onSave={saveEdit}
              onResetPassword={resetPassword}
              onDelete={() => removeUser(u)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  editing,
  onEdit,
  onCancel,
  onSave,
  onResetPassword,
  onDelete,
}: {
  user: User;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (
    id: string,
    data: {
      name?: string;
      email?: string;
      mcqEnabled?: boolean;
      addRoles?: string[];
      removeRoles?: string[];
    }
  ) => Promise<void>;
  onResetPassword: (id: string, name: string, newPassword: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mcqEnabled, setMcqEnabled] = useState(user.mcqEnabled);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setMcqEnabled(user.mcqEnabled);
  }, [user.name, user.email, user.mcqEnabled]);

  if (editing) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="stack">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>E-Mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="row" style={{ gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={mcqEnabled}
              onChange={(e) => setMcqEnabled(e.target.checked)}
            />
            Multiple-Choice-Fragen aktiviert
          </label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() =>
                onSave(user.id, {
                  name: name !== user.name ? name : undefined,
                  email: email !== user.email ? email : undefined,
                  mcqEnabled: mcqEnabled !== user.mcqEnabled ? mcqEnabled : undefined,
                })
              }
            >
              Speichern
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.roles.includes(ADMIN_ROLE);
  const isEditor = user.roles.includes(EDITOR_ROLE);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <strong>
            {user.name}{" "}
            {isAdmin && <span className="badge badge--muted badge--sm">Admin</span>}
            {!isAdmin && isEditor && (
              <span className="badge badge--muted badge--sm">Editor</span>
            )}
          </strong>
          <span className="muted text-sm">{user.email}</span>
          <span className="muted text-xs">
            Registriert: {new Date(user.createdAt).toLocaleDateString("de-DE")}
          </span>
          <span className={`badge ${user.mcqEnabled ? "badge--success" : ""}`} style={{ fontSize: 11 }}>
            MCQ {user.mcqEnabled ? "an" : "aus"}
          </span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              onSave(user.id, isAdmin ? { removeRoles: [ADMIN_ROLE] } : { addRoles: [ADMIN_ROLE] })
            }
          >
            {isAdmin ? "Admin entziehen" : "Zum Admin machen"}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              onSave(user.id, isEditor ? { removeRoles: [EDITOR_ROLE] } : { addRoles: [EDITOR_ROLE] })
            }
          >
            {isEditor ? "Editor entziehen" : "Zum Editor machen"}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
            Bearbeiten
          </button>
          <button type="button" className="btn btn--ghost-danger btn--sm" onClick={onDelete}>
            Löschen
          </button>
        </div>
      </div>

      <div className="divider" style={{ margin: "12px 0" }} />

      <form
        className="row"
        style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (newPassword.length < 8) return;
          onResetPassword(user.id, user.name, newPassword);
          setNewPassword("");
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 13 }}>Neues Passwort</label>
          <input
            className="input"
            type="password"
            placeholder="Mind. 8 Zeichen"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={newPassword.length < 8}>
          Passwort zurücksetzen
        </button>
      </form>
    </div>
  );
}
