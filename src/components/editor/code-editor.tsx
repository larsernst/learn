"use client";

import type { CodeFormState } from "@/lib/editor/payload";
import { CODE_LANGUAGES, CODE_LIMIT_PRESETS } from "@/lib/editor/payload";

export function CodeEditor({
  value,
  onChange,
  judge0Enabled,
}: {
  value: CodeFormState;
  onChange: (v: CodeFormState) => void;
  judge0Enabled: boolean;
}) {
  function setTestCase(idx: number, patch: Partial<CodeFormState["testCases"][number]>) {
    onChange({
      ...value,
      testCases: value.testCases.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    });
  }

  const activePreset = CODE_LIMIT_PRESETS.findIndex(
    (p) => p.timeLimitMs === value.timeLimitMs && p.memoryLimitKb === value.memoryLimitKb
  );

  return (
    <div className="stack">
      {!judge0Enabled && (
        <div
          className="badge"
          style={{ background: "rgba(138,75,8,0.12)", color: "#8a4b08", fontSize: 12 }}
        >
          Hinweis: Judge0 ist auf diesem Server deaktiviert (JUDGE0_ENABLED=false) – die
          Aufgabe kann gespeichert, von Lernenden aber nicht ausgeführt werden.
        </div>
      )}

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 220px" }}>
          <label>Programmiersprache</label>
          <select
            className="input"
            value={value.languageId}
            onChange={(e) => onChange({ ...value, languageId: Number(e.target.value) })}
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.languageId} value={l.languageId}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: "0 0 240px" }}>
          <label>Ressourcen-Limits</label>
          <select
            className="input"
            value={activePreset === -1 ? "custom" : activePreset}
            onChange={(e) => {
              const p = CODE_LIMIT_PRESETS[Number(e.target.value)];
              if (p) onChange({ ...value, timeLimitMs: p.timeLimitMs, memoryLimitKb: p.memoryLimitKb });
            }}
          >
            {CODE_LIMIT_PRESETS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}
              </option>
            ))}
            {activePreset === -1 && <option value="custom">Individuell</option>}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Starter-Code (Vorgabe für Lernende)</label>
        <textarea
          className="textarea"
          rows={8}
          value={value.starterCode}
          onChange={(e) => onChange({ ...value, starterCode: e.target.value })}
          style={{ fontFamily: "monospace", fontSize: 13 }}
          spellCheck={false}
        />
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <div className="row row--between" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ fontSize: 14 }}>Testfälle ({value.testCases.length})</strong>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              onChange({
                ...value,
                testCases: [...value.testCases, { input: "", expectedOutput: "", hidden: false }],
              })
            }
          >
            + Testfall
          </button>
        </div>
        {value.testCases.map((t, idx) => (
          <div key={idx} className="card" style={{ padding: 12 }}>
            <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label>Eingabe (stdin)</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={t.input}
                  onChange={(e) => setTestCase(idx, { input: e.target.value })}
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                  spellCheck={false}
                />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label>Erwartete Ausgabe</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={t.expectedOutput}
                  onChange={(e) => setTestCase(idx, { expectedOutput: e.target.value })}
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                  spellCheck={false}
                />
              </div>
              <div className="stack" style={{ gap: 4, paddingTop: 22 }}>
                <label className="row" style={{ gap: 6, fontSize: 12, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={t.hidden}
                    onChange={(e) => setTestCase(idx, { hidden: e.target.checked })}
                  />
                  Versteckt
                </label>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={value.testCases.length <= 1}
                  onClick={() =>
                    onChange({ ...value, testCases: value.testCases.filter((_, i) => i !== idx) })
                  }
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 11, margin: "6px 0 0" }}>
              {t.hidden
                ? "Versteckt: Lernende sehen weder Ein- noch Ausgabe."
                : "Öffentlich: Lernende sehen Ein- und erwartete Ausgabe."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
