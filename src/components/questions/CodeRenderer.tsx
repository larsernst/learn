"use client";

import dynamic from "next/dynamic";
import type { CodePublic } from "@/lib/tasks/code/payload";
import type { CodeGradeDetail } from "@/lib/judge0/grade";

// CodeMirror wird clientseitig nachgeladen (kein SSR, eigener Chunk).
const CodeMirrorEditor = dynamic(() => import("./code-mirror-editor"), {
  ssr: false,
  loading: () => (
    <textarea
      className="textarea"
      readOnly
      aria-label="Quellcode-Editor lädt"
      placeholder="Editor lädt …"
      style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 13, minHeight: 220 }}
    />
  ),
});

type PerTest = NonNullable<CodeGradeDetail["perTest"]>[number];

export interface CodeRendererProps {
  payload: CodePublic;
  // 0 = noch nicht gewählt → erste Sprache des Payloads greift.
  languageId: number;
  sourceCode: string;
  onSourceCodeChange: (code: string) => void;
  onLanguageChange: (languageId: number) => void;
  // Probelauf (nur öffentliche Tests, unbewertet) vs. Einreichung.
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
  submitting: boolean;
  runResult?: CodeGradeDetail | null;
  revealed: boolean;
  result?: { correct: boolean; detail?: CodeGradeDetail | null } | null;
  judge0Enabled?: boolean;
  showRunButton?: boolean;
  submitLabel?: string;
}

const COMPARISON_LABELS: Record<string, string> = {
  exact: "Ausgabe muss exakt stimmen",
  trim: "Zeilenenden werden tolerant verglichen",
  float: "Zahlen werden mit Toleranz verglichen",
};

export function CodeRenderer(props: CodeRendererProps) {
  const busy = props.running || props.submitting;

  if (!props.judge0Enabled) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p className="badge badge--warn">
          Code-Aufgaben sind auf diesem Server deaktiviert.
        </p>
        <p className="muted text-sm" style={{ marginTop: 8 }}>
          Der Server hat JUDGE0_ENABLED=false. Code-Aufgaben können nicht
          automatisch bewertet werden.
        </p>
      </div>
    );
  }

  const language =
    props.payload.languages.find((l) => l.languageId === props.languageId) ??
    props.payload.languages[0];

  if (!language) {
    return <p className="muted">Keine Programmiersprache konfiguriert.</p>;
  }

  const editorValue = props.sourceCode || language.starterCode;

  return (
    <>
      <p className="muted text-sm">
        Schreibe eine Lösung, die alle Testfälle besteht.
        {props.payload.hiddenTestCount > 0 &&
          ` (${props.payload.hiddenTestCount} versteckte(r) Testfall/-fälle nicht sichtbar.)`}
      </p>

      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "0 0 200px" }}>
          <label>Sprache</label>
          <select
            className="input"
            value={language.languageId}
            disabled={busy}
            onChange={(e) => {
              const id = Number(e.target.value);
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
        <span className="badge badge--muted badge--sm">
          Zeitlimit: {props.payload.timeLimitMs} ms
        </span>
        <span className="badge badge--muted badge--sm">
          Speicher: {Math.round(props.payload.memoryLimitKb / 1024)} MB
        </span>
        <span className="badge badge--muted badge--sm">
          {COMPARISON_LABELS[props.payload.comparison.mode] ?? props.payload.comparison.mode}
        </span>
      </div>

      <div className="field">
        <label>Quellcode</label>
        <CodeMirrorEditor
          value={editorValue}
          onChange={props.onSourceCodeChange}
          languageId={language.languageId}
          disabled={busy}
        />
      </div>

      {props.payload.publicTests.length > 0 && (
        <details>
          <summary className="muted text-sm" style={{ cursor: "pointer" }}>
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
                  {t.args && (
                    <>
                      <strong>Argumente (argv):</strong>
                      <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                        {t.args}
                      </pre>
                    </>
                  )}
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

      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {props.showRunButton !== false && (
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy || !props.sourceCode.trim()}
            onClick={props.onRun}
          >
            {props.running ? "Probelauf läuft …" : "Ausführen (unbewertet)"}
          </button>
        )}
        {!props.revealed && (
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || !props.sourceCode.trim()}
            onClick={props.onSubmit}
          >
            {props.submitting
              ? "Bewertung läuft …"
              : (props.submitLabel ?? "Code einreichen & bewerten")}
          </button>
        )}
      </div>

      {props.runResult && !props.revealed && (
        <div className="stack" style={{ marginTop: 8 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Probelauf – unbewertet
          </p>
          {props.runResult.compileError && <CompileErrorCard message={props.runResult.compileError} />}
          <TestResultList perTest={props.runResult.perTest ?? []} />
        </div>
      )}

      {props.result?.detail?.compileError && (
        <CompileErrorCard message={props.result.detail.compileError} />
      )}

      {props.revealed && props.result?.detail?.perTest && (
        <div className="stack">
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Test-Ergebnisse (bewertet)
          </p>
          <TestResultList perTest={props.result.detail.perTest} />
        </div>
      )}
    </>
  );
}

function CompileErrorCard({ message }: { message: string }) {
  return (
    <div className="card" style={{ padding: 12, background: "var(--ds-background-danger-subtle)" }}>
      <strong>Systemfehler:</strong>
      <pre style={{ margin: "4px 0", fontFamily: "monospace", whiteSpace: "pre-wrap", fontSize: 12 }}>
        {message}
      </pre>
    </div>
  );
}

function TestResultList({ perTest }: { perTest: PerTest[] }) {
  return (
    <>
      {perTest.map((t) => (
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
            {t.passed && t.time != null && (
              <span className="badge badge--muted badge--sm">
                {t.time} s{t.memory != null && ` · ${Math.round(t.memory / 1024)} MB`}
              </span>
            )}
          </div>
          {t.mismatch && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                padding: 8,
                background: "var(--ds-background-danger-subtle)",
                borderRadius: 4,
              }}
            >
              <strong>
                Erste Abweichung in Zeile {t.mismatch.line}
                {t.mismatch.reason === "missing-lines" && " (Ausgabe endet hier schon)"}
                {t.mismatch.reason === "extra-lines" && " (hier kommt zu viel)"}:
              </strong>
              <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <span className="muted">Erwartet:</span>
                  <pre style={{ margin: "2px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {t.mismatch.expected || "(nichts)"}
                  </pre>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <span className="muted">Deine Ausgabe:</span>
                  <pre style={{ margin: "2px 0", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {t.mismatch.actual || "(nichts)"}
                  </pre>
                </div>
              </div>
            </div>
          )}
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
    </>
  );
}
