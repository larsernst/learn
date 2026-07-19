"use client";

import type { TaskType } from "@/lib/tasks/types";

const TYPE_CARDS: {
  type: TaskType;
  icon: string;
  name: string;
  description: string;
  suitedFor: string;
}[] = [
  {
    type: "recall",
    icon: "✍️",
    name: "Freie Erinnerung",
    description: "Frage beantworten, Musterlösung aufdecken, selbst bewerten.",
    suitedFor: "Definitionen, Erklärungen, Zusammenhänge",
  },
  {
    type: "mcq",
    icon: "☑️",
    name: "Multiple-Choice",
    description: "Eine oder mehrere richtige Optionen auswählen (auto-bewertet).",
    suitedFor: "„Nennen Sie …“-Listen, Begriffe abgrenzen",
  },
  {
    type: "dragdrop",
    icon: "🗂️",
    name: "Zuordnen",
    description: "Elemente per Auswahl den richtigen Zonen zuordnen.",
    suitedFor: "Kategorien, Schichten, Komponenten zuweisen",
  },
  {
    type: "cloze",
    icon: "🧩",
    name: "Lückentext",
    description: "Fehlende Begriffe im Text ergänzen (auto-bewertet).",
    suitedFor: "Fachbegriffe, Abläufe im Textzusammenhang",
  },
  {
    type: "order",
    icon: "🔢",
    name: "Sortieren",
    description: "Elemente in die richtige Reihenfolge bringen.",
    suitedFor: "Schrittfolgen, Prioritäten, OSI-Schichten",
  },
  {
    type: "code",
    icon: "💻",
    name: "Code-Aufgabe",
    description: "Programm schreiben, das Testfälle besteht (Judge0).",
    suitedFor: "Algorithmen, Scheduling, Skripte",
  },
];

export function TypePicker({
  value,
  onChange,
}: {
  value: TaskType;
  onChange: (t: TaskType) => void;
}) {
  return (
    <div className="field">
      <label>Aufgabentyp</label>
      <div className="grid grid--3" style={{ gap: 8 }}>
        {TYPE_CARDS.map((c) => (
          <button
            key={c.type}
            type="button"
            onClick={() => onChange(c.type)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              font: "inherit",
              padding: "10px 12px",
              borderRadius: "var(--ds-radius)",
              border: `2px solid ${value === c.type ? "var(--ds-brand, #1868db)" : "var(--ds-border)"}`,
              background: value === c.type ? "rgba(24,104,219,0.06)" : "var(--ds-surface, #fff)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              <span style={{ marginRight: 6 }}>{c.icon}</span>
              {c.name}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {c.description}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4, fontStyle: "italic" }}>
              Geeignet für: {c.suitedFor}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
