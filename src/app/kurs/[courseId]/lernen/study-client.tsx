"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { intervalLabel, type ReviewGrade } from "@/lib/sm2";
import type { QuestionPublic, ReviewNextResponse } from "@/lib/types";
import { McqRenderer } from "@/components/questions/McqRenderer";
import type { McqPublic } from "@/lib/tasks/mcq/payload";
import { RecallRenderer } from "@/components/questions/RecallRenderer";
import {
  DragDropRenderer,
  ClozeRenderer,
  OrderRenderer,
} from "@/components/questions/AdvancedRenderers";
import { CodeRenderer } from "@/components/questions/CodeRenderer";
import { Markdown } from "@/components/markdown";

type Feedback =
  | { kind: "recall"; text: string }
  | { kind: "mcq"; correct: boolean; correctIds: string[] | null; text: string }
  | null;

export default function StudyClient({
  deck = "all",
  courseId,
  simpleGrading = false,
  chapter,
  learnedAvailable = 0,
}: {
  deck?: "all" | "difficult";
  courseId: string;
  simpleGrading?: boolean;
  chapter?: number;
  learnedAvailable?: number;
}) {
  const [data, setData] = useState<ReviewNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewLearned, setReviewLearned] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<ReviewGrade | null>(null);
  // Attempt-Zustände für die neuen Task-Typen
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  // code
  const [codeSource, setCodeSource] = useState("");
  const [codeLanguageId, setCodeLanguageId] = useState(0);
  const [codeResult, setCodeResult] = useState<{
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
  } | null>(null);

  async function loadNext(opts?: { reviewLearned?: boolean }) {
    const rl = opts?.reviewLearned ?? reviewLearned;
    setLoading(true);
    setSubmitting(false);
    setRevealed(false);
    setDraft("");
    setSelected([]);
    setAssignment({});
    setAnswers({});
    setOrderedIds([]);
    setCodeSource("");
    setCodeLanguageId(0);
    setCodeResult(null);
    setFeedback(null);
    setError(null);
    setSelectedGrade(null);
    const params = new URLSearchParams();
    if (deck === "difficult") params.set("deck", "difficult");
    params.set("courseId", courseId);
    if (chapter !== undefined) params.set("chapter", String(chapter));
    if (rl) params.set("review", "learned");
    const res = await fetch(`/api/review/next?${params.toString()}`);
    setLoading(false);
    if (!res.ok) {
      setError("Karte konnte nicht geladen werden.");
      setData(null);
      return;
    }
    const json = (await res.json()) as ReviewNextResponse;
    setData(json);
  }

  function startReviewLearned() {
    setReviewLearned(true);
    void loadNext({ reviewLearned: true });
  }

  useEffect(() => {
    loadNext();
  }, []);

  useEffect(() => {
    if (loading || !data || !data.review) return;
    const q = data.review.question;
    const mcqPayload = q.taskType === "mcq" ? (q.taskPayload as McqPublic | null) : null;
    const isMcq = mcqPayload !== null && mcqPayload !== undefined;
    function handle(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        else if (isMcq && !submitting) submitMcq();
      }
      if (!revealed || submitting) return;
      if (isMcq && mcqPayload) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < mcqPayload.options.length) {
          const id = mcqPayload.options[idx].id;
          const selMode = mcqPayload.selectionMode ?? "multi";
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
    if (submitting) return;
    setSelectedGrade(grade);
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        taskType: "recall",
        grade,
        isNew: data.isNew,
      }),
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
    setSubmitting(false);
  }

  async function submitMcq() {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        taskType: "mcq",
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
      correct: boolean | null;
      correctOptionIds: string[] | null;
      intervalDays: number;
    };
    const correct = result.correct === true;
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

  async function submitAutoGraded(
    taskType: "dragdrop" | "cloze" | "order",
    attempt:
      | { assignment: Record<string, string> }
      | { answers: Record<string, string> }
      | { orderedIds: string[] }
  ) {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        taskType,
        ...attempt,
        isNew: data.isNew,
      }),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError("Auswertung konnte nicht gespeichert werden.");
      return;
    }
    const result = (await res.json()) as {
      correct: boolean | null;
      intervalDays: number;
    };
    const correct = result.correct === true;
    setFeedback({
      kind: "mcq",
      correct,
      correctIds: null,
      text: correct
        ? `Richtig! Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`
        : "Falsch – wird heute erneut angezeigt.",
    });
    setRevealed(true);
  }

  async function submitCode() {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/code-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        languageId: codeLanguageId,
        sourceCode: codeSource,
        isNew: data.isNew,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Code-Bewertung fehlgeschlagen.");
      return;
    }
    const result = (await res.json()) as {
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
      intervalDays: number;
    };
    setCodeResult({ correct: result.correct, detail: result.detail });
    setFeedback({
      kind: "mcq",
      correct: result.correct,
      correctIds: null,
      text: result.correct
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
        <button className="btn btn--secondary" onClick={() => loadNext()}>
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
          {reviewLearned
            ? "Keine gelernten Fragen mehr zum Wiederholen in diesem Bereich."
            : deck === "difficult"
              ? "Keine schwierigen Karten mehr fällig. Wechsle zu „Alle“, um neue oder andere fällige Karten zu lernen."
              : "Du hast alle Fragen einmal gelernt oder bist mit den fälligen Wiederholungen durch. Komm später wieder, um Spaced Repetition weiterlaufen zu lassen."}
        </p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn--secondary" onClick={() => loadNext()}>
            {deck === "difficult" ? "Erneut suchen" : "Nach weiteren neuen Fragen suchen"}
          </button>
          {learnedAvailable > 0 && !reviewLearned && (
            <button className="btn btn--primary" onClick={startReviewLearned}>
              Gelernte Fragen wiederholen
            </button>
          )}
          <Link href={`/kurs/${courseId}/katalog`} className="btn btn--ghost">
            Alle Fragen ansehen
          </Link>
        </div>
      </div>
    );
  }

  const q = data.review.question;
  const mcqPayload = q.taskType === "mcq" ? (q.taskPayload as McqPublic | null) : null;
  const isMcq = mcqPayload !== null && mcqPayload !== undefined;
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

      {reviewLearned && (
        <p className="eyebrow" style={{ textAlign: "center" }}>
          Wiederholung gelernter Fragen
        </p>
      )}

      <div className="card">
        <Markdown source={q.question} className="review-question" />
      </div>

      {isMcq && mcqPayload ? (
        <McqRenderer
          options={mcqPayload.options}
          selectionMode={mcqPayload.selectionMode}
          selected={selected}
          disabled={submitting || revealed}
          correctIds={correctIds}
          onToggle={
            mcqPayload.selectionMode === "single"
              ? (id) => setSelected([id])
              : (id) =>
                  setSelected((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
          }
          onSubmit={submitMcq}
          revealed={revealed}
        />
      ) : q.taskType === "dragdrop" && q.taskPayload ? (
        <DragDropRenderer
          payload={q.taskPayload as never}
          assignment={assignment}
          onAssignmentChange={setAssignment}
          revealed={revealed}
          onSubmit={() => submitAutoGraded("dragdrop", { assignment })}
        />
      ) : q.taskType === "cloze" && q.taskPayload ? (
        <ClozeRenderer
          payload={q.taskPayload as never}
          answers={answers}
          onAnswersChange={setAnswers}
          revealed={revealed}
          onSubmit={() => submitAutoGraded("cloze", { answers })}
        />
      ) : q.taskType === "order" && q.taskPayload ? (
        <OrderRenderer
          payload={q.taskPayload as never}
          orderedIds={orderedIds}
          onOrderChange={setOrderedIds}
          revealed={revealed}
          onSubmit={() => submitAutoGraded("order", { orderedIds })}
        />
      ) : q.taskType === "code" && q.taskPayload ? (
        <CodeRenderer
          payload={q.taskPayload as never}
          sourceCode={codeSource}
          onSourceCodeChange={setCodeSource}
          onLanguageChange={setCodeLanguageId}
          onSubmit={submitCode}
          submitting={submitting}
          revealed={revealed}
          result={codeResult}
          judge0Enabled={process.env.NEXT_PUBLIC_JUDGE0_ENABLED === "true"}
        />
      ) : (
        <RecallRenderer
          draft={draft}
          onDraft={setDraft}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          submitting={submitting}
          onGrade={gradeRecall}
          simpleGrading={simpleGrading}
          selectedGrade={selectedGrade}
        />
      )}

      {revealed && (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Musterantwort
          </p>
          <Markdown source={q.answer} className="review-answer" />
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
          <button className="btn btn--primary" onClick={() => loadNext()}>
            Nächste Frage
          </button>
        </div>
      )}
    </div>
  );
}
