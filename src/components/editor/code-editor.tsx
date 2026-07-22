"use client";

import { useState } from "react";
import type { CodeFormState } from "@/lib/editor/payload";
import { buildCodePayload, CODE_LANGUAGES, CODE_LIMIT_PRESETS } from "@/lib/editor/payload";
import type { CodeGradeDetail } from "@/lib/judge0/grade";

export function CodeEditor({
  value,
  onChange,
  judge0Enabled,
  courseId,
}: {
  value: CodeFormState;
  onChange: (v: CodeFormState) => void;
  judge0Enabled: boolean;
  courseId: string;
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

  // Musterlösungs-Check (Judge0, serverseitig)
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<{
    correct: boolean;
    detail?: CodeGradeDetail | null;
  } | null>(null);

  async function runReferenceCheck() {
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    const res = await fetch(`/api/courses/${courseId}/questions/code-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: buildCodePayload(value) }),
    });
    setChecking(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCheckError(body.error ?? `Prüflauf fehlgeschlagen (${res.status}).`);
      return;
    }
    setCheckResult((await res.json()) as { correct: boolean; detail?: CodeGradeDetail | null });
  }

  return (
    <div className="stack">
      {!judge0Enabled && (
        <div
          className="badge"
          style={{ background: "var(--ds-background-warning-subtle)", color: "var(--ds-text-warning)", fontSize: 12 }}
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

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 220px" }}>
          <label>Vergleichsmodus</label>
          <select
            className="input"
            value={value.comparisonMode}
            onChange={(e) =>
              onChange({
                ...value,
                comparisonMode: e.target.value as CodeFormState["comparisonMode"],
              })
            }
          >
            <option value="exact">Exakt (Byte-gleich)</option>
            <option value="trim">Whitespace-tolerant (Zeilenenden)</option>
            <option value="float">Float-tolerant (Zahlen mit Toleranz)</option>
          </select>
        </div>
        {value.comparisonMode === "float" && (
          <div className="field" style={{ flex: "0 0 180px" }}>
            <label>Float-Toleranz</label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={value.floatTolerance}
              onChange={(e) => onChange({ ...value, floatTolerance: e.target.value })}
              placeholder="0.0001"
            />
          </div>
        )}
      </div>
      <p className="muted text-xs" style={{ margin: "-4px 0 0" }}>
        {value.comparisonMode === "exact" &&
          "Exakt: Ausgabe muss Byte für Byte stimmen (inkl. Zeilenumbrüche)."}
        {value.comparisonMode === "trim" &&
          "Whitespace-tolerant: Leerzeichen/-zeilen am Zeilenende werden ignoriert."}
        {value.comparisonMode === "float" &&
          "Float-tolerant: Zahlen dürfen um die Toleranz abweichen (z. B. 15.3333 vs. 15.33333)."}
      </p>

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

      <div className="field">
        <label>Musterlösung (optional – nur für Autoren sichtbar)</label>
        <textarea
          className="textarea"
          rows={8}
          value={value.referenceSolution}
          onChange={(e) => onChange({ ...value, referenceSolution: e.target.value })}
          style={{ fontFamily: "monospace", fontSize: 13 }}
          spellCheck={false}
          placeholder="Referenzlösung – wird niemals an Lernende ausgeliefert"
        />
        <div className="row" style={{ gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={!judge0Enabled || checking || !value.referenceSolution.trim()}
            onClick={runReferenceCheck}
          >
            {checking ? "Prüflauf läuft …" : "Musterlösung gegen Tests prüfen"}
          </button>
          {!judge0Enabled && (
            <span className="muted text-xs">
              benötigt aktives Judge0
            </span>
          )}
          {checkResult && (
            <span
              className={`badge${checkResult.correct ? " badge--success" : " badge--warn"}`}
              style={{ fontSize: 12 }}
            >
              {checkResult.correct
                ? "✓ Musterlösung besteht alle Tests"
                : "✗ Musterlösung scheitert an mindestens einem Test"}
            </span>
          )}
        </div>
        {checkError && (
          <p className="badge badge--danger badge--sm">
            {checkError}
          </p>
        )}
        {checkResult?.detail?.perTest && (
          <div className="stack" style={{ gap: 4, marginTop: 6 }}>
            {checkResult.detail.perTest.map((t) => (
              <div key={t.id} className="row" style={{ gap: 8, fontSize: 12, alignItems: "center" }}>
                <span className={`badge${t.passed ? " badge--success" : " badge--warn"}`} style={{ fontSize: 11 }}>
                  {t.passed ? "✓" : "✗"}
                </span>
                <span>
                  {t.hidden ? "Versteckter Test" : `Test ${t.id}`} – {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
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
                testCases: [...value.testCases, { input: "", args: "", expectedOutput: "", hidden: false }],
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
                <input
                  className="input"
                  type="text"
                  value={t.args}
                  onChange={(e) => setTestCase(idx, { args: e.target.value })}
                  placeholder="argv (optional, z. B. wort1 wort2)"
                  style={{ fontFamily: "monospace", fontSize: 12, marginTop: 4 }}
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
            <p className="muted text-xs" style={{ margin: "6px 0 0" }}>
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
