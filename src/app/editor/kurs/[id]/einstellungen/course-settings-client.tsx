"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CourseSettings = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  questionCount: number;
};

export default function CourseSettingsClient({ course }: { course: CourseSettings }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [status, setStatus] = useState<"draft" | "published">(course.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setSuccess("Kurs aktualisiert.");
    router.refresh();
  }

  async function deleteCourse() {
    if (
      !window.confirm(
        `Kurs „${course.title}" wirklich löschen?` +
          (course.questionCount > 0
            ? `\nDas entfernt ${course.questionCount} Frage(n) inkl. aller Nutzerfortschritte. Das kann nicht rückgängig gemacht werden.`
            : "")
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    router.push("/editor");
    router.refresh();
  }

  return (
    <div className="stack">
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}

      <form onSubmit={handleSubmit} className="card stack" style={{ padding: 20 }}>
        <div className="field">
          <label>Titel</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Öffentlicher Pfad: /kurs/{course.slug}
        </p>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={submitting || !title.trim()}
          >
            {submitting ? "Speichert …" : "Speichern"}
          </button>
        </div>
      </form>

      <div className="card" style={{ padding: 20, borderColor: "#ae2e24" }}>
        <h3 style={{ marginTop: 0, color: "#ae2e24" }}>Gefahrenzone</h3>
        <p className="muted" style={{ fontSize: 14 }}>
          Kurs löschen entfernt {course.questionCount > 0 ? `alle ${course.questionCount} Fragen, ` : ""}
          Kapitel und Nutzerfortschritte unwiderruflich.
        </p>
        <button type="button" className="btn btn--secondary btn--sm" onClick={deleteCourse}>
          Kurs endgültig löschen
        </button>
      </div>
    </div>
  );
}
