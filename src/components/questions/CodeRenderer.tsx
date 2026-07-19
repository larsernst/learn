"use client";

import { useState } from "react";
import type { CodePublic } from "@/lib/tasks/code/payload";

export interface CodeRendererProps {
  payload: CodePublic;
  initialLanguageId?: number;
  sourceCode: string;
  onSourceCodeChange: (code: string) => void;
  onLanguageChange: (languageId: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  revealed: boolean;
  result?: {
    correct: boolean;
    detail?: {
      perTest?: Array<{
        id: string;
        hidden: boolean;
        passed: boolean;
        status: string;
        stdout?: string | null;
        stderr?: string | null;
        compileOutput?: string | null;
      }>;
      compileError?: string;
    } | null;
  } | null;
  judge0Enabled?: boolean;
}

export function CodeRenderer(props: CodeRendererProps) {
  const language =
    props.payload.languages.find(
      (l) => l.languageId === (props.initialLanguageId ?? props.payload.languages[0]?.languageId)
    ) ?? props.payload.languages[0];

  const [selectedLanguageId, setSelectedLanguageId] = useState(
    language?.languageId ?? 0
  );

  if (!props.judge0Enabled) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p className="badge badge--warn">
          Code-Aufgaben sind auf diesem Server deaktiviert.
        </p>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Der Server hat JUDGE0_ENABLED=false. Code-Aufgaben können nicht
          automatisch bewertet werden.
        </p>
      </div>
    );
  }

  if (!language) {
    return <p className="muted">Keine Programmiersprache konfiguriert.</p>;
  }

  const starter =
    selectedLanguageId === language.languageId
      ? props.sourceCode || language.starterCode
      : props.sourceCode;

  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        Schreibe eine Lösung, die alle Testfälle besteht.
        {props.payload.hiddenTestCount > 0 &&
          ` (${props.payload.hiddenTestCount} versteckte(r) Testfall/-fälle nicht sichtbar.)`}
      </p>

      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "0 0 200px" }}>
          <label>Sprache</label>
          <select
            className="input"
            value={selectedLanguageId}
            disabled={props.submitting}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedLanguageId(id);
              props.onLanguageChange(id);
              // Beim Sprachwechsel auf den Starter-Code der neuen Sprache zurücksetzen.
              const lang = props.payload.languages.find((l) => l.languageId === id);
              if (lang) props.onSourceCodeChange(lang.starterCode);
            }}
          >
            {props.payload.languages.map((l) => (
              <option key={l.languageId} value={l.languageId}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <span className="badge badge--muted" style={{ fontSize: 11 }}>
          Zeitlimit: {props.payload.timeLimitMs} ms
        </span>
        <span className="badge badge--muted" style={{ fontSize: 11 }}>
          Speicher: {Math.round(props.payload.memoryLimitKb / 1024)} MB
        </span>
      </div>

      <div className="field">
        <label htmlFor="code-source">Quellcode</label>
        <textarea
          id="code-source"
          className="textarea"
          value={starter}
          spellCheck={false}
          disabled={props.submitting}
          onChange={(e) => props.onSourceCodeChange(e.target.value)}
          style={{
            fontFamily: "ui-monospace, Menlo, Consolas, monospace",
            fontSize: 13,
            minHeight: 220,
            tabSize: 4,
          }}
        />
      </div>

      {props.payload.publicTests.length > 0 && (
        <details>
          <summary className="muted" style={{ fontSize: 13, cursor: "pointer" }}>
            Öffentliche Testfälle ({props.payload.publicTests.length})
          </summary>
          <div className="stack" style={{ marginTop: 8 }}>
            {props.payload.publicTests.map((t) => (
              <div key={t.id} className="card" style={{ padding: 10, fontSize: 12 }}>
                <div>
                  <strong>Eingabe:</strong>
                  <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {t.input || "(leer)"}
                  </pre>
                </div>
                <div>
                  <strong>Erwartet:</strong>
                  <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {t.expectedOutput}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {!props.revealed && (
        <button
          type="button"
          className="btn btn--primary"
          disabled={props.submitting || !props.sourceCode.trim()}
          onClick={props.onSubmit}
        >
          {props.submitting ? "Bewertung läuft …" : "Code einreichen & bewerten"}
        </button>
      )}

      {props.result?.detail?.compileError && (
        <div className="card" style={{ padding: 12, background: "rgba(174,46,36,0.06)" }}>
          <strong>Systemfehler:</strong>
          <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap", fontSize: 12 }}>
            {props.result.detail.compileError}
          </pre>
        </div>
      )}

      {props.revealed && props.result?.detail?.perTest && (
        <div className="stack">
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Test-Ergebnisse
          </p>
          {props.result.detail.perTest.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                padding: 10,
                borderColor: t.passed ? "var(--ds-chart-green)" : "var(--ds-chart-red)",
              }}
            >
              <div className="row row--between" style={{ flexWrap: "wrap", gap: 6 }}>
                <strong style={{ fontSize: 13 }}>
                  {t.hidden ? "Versteckter Test" : `Test ${t.id}`}
                </strong>
                <span
                  className={`badge${t.passed ? " badge--success" : " badge--warn"}`}
                  style={{ fontSize: 11 }}
                >
                  {t.passed ? "✓ bestanden" : `✗ ${t.status}`}
                </span>
              </div>
              {!t.hidden && (t.stdout || t.stderr || t.compileOutput) && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  {t.compileOutput && (
                    <div>
                      <strong>Compiler:</strong>
                      <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                        {t.compileOutput}
                      </pre>
                    </div>
                  )}
                  {t.stderr && (
                    <div>
                      <strong>Stderr:</strong>
                      <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                        {t.stderr}
                      </pre>
                    </div>
                  )}
                  {t.stdout && (
                    <div>
                      <strong>Ausgabe:</strong>
                      <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                        {t.stdout}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
