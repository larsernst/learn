"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { intervalLabel, type ReviewGrade } from "@/lib/sm2";

interface QuestionDTO {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
}

interface ReviewDTO {
  id?: string;
  question: QuestionDTO;
}

interface NextResponse {
  review: ReviewDTO | null;
  isNew: boolean;
}

export default function StudyClient() {
  const [data, setData] = useState<NextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNext() {
    setLoading(true);
    setRevealed(false);
    setDraft("");
    setFeedback(null);
    setError(null);
    const res = await fetch("/api/review/next");
    setLoading(false);
    if (!res.ok) {
      setError("Karte konnte nicht geladen werden.");
      setData(null);
      return;
    }
    const json = (await res.json()) as NextResponse;
    setData(json);
  }

  useEffect(() => {
    loadNext();
  }, []);

  async function grade(grade: ReviewGrade) {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
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
    setFeedback(
      grade === "again"
        ? "Wird heute erneut angezeigt."
        : `Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`
    );
    // Feedback kurz anzeigen, bevor die naechste Karte geladen wird.
    setTimeout(() => {
      setSubmitting(false);
      loadNext();
    }, 900);
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
          Du hast alle Fragen einmal gelernt oder bist mit den fälligen Wiederholungen durch.
          Komm später wieder, um Spaced Repetition weiterlaufen zu lassen.
        </p>
        <div className="row">
          <button className="btn btn--secondary" onClick={loadNext}>
            Nach weiteren neuen Fragen suchen
          </button>
          <Link href="/fortschritt" className="btn btn--ghost">
            Fortschritt ansehen
          </Link>
        </div>
      </div>
    );
  }

  const q = data.review.question;

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

      <div className="field">
        <label htmlFor="draft">Deine Antwort</label>
        <textarea
          id="draft"
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
            <div className="review-answer">{q.answer}</div>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Wie gut warst du?
            </p>
            <div className="review-actions">
              <button
                className="grade-btn grade-btn--again"
                disabled={submitting}
                onClick={() => grade("again")}
              >
                Again<small>völlig falsch</small>
              </button>
              <button
                className="grade-btn"
                disabled={submitting}
                onClick={() => grade("hard")}
              >
                Hard<small>mit Mühe</small>
              </button>
              <button
                className="grade-btn grade-btn--good"
                disabled={submitting}
                onClick={() => grade("good")}
              >
                Good<small>korrekt</small>
              </button>
              <button
                className="grade-btn"
                disabled={submitting}
                onClick={() => grade("easy")}
              >
                Easy<small>mühelos</small>
              </button>
            </div>
          </div>
          {feedback && (
            <p className="muted" style={{ textAlign: "center" }}>
              {feedback}
            </p>
          )}
        </>
      )}
    </div>
  );
}