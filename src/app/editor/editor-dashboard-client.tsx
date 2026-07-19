"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CourseCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  questionCount: number;
  chapterCount: number;
  updatedAt: string;
};

export default function EditorDashboardClient({ courses }: { courses: CourseCard[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Kurs konnte nicht angelegt werden.");
      return;
    }
    const json = await res.json();
    // Direkt weiter in den Curriculum-Builder des neuen Kurses.
    router.push(`/editor/kurs/${json.course.id}`);
    router.refresh();
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}

      {courses.length === 0 && !showForm && (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <h3 style={{ marginTop: 0 }}>Noch keine Kurse</h3>
          <p className="muted">
            Lege deinen ersten Kurs an und fülle ihn mit Kapiteln und Fragen.
          </p>
        </div>
      )}

      <div className="grid grid--3">
        {courses.map((c) => (
          <div className="card" key={c.id} style={{ padding: 20 }}>
            <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                className={`badge ${c.status === "published" ? "badge--success" : "badge--muted"}`}
                style={{ fontSize: 11 }}
              >
                {c.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
            </div>
            <h3 style={{ margin: "0 0 4px" }}>
              <Link
                href={`/editor/kurs/${c.id}`}
                style={{ color: "var(--ds-ink)", textDecoration: "none" }}
              >
                {c.title}
              </Link>
            </h3>
            {c.description && (
              <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
                {c.description.slice(0, 90)}
                {c.description.length > 90 ? "…" : ""}
              </p>
            )}
            <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {c.chapterCount} Kapitel
              </span>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {c.questionCount} Fragen
              </span>
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <Link href={`/editor/kurs/${c.id}`} className="btn btn--primary btn--sm">
                Curriculum
              </Link>
              <Link
                href={`/editor/kurs/${c.id}/einstellungen`}
                className="btn btn--ghost btn--sm"
              >
                Einstellungen
              </Link>
            </div>
          </div>
        ))}

        {!showForm && (
          <button
            type="button"
            className="card"
            style={{
              padding: 20,
              cursor: "pointer",
              border: "1px dashed var(--ds-border)",
              background: "transparent",
              textAlign: "center",
              font: "inherit",
            }}
            onClick={() => setShowForm(true)}
          >
            <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>+</div>
            <strong>Neuen Kurs anlegen</strong>
            <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
              Titel wählen und direkt mit dem Curriculum starten.
            </p>
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createCourse} className="card stack" style={{ padding: 20 }}>
          <h3 style={{ margin: 0 }}>Neuen Kurs anlegen</h3>
          <div className="field">
            <label>Titel</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Algorithmen und Datenstrukturen"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Beschreibung</label>
            <textarea
              className="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in diesem Kurs?"
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            >
              <option value="draft">Entwurf (nur für dich und Admins sichtbar)</option>
              <option value="published">Veröffentlicht (für alle Lernenden sichtbar)</option>
            </select>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={submitting || !title.trim()}
            >
              {submitting ? "Legt an …" : "Kurs anlegen & zum Curriculum"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowForm(false)}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
