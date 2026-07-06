"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { intervalLabel, type ReviewGrade } from "@/lib/sm2";
import type { QuestionPublic, ReviewNextResponse } from "@/lib/types";

type Feedback =
  | { kind: "recall"; text: string }
  | { kind: "mcq"; correct: boolean; correctIds: string[] | null; text: string }
  | null;

export default function StudyClient({
  deck = "all",
  courseId,
  simpleGrading = false,
}: {
  deck?: "all" | "difficult";
  courseId: string;
  simpleGrading?: boolean;
}) {
  const [data, setData] = useState<ReviewNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNext() {
    setLoading(true);
    setSubmitting(false);
    setRevealed(false);
    setDraft("");
    setSelected([]);
    setFeedback(null);
    setError(null);
    const url =
      deck === "difficult"
        ? `/api/review/next?deck=difficult&courseId=${encodeURIComponent(courseId)}`
        : `/api/review/next?courseId=${encodeURIComponent(courseId)}`;
    const res = await fetch(url);
    setLoading(false);
    if (!res.ok) {
      setError("Karte konnte nicht geladen werden.");
      setData(null);
      return;
    }
    const json = (await res.json()) as ReviewNextResponse;
    setData(json);
  }

  useEffect(() => {
    loadNext();
  }, []);

  useEffect(() => {
    if (loading || !data || !data.review) return;
    const r = data.review;
    const mcqOpts = r.question.mcqOptions;
    const mcqMode = mcqOpts !== null && mcqOpts !== undefined && mcqOpts.length > 0;
    function handle(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        else if (mcqMode && !submitting) submitMcq();
      }
      if (!revealed || submitting) return;
      if (mcqMode) {
        const idx = Number(e.key) - 1;
        const opts = mcqOpts!;
        if (opts[idx]) {
          const id = opts[idx].id;
          const selMode = r.question.mcqSelectionMode ?? "multi";
          selMode === "single"
            ? setSelected([id])
            : setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
        }
        return;
      }
      const grades: Record<string, ReviewGrade> = simpleGrading
        ? { "1": "again", "2": "good" }
        : { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      if (grades[e.key]) gradeRecall(grades[e.key]);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [loading, data, revealed, submitting, simpleGrading]);

  async function gradeRecall(grade: ReviewGrade) {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: data.review.question.id, grade, isNew: data.isNew }),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError("Bewertung konnte nicht gespeichert werden.");
      return;
    }
    const result = (await res.json()) as { intervalDays: number };
    setFeedback({
      kind: "recall",
      text:
        grade === "again"
          ? "Wird heute erneut angezeigt."
          : `Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`,
    });
  }

  async function submitMcq() {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        selectedOptionIds: selected,
        isNew: data.isNew,
      }),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError("Auswertung konnte nicht gespeichert werden.");
      return;
    }
    const result = (await res.json()) as {
      mcqCorrect: boolean | null;
      correctOptionIds: string[] | null;
      intervalDays: number;
    };
    const correct = result.mcqCorrect === true;
    setFeedback({
      kind: "mcq",
      correct,
      correctIds: result.correctOptionIds,
      text: correct
        ? `Richtig! Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`
        : "Falsch – wird heute erneut angezeigt.",
    });
    setRevealed(true);
  }

  if (loading) {
    return <p className="muted">Lade nächste Frage …</p>;
  }

  if (error) {
    return (
      <div className="card">
        <p className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </p>
        <button className="btn btn--secondary" onClick={loadNext}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data || !data.review) {
    return (
      <div className="card">
        <span className="badge badge--success">Alles fällige gelernt</span>
        <h2>Für heute erledigt!</h2>
        <p className="muted">
          {deck === "difficult"
            ? "Keine schwierigen Karten mehr fällig. Wechsle zu „Alle“, um neue oder andere fällige Karten zu lernen."
            : "Du hast alle Fragen einmal gelernt oder bist mit den fälligen Wiederholungen durch. Komm später wieder, um Spaced Repetition weiterlaufen zu lassen."}
        </p>
        <div className="row">
          <button className="btn btn--secondary" onClick={loadNext}>
            {deck === "difficult" ? "Erneut suchen" : "Nach weiteren neuen Fragen suchen"}
          </button>
          <Link href={`/kurs/${courseId}/katalog`} className="btn btn--ghost">
            Alle Fragen ansehen
          </Link>
        </div>
      </div>
    );
  }

  const q = data.review.question;
  const isMcq = q.mcqOptions !== null && q.mcqOptions !== undefined && q.mcqOptions.length > 0;
  const correctIds = feedback?.kind === "mcq" ? feedback.correctIds : null;

  return (
    <div className="stack">
      <div className="row row--between">
        <span className="badge">
          Kapitel {q.chapter} · {q.chapterTitle}
        </span>
        {data.isNew ? (
          <span className="badge badge--muted">Neu</span>
        ) : (
          <span className="badge badge--success">Wiederholung</span>
        )}
      </div>

      <div className="card">
        <p className="review-question">{q.question}</p>
      </div>

      {isMcq ? (
        <McqQuestion
          options={q.mcqOptions!}
          selectionMode={q.mcqSelectionMode ?? "multi"}
          selected={selected}
          disabled={submitting || revealed}
          correctIds={correctIds}
          onToggle={
            q.mcqSelectionMode === "single"
              ? (id) => setSelected([id])
              : (id) =>
                  setSelected((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
          }
          onSubmit={submitMcq}
          revealed={revealed}
        />
      ) : (
        <RecallQuestion
          draft={draft}
          onDraft={setDraft}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          submitting={submitting}
          onGrade={gradeRecall}
          simpleGrading={simpleGrading}
        />
      )}

      {revealed && (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Musterantwort
          </p>
          <div className="review-answer">{q.answer}</div>
        </div>
      )}

      {feedback && (
        <p
          className="muted"
          style={{
            textAlign: "center",
            color:
              feedback.kind === "mcq"
                ? feedback.correct
                  ? "var(--ds-chart-green)"
                  : "var(--ds-chart-red)"
                : undefined,
          }}
        >
          {feedback.text}
        </p>
      )}

      {feedback && (
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn btn--primary" onClick={loadNext}>
            Nächste Frage
          </button>
        </div>
      )}
    </div>
  );
}

type GradeButtonConfig = {
  grade: ReviewGrade;
  label: string;
  subtitle: string;
  modifier?: "again" | "good";
  ariaLabel: string;
};

const SIMPLE_GRADES: GradeButtonConfig[] = [
  { grade: "again", label: "Falsch", subtitle: "nochmal", modifier: "again", ariaLabel: "Falsch (Taste 1)" },
  { grade: "good", label: "Richtig", subtitle: "gewusst", modifier: "good", ariaLabel: "Richtig (Taste 2)" },
];

const FULL_GRADES: GradeButtonConfig[] = [
  { grade: "again", label: "Again", subtitle: "völlig falsch", modifier: "again", ariaLabel: "Again – völlig falsch (Taste 1)" },
  { grade: "hard", label: "Hard", subtitle: "mit Mühe", ariaLabel: "Hard – mit Mühe (Taste 2)" },
  { grade: "good", label: "Good", subtitle: "korrekt", modifier: "good", ariaLabel: "Good – korrekt (Taste 3)" },
  { grade: "easy", label: "Easy", subtitle: "mühelos", ariaLabel: "Easy – mühelos (Taste 4)" },
];

function RecallQuestion(props: {
  draft: string;
  onDraft: (v: string) => void;
  revealed: boolean;
  onReveal: () => void;
  submitting: boolean;
  onGrade: (g: ReviewGrade) => void;
  simpleGrading: boolean;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="draft">Deine Antwort</label>
        <textarea
          id="draft"
          className="textarea"
          placeholder="Schreibe frei, woran du dich erinnerst …"
          value={props.draft}
          onChange={(e) => props.onDraft(e.target.value)}
        />
      </div>
      {!props.revealed ? (
        <button className="btn btn--primary" onClick={props.onReveal}>
          Musterantwort zeigen
        </button>
      ) : (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            {props.simpleGrading ? "War deine Antwort richtig?" : "Wie gut warst du?"}
          </p>
          <div className="review-actions">
            {(props.simpleGrading ? SIMPLE_GRADES : FULL_GRADES).map((btn) => (
              <button
                key={btn.grade}
                className={`grade-btn${btn.modifier ? ` grade-btn--${btn.modifier}` : ""}`}
                disabled={props.submitting}
                onClick={() => props.onGrade(btn.grade)}
                aria-label={btn.ariaLabel}
              >
                {btn.label}
                <small>{btn.subtitle}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function McqQuestion(props: {
  options: { id: string; text: string }[];
  selectionMode: "single" | "multi";
  selected: string[];
  disabled: boolean;
  correctIds: string[] | null;
  revealed: boolean;
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  const isSingle = props.selectionMode === "single";
  const selectionCount = props.selected.length;
  const inputType = isSingle ? "radio" : "checkbox";
  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        {isSingle
          ? "Wähle die richtige Antwort."
          : "Mehrere Antworten sind richtig. Wähle alle zutreffenden aus."}
      </p>
      <div className="stack">
        {props.options.map((o) => {
          const checked = props.selected.includes(o.id);
          const isCorrect = props.correctIds?.includes(o.id) ?? false;
          let cls = "mcq-option";
          if (props.revealed) {
            if (isCorrect) cls += " mcq-option--correct";
            else if (checked) cls += " mcq-option--wrong";
          } else if (checked) {
            cls += " mcq-option--selected";
          }
          return (
            <label
              key={o.id}
              className={cls}
              role={isSingle ? "radio" : "checkbox"}
              aria-checked={checked}
            >
              <input
                type={inputType}
                name={isSingle ? "mcq-single" : undefined}
                checked={checked}
                disabled={props.disabled}
                onChange={() => props.onToggle(o.id)}
                tabIndex={0}
              />
              <span>{o.text}</span>
            </label>
          );
        })}
      </div>
      {!props.revealed ? (
        <button
          className="btn btn--primary"
          onClick={props.onSubmit}
          disabled={props.disabled || selectionCount === 0}
        >
          {selectionCount === 0 ? "Bitte Optionen wählen" : "Auswerten"}
        </button>
      ) : null}
    </>
  );
}