"use client";

import { useRef } from "react";
import type { ClozeBlankDef } from "@/lib/editor/cloze-text";
import { insertBlankMarker } from "@/lib/editor/cloze-text";

export type ClozeFormState = {
  text: string;
  blanks: ClozeBlankDef[];
};

// Lückentext-Editor: Fließtext schreiben, Wort markieren → „Lücke" klicken.
// Marker erscheinen als [[n]] im Text; pro Lücke akzeptierte Antworten
// (eine pro Zeile) und Normalisierung.
export function ClozeEditor({
  value,
  onChange,
}: {
  value: ClozeFormState;
  onChange: (v: ClozeFormState) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function makeBlank() {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    if (start === end) return;
    const result = insertBlankMarker(value.text, start, end, value.blanks);
    onChange({ text: result.text, blanks: result.blanks });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + result.blankId.length + 4;
      ta.setSelectionRange(pos, pos);
    });
  }

  function setBlank(blankId: string, patch: Partial<ClozeBlankDef>) {
    onChange({
      ...value,
      blanks: value.blanks.map((b) => (b.blankId === blankId ? { ...b, ...patch } : b)),
    });
  }

  function removeBlank(blankId: string) {
    // Marker durch die erste akzeptierte Antwort ersetzen (oder löschen).
    const blank = value.blanks.find((b) => b.blankId === blankId);
    const replacement = blank?.accepted[0] ?? "";
    onChange({
      text: value.text.replace(`[[${blankId}]]`, replacement),
      blanks: value.blanks.filter((b) => b.blankId !== blankId),
    });
  }

  const sorted = [...value.blanks].sort((a, b) => Number(a.blankId) - Number(b.blankId));

  return (
    <div className="stack">
      <div className="row row--between" style={{ alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <strong style={{ fontSize: 14 }}>Lückentext</strong>
        <button type="button" className="btn btn--secondary btn--sm" onClick={makeBlank}>
          Aus Auswahl Lücke machen
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Text schreiben, ein Wort oder einen Satzteil markieren und auf „Aus Auswahl
        Lücke machen" klicken. Lücken erscheinen als [[1]], [[2]] … im Text.
      </p>
      <textarea
        ref={ref}
        className="textarea"
        rows={5}
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="Fließtext mit Lücken …"
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />

      {sorted.length > 0 && (
        <div className="stack" style={{ gap: 10 }}>
          <strong style={{ fontSize: 14 }}>Lücken ({sorted.length})</strong>
          {sorted.map((b) => (
            <div
              key={b.blankId}
              className="card"
              style={{ padding: 12, borderLeft: "3px solid var(--ds-brand, #1868db)" }}
            >
              <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="badge">[[{b.blankId}]]</span>
                <select
                  className="input"
                  style={{ maxWidth: 200, fontSize: 12 }}
                  value={b.normalize}
                  onChange={(e) =>
                    setBlank(b.blankId, {
                      normalize: e.target.value as ClozeBlankDef["normalize"],
                    })
                  }
                  title="Normalisierung der Eingabe"
                >
                  <option value="ignore-case">Groß-/Klein egal (empfohlen)</option>
                  <option value="exact">Exakt</option>
                  <option value="trim">Leerzeichen egal</option>
                  <option value="regex">Regex-Muster</option>
                </select>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => removeBlank(b.blankId)}
                  title="Lücke auflösen (Text wiederherstellen)"
                >
                  ✕
                </button>
              </div>
              <textarea
                className="textarea"
                rows={Math.max(1, b.accepted.length)}
                style={{ marginTop: 8, fontSize: 13 }}
                value={b.accepted.join("\n")}
                onChange={(e) =>
                  setBlank(b.blankId, { accepted: e.target.value.split("\n") })
                }
                placeholder="Akzeptierte Antworten (eine pro Zeile)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
