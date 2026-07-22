"use client";

import { useState } from "react";
import type { SettingsPatch } from "@/lib/types";

export default function SettingsClient({
  initialMcqEnabled,
  initialSimpleGrading,
  initialNewQuestionsFirst,
}: {
  initialMcqEnabled: boolean;
  initialSimpleGrading: boolean;
  initialNewQuestionsFirst: boolean;
}) {
  const [mcqEnabled, setMcqEnabled] = useState(initialMcqEnabled);
  const [simpleGrading, setSimpleGrading] = useState(initialSimpleGrading);
  const [newQuestionsFirst, setNewQuestionsFirst] = useState(initialNewQuestionsFirst);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function patch(data: SettingsPatch) {
    setSaved(false);
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  function toggleMcq(next: boolean) {
    setMcqEnabled(next);
    void patch({ mcqEnabled: next });
  }

  function toggleSimpleGrading(next: boolean) {
    setSimpleGrading(next);
    void patch({ simpleGrading: next });
  }

  function toggleNewQuestionsFirst(next: boolean) {
    setNewQuestionsFirst(next);
    void patch({ newQuestionsFirst: next });
  }

  return (
    <div className="stack">
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <div>
          <strong>Multiple-Choice-Aufgaben</strong>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            Wenn aktiviert, werden „Nennen…"-Fragen als Mehrfachauswahl angezeigt.
            Wenn deaktiviert, werden alle Fragen als freie Erinnerung behandelt.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={mcqEnabled}
            onChange={(e) => toggleMcq(e.target.checked)}
            disabled={saving}
          />
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
        </label>
      </div>
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <div>
          <strong>Einfache Bewertung (Richtig/Falsch)</strong>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            Bei Freitext-Fragen nur noch Richtig/Falsch bewerten statt 4 Stufen.
            Falsch beantwortete Fragen kommen später in der Sitzung erneut.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={simpleGrading}
            onChange={(e) => toggleSimpleGrading(e.target.checked)}
            disabled={saving}
          />
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
        </label>
      </div>
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <div>
          <strong>Neue Fragen zuerst lernen</strong>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            Standardmäßig aktiviert – lernt neue Fragen, bevor bereits Gelerntes
            gefestigt wird. Ausschalten, um erst fällige Wiederholungen zu festigen.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={newQuestionsFirst}
            onChange={(e) => toggleNewQuestionsFirst(e.target.checked)}
            disabled={saving}
          />
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
        </label>
      </div>
      {saved && <span className="badge badge--success">Gespeichert</span>}
    </div>
  );
}