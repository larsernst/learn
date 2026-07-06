"use client";

import { useState } from "react";

export default function AdminSettingsClient({
  initialMatureThresholdDays,
}: {
  initialMatureThresholdDays: number;
}) {
  const [matureThresholdDays, setMatureThresholdDays] = useState(initialMatureThresholdDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleAuthFail(status: number): boolean {
    if (status === 401 || status === 403) {
      setError("Keine Admin-Berechtigung. Bitte als Admin anmelden.");
      return true;
    }
    return false;
  }

  async function save() {
    setError(null);
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matureThresholdDays }),
    });
    setSaving(false);
    if (handleAuthFail(res.status)) return;
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    const data = (await res.json()) as { matureThresholdDays: number };
    setMatureThresholdDays(data.matureThresholdDays);
    setSuccess(true);
  }

  return (
    <div className="stack">
      <div>
        <strong>Gefestigt-Schwellwert (Tage)</strong>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Eine Karte gilt als „gefestigt", sobald ihr SM-2-Intervall diesen Wert erreicht.
          Werte größer als das SM-2-Maximalintervall (2 Tage) ergeben „Gefestigt" = 0.
        </p>
      </div>
      <div className="row" style={{ gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="matureThresholdDays">Tage</label>
          <input
            id="matureThresholdDays"
            className="input"
            type="number"
            min={1}
            max={365}
            value={matureThresholdDays}
            onChange={(e) => setMatureThresholdDays(Number.parseInt(e.target.value, 10))}
            disabled={saving}
            style={{ width: 120 }}
          />
        </div>
        <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
          {saving ? "Speichern …" : "Speichern"}
        </button>
      </div>
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">Gespeichert.</div>}
    </div>
  );
}
