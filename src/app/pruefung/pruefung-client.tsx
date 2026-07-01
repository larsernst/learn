"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { QuestionPublic } from "@/lib/types";

type Phase = "setup" | "running" | "result";

interface AnswerRecord {
  questionId: string;
  mode: "recall" | "mcq";
  correct?: boolean;
  selectedOptionIds?: string[];
}

interface GradeResult {
  perQuestion: { questionId: string; correct: boolean }[];
  score: number;
  total: number;
  savedToSm2: boolean;
}

const COUNTS: { label: string; value: number }[] = [
  { label: "10 Fragen", value: 10 },
  { label: "30 Fragen", value: 30 },
  { label: "Alle", value: 0 },
];

export default function PruefungClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuestionPublic[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(count: number) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/exam/questions?count=${count}`);
    setLoading(false);
    if (!res.ok) {
      setError("Fragen konnten nicht geladen werden.");
      return;
    }
    const json = (await res.json()) as { questions: QuestionPublic[] };
    setQuestions(json.questions);
    setAnswers([]);
    setIndex(0);
    setRevealed(false);
    setSelected([]);
    setDraft("");
    setResult(null);
    setPhase("running");
  }

  const current = questions[index];
  const isMcq = !!current?.mcqOptions && current.mcqOptions.length > 0;

  function recordAndNext(answer: AnswerRecord) {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setRevealed(false);
    setSelected([]);
    setDraft("");
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      finish(nextAnswers);
    }
  }

  async function finish(finalAnswers: AnswerRecord[], saveToSm2 = false) {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: finalAnswers, saveToSm2 }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Auswertung fehlgeschlagen.");
      return;
    }
    setResult((await res.json()) as GradeResult);
    setPhase("result");
  }

  function markRecall(correct: boolean) {
    if (!current) return;
    recordAndNext({ questionId: current.id, mode: "recall", correct });
  }

  function submitMcq() {
    if (!current || selected.length === 0) return;
    recordAndNext({
      questionId: current.id,
      mode: "mcq",
      selectedOptionIds: selected,
    });
  }

  useEffect(() => {
    if (phase !== "running") return;
    setRevealed(false);
    setSelected([]);
    setDraft("");
  }, [index, phase]);

  if (phase === "setup") {
    return (
      <div className="card">
        {error && (
          <p className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
            {error}
          </p>
        )}
        <p className="muted">Wie viele Fragen möchtest du prüfen?</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {COUNTS.map((c) => (
            <button
              key={c.value}
              className="btn btn--secondary"
              disabled={loading}
              onClick={() => start(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const pct = result.total === 0 ? 0 : Math.round((result.score / result.total) * 100);
    return (
      <div className="stack">
        <div className="card card--brand">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.8)" }}>
            Ergebnis
          </p>
          <p style={{ fontSize: 40, fontWeight: 600, margin: 0 }}>
            {result.score} / {result.total}
          </p>
          <p style={{ color: "rgba(255,255,255,0.85)" }}>{pct}% richtig</p>
        </div>

        {!result.savedToSm2 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Ergebnis ins Spaced Repetition übernehmen?</h3>
            <p className="muted">
              Richtige Karten werden wie „Good", falsche wie „Again" ins SM-2-System
              übernommen (aktualisiert Fälligkeit und Statistik).
            </p>
            <div className="row">
              <button
                className="btn btn--primary"
                disabled={loading}
                onClick={() => void finish(answers, true)}
              >
                Ins SM-2 übernehmen
              </button>
              <Link href="/lernen" className="btn btn--secondary">
                Nicht übernehmen – weiter lernen
              </Link>
            </div>
          </div>
        )}
        {result.savedToSm2 && (
          <div className="card">
            <span className="badge badge--success">Übernommen</span>
            <p className="muted" style={{ marginTop: 8 }}>
              Dein Ergebnis wurde ins Spaced-Repetition-System übernommen.
            </p>
            <Link href="/statistik" className="btn btn--secondary">
              Statistik ansehen
            </Link>
          </div>
        )}

        <h2>Einzelne Fragen</h2>
        <ol className="katalog-list">
          {questions.map((q, i) => {
            const row = result.perQuestion.find((r) => r.questionId === q.id);
            return (
              <li key={q.id} className="katalog-item">
                <div className="katalog-item__main">
                  <span className="katalog-item__q">
                    {i + 1}. {q.question}
                  </span>
                  <span className="katalog-item__meta">Kapitel {q.chapter} · {q.chapterTitle}</span>
                </div>
                <span className={row?.correct ? "badge badge--success" : "badge badge--warn"}>
                  {row?.correct ? "Richtig" : "Falsch"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  if (phase === "running" && current) {
    const progress = Math.round((index / questions.length) * 100);
    return (
      <div className="stack">
        <div className="row row--between">
          <span className="badge">
            Frage {index + 1} / {questions.length}
          </span>
          <span className="badge badge--muted">
            {isMcq ? "Multiple-Choice" : "Freie Erinnerung"}
          </span>
        </div>
        <div className="progress">
          <div className="progress__bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="card">
          <p className="review-question">{current.question}</p>
        </div>

        {isMcq ? (
          <>
            <p className="muted" style={{ fontSize: 14 }}>
              Mehrere Antworten können richtig sein.
            </p>
            <div className="stack">
              {current.mcqOptions!.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`mcq-option${checked ? " mcq-option--selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(o.id)
                            ? prev.filter((x) => x !== o.id)
                            : [...prev, o.id]
                        )
                      }
                    />
                    <span>{o.text}</span>
                  </label>
                );
              })}
            </div>
            <button
              className="btn btn--primary"
              disabled={selected.length === 0}
              onClick={submitMcq}
            >
              Bestätigen & nächste
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="exam-draft">Deine Antwort</label>
              <textarea
                id="exam-draft"
                className="textarea"
                placeholder="Schreibe frei, woran du dich erinnerst …"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            {!revealed ? (
              <button className="btn btn--primary" onClick={() => setRevealed(true)}>
                Musterantwort zeigen
              </button>
            ) : (
              <>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 8 }}>
                    Musterantwort
                  </p>
                  <div className="review-answer">{current.answer}</div>
                </div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Hast du es richtig gewusst?
                </p>
                <div className="review-actions">
                  <button
                    className="grade-btn grade-btn--again"
                    onClick={() => markRecall(false)}
                  >
                    Falsch<small>selbst bewertet</small>
                  </button>
                  <button
                    className="grade-btn grade-btn--good"
                    onClick={() => markRecall(true)}
                  >
                    Richtig<small>selbst bewertet</small>
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {error && (
          <p className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return <p className="muted">{loading ? "Lädt …" : "Bereit."}</p>;
}