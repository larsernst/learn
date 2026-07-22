"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CourseSettings = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  order: number;
  questionCount: number;
  hasImage: boolean;
};

type ImportReport =
  | { state: "idle" }
  | { state: "errors"; errors: { index: number; message: string }[] }
  | { state: "dry-ok"; total: number; message: string; data: unknown }
  | { state: "done"; created: number; updated: number; chaptersCreated: number };

export default function CourseSettingsClient({ course }: { course: CourseSettings }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [slug, setSlug] = useState(course.slug);
  const [description, setDescription] = useState(course.description);
  const [status, setStatus] = useState<"draft" | "published">(course.status);
  const [order, setOrder] = useState(String(course.order));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [hasImage, setHasImage] = useState(course.hasImage);
  const [importReport, setImportReport] = useState<ImportReport>({ state: "idle" });
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function notify(ok: boolean, msg: string) {
    setError(null);
    setSuccess(null);
    if (ok) setSuccess(msg);
    else setError(msg);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        slug,
        status,
        order: Number(order) || 0,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    const json = await res.json();
    setSlug(json.course.slug);
    setSuccess("Kurs aktualisiert.");
    router.refresh();
  }

  async function uploadImage(file: File) {
    setError(null);
    setSuccess(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/courses/${course.id}/image`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Bild-Upload fehlgeschlagen.");
      return;
    }
    setHasImage(true);
    setImageVersion(Date.now());
    setSuccess("Kursbild aktualisiert.");
  }

  async function removeImage() {
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/image`, { method: "DELETE" });
    if (!res.ok) {
      setError("Bild konnte nicht entfernt werden.");
      return;
    }
    setHasImage(false);
    setSuccess("Kursbild entfernt.");
  }

  async function duplicateCourse() {
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Duplizieren fehlgeschlagen.");
      return;
    }
    const json = await res.json();
    router.push(`/editor/kurs/${json.courseId}`);
    router.refresh();
  }

  async function dryRunImport(file: File) {
    setImporting(true);
    setError(null);
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setImporting(false);
      setImportReport({
        state: "errors",
        errors: [{ index: -1, message: "Datei ist kein gültiges JSON." }],
      });
      return;
    }
    const res = await fetch(`/api/courses/${course.id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, dryRun: true }),
    });
    const json = await res.json();
    setImporting(false);
    if (json.ok) {
      setImportReport({ state: "dry-ok", total: json.total, message: json.message, data });
    } else {
      setImportReport({ state: "errors", errors: json.errors ?? [] });
    }
  }

  async function applyImport() {
    if (importReport.state !== "dry-ok") return;
    setImporting(true);
    const res = await fetch(`/api/courses/${course.id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: importReport.data, dryRun: false }),
    });
    const json = await res.json();
    setImporting(false);
    if (json.ok) {
      setImportReport({
        state: "done",
        created: json.created,
        updated: json.updated,
        chaptersCreated: json.chaptersCreated,
      });
      if (importRef.current) importRef.current.value = "";
      router.refresh();
    } else {
      setImportReport({ state: "errors", errors: json.errors ?? [] });
    }
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
        <div className="badge badge--danger">
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}

      <form onSubmit={handleSubmit} className="card stack" style={{ padding: 20 }}>
        <h3 style={{ margin: 0 }}>Metadaten</h3>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label>Titel</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: "0 0 220px" }}>
            <label>Slug (URL-Pfad)</label>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mein-kurs"
            />
          </div>
          <div className="field" style={{ flex: "0 0 110px" }}>
            <label>Reihenfolge</label>
            <input
              className="input"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              title="Sichtbarkeits-Reihenfolge auf der Übersicht (klein = weiter vorne)"
            />
          </div>
        </div>
        <p className="muted text-xs" style={{ margin: 0 }}>
          Öffentlicher Pfad: /kurs/{slug} · Reihenfolge steuert die Sortierung auf der Startseite.
        </p>
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
          <p className="muted text-xs" style={{ margin: "4px 0 0" }}>
            Entwürfe erscheinen nicht auf der Startseite der Lernenden – ideal zum Aufbauen.
          </p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn--primary btn--sm" disabled={submitting || !title.trim()}>
            {submitting ? "Speichert …" : "Speichern"}
          </button>
        </div>
      </form>

      <div className="card stack" style={{ padding: 20 }}>
        <h3 style={{ margin: 0 }}>Kursbild</h3>
        <p className="muted text-sm" style={{ margin: 0 }}>
          Erscheint auf dem Editor-Dashboard, der Startseite und im Kurs-Header.
          PNG, JPEG oder WebP, maximal 2 MB.
        </p>
        <div className="row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/courses/${course.id}/image?v=${imageVersion}`}
              alt="Kursbild"
              style={{
                width: 220,
                height: 110,
                objectFit: "cover",
                borderRadius: "var(--ds-radius)",
                border: "1px solid var(--ds-border)",
              }}
            />
          ) : (
            <div
              className="muted"
              style={{
                width: 220,
                height: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed var(--ds-border)",
                borderRadius: "var(--ds-radius)",
                fontSize: 13,
              }}
            >
              Kein Bild
            </div>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ fontSize: 13 }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f);
                e.target.value = "";
              }}
            />
            {hasImage && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={removeImage}>
                Bild entfernen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card stack" style={{ padding: 20 }}>
        <h3 style={{ margin: 0 }}>Aktionen</h3>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={duplicateCourse}>
            Kurs duplizieren
          </button>
          <a
            className="btn btn--secondary btn--sm"
            href={`/api/courses/${course.id}/export`}
            download
          >
            Als JSON exportieren
          </a>
        </div>
        <p className="muted text-xs" style={{ margin: 0 }}>
          Duplizieren erstellt eine Kopie als Entwurf (ohne Nutzerfortschritte).
          Der Export enthält Kurs, Kapitel und alle Fragen – als Backup oder zum
          Teilen zwischen Instanzen.
        </p>
      </div>

      <div className="card stack" style={{ padding: 20 }}>
        <h3 style={{ margin: 0 }}>Fragen importieren (JSON)</h3>
        <p className="muted text-sm" style={{ margin: 0 }}>
          Format wie beim Export (oder einfache Liste {`{ "questions": [ … ] }`}).
          Der Import prüft zuerst alle Einträge (Dry-Run) und zeigt Fehler pro Zeile.
        </p>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          style={{ fontSize: 13 }}
          disabled={importing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void dryRunImport(f);
          }}
        />
        {importing && <p className="muted text-sm">Prüfe Import …</p>}
        {importReport.state === "errors" && (
          <div className="stack" style={{ gap: 4 }}>
            <strong style={{ color: "var(--ds-text-danger)", fontSize: 14 }}>
              {importReport.errors.length} Problem(e) gefunden – nichts importiert:
            </strong>
            {importReport.errors.slice(0, 10).map((err, i) => (
              <span key={i} className="muted text-sm">
                {err.index >= 0 ? `Eintrag ${err.index + 1}: ` : ""}{err.message}
              </span>
            ))}
            {importReport.errors.length > 10 && (
              <span className="muted text-sm">
                … und {importReport.errors.length - 10} weitere.
              </span>
            )}
          </div>
        )}
        {importReport.state === "dry-ok" && (
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge--success">{importReport.message}</span>
            <button type="button" className="btn btn--primary btn--sm" onClick={applyImport} disabled={importing}>
              {importing ? "Importiert …" : `${importReport.total} Fragen importieren`}
            </button>
          </div>
        )}
        {importReport.state === "done" && (
          <span className="badge badge--success">
            Import abgeschlossen: {importReport.created} neu, {importReport.updated} aktualisiert
            {importReport.chaptersCreated > 0 ? `, ${importReport.chaptersCreated} Kapitel angelegt` : ""}.
          </span>
        )}
      </div>

      <div className="card" style={{ padding: 20, borderColor: "var(--ds-text-danger)" }}>
        <h3 style={{ marginTop: 0, color: "var(--ds-text-danger)" }}>Gefahrenzone</h3>
        <p className="muted text-sm">
          Kurs löschen entfernt {course.questionCount > 0 ? `alle ${course.questionCount} Fragen, ` : ""}
          Kapitel und Nutzerfortschritte unwiderruflich.
        </p>
        <button type="button" className="btn btn--danger btn--sm" onClick={deleteCourse}>
          Kurs endgültig löschen
        </button>
      </div>
    </div>
  );
}
