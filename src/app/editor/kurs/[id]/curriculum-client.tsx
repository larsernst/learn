"use client";

import { useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { QuestionEditor, type EditorSubmitData } from "@/components/editor/question-editor";
import { slugify } from "@/lib/slug";

type ChapterData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
};

type QuestionData = {
  id: string;
  chapter: number;
  chapterTitle: string;
  chapterId: string | null;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: string | null;
  taskType: string | null;
  payload: unknown;
  order: number;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
};

const UNASSIGNED = "__unassigned__";

const TYPE_LABELS: Record<string, string> = {
  recall: "Freie Erinnerung",
  mcq: "Multiple-Choice",
  dragdrop: "Zuordnen",
  cloze: "Lückentext",
  order: "Sortieren",
  code: "Code",
};

export default function CurriculumClient({
  course,
  chapters: initialChapters,
  questions: initialQuestions,
  judge0Enabled = false,
}: {
  course: CourseInfo;
  chapters: ChapterData[];
  questions: QuestionData[];
  judge0Enabled?: boolean;
}) {
  const [chapters, setChapters] = useState<ChapterData[]>(initialChapters);
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [activeChapter, setActiveChapter] = useState<string>(
    initialChapters[0]?.id ?? UNASSIGNED
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [dragChapterId, setDragChapterId] = useState<string | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const unassignedCount = questions.filter((q) => q.chapterId === null).length;
  const chapterQuestions = (chapterId: string | null) =>
    questions
      .filter((q) => q.chapterId === chapterId)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const activeId = activeChapter === UNASSIGNED ? null : activeChapter;
  const activeQuestions = chapterQuestions(activeId);
  const activeChapterData = sortedChapters.find((c) => c.id === activeId) ?? null;

  function chapterQuestionCount(id: string) {
    return questions.filter((q) => q.chapterId === id).length;
  }

  // ── Kapitel-Aktionen ────────────────────────────────────────────────
  async function addChapter() {
    const title = newChapterTitle.trim();
    if (!title) return;
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Kapitel konnte nicht angelegt werden.");
      return;
    }
    const json = await res.json();
    setChapters((prev) => [...prev, json.chapter]);
    setNewChapterTitle("");
    setActiveChapter(json.chapter.id);
    setSuccess("Kapitel angelegt.");
  }

  async function renameChapter(id: string) {
    const title = renameTitle.trim();
    if (!title) return;
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Umbenennen fehlgeschlagen.");
      return;
    }
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    setQuestions((prev) => prev.map((q) => (q.chapterId === id ? { ...q, chapterTitle: title } : q)));
    setRenamingId(null);
    setSuccess("Kapitel umbenannt.");
  }

  async function persistChapterOrder(ordered: ChapterData[]) {
    setChapters(ordered);
    const res = await fetch(`/api/courses/${course.id}/chapters/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((c) => c.id) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sortierung fehlgeschlagen.");
    }
  }

  function moveChapter(id: string, dir: -1 | 1) {
    const list = [...sortedChapters];
    const idx = list.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    void persistChapterOrder(list.map((c, i) => ({ ...c, order: i + 1 })));
  }

  function dropChapter(targetId: string) {
    if (!dragChapterId || dragChapterId === targetId) return;
    const list = [...sortedChapters];
    const from = list.findIndex((c) => c.id === dragChapterId);
    const to = list.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDragChapterId(null);
    void persistChapterOrder(list.map((c, i) => ({ ...c, order: i + 1 })));
  }

  async function deleteChapter(ch: ChapterData) {
    const count = chapterQuestionCount(ch.id);
    if (
      !window.confirm(
        `Kapitel „${ch.title}" wirklich löschen?` +
          (count > 0
            ? `\n${count} Frage(n) bleiben erhalten und landen unter „Nicht zugeordnet".`
            : "")
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters/${ch.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setChapters((prev) => prev.filter((c) => c.id !== ch.id));
    setQuestions((prev) => prev.map((q) => (q.chapterId === ch.id ? { ...q, chapterId: null } : q)));
    if (activeChapter === ch.id) setActiveChapter(UNASSIGNED);
    setSuccess("Kapitel gelöscht – Fragen sind nun nicht zugeordnet.");
  }

  // ── Fragen-Aktionen ─────────────────────────────────────────────────
  async function deleteQuestion(q: QuestionData) {
    if (
      !window.confirm(
        `Frage „${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""}" wirklich löschen? Alle Nutzerfortschritte zu dieser Frage gehen verloren.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
    setSuccess("Frage gelöscht.");
  }

  async function editQuestion(id: string, data: EditorSubmitData) {
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: data.question,
        answer: data.answer,
        sourceRef: data.sourceRef,
        confidence: data.confidence || null,
        chapterId: data.chapterId,
        taskType: data.taskType,
        payload: data.taskPayload,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return false;
    }
    const chapter = chapters.find((c) => c.id === data.chapterId);
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              question: data.question,
              answer: data.answer,
              sourceRef: data.sourceRef,
              confidence: data.confidence || null,
              chapterId: data.chapterId,
              chapter: chapter?.order ?? q.chapter,
              chapterTitle: chapter?.title ?? q.chapterTitle,
              payload: data.taskPayload ?? null,
            }
          : q
      )
    );
    setSuccess("Frage aktualisiert.");
    return true;
  }

  async function moveQuestion(q: QuestionData, targetChapterId: string | null) {
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: targetChapterId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Verschieben fehlgeschlagen.");
      return;
    }
    const target = chapters.find((c) => c.id === targetChapterId);
    setQuestions((prev) =>
      prev.map((x) =>
        x.id === q.id
          ? {
              ...x,
              chapterId: targetChapterId,
              chapter: target?.order ?? x.chapter,
              chapterTitle: target?.title ?? x.chapterTitle,
            }
          : x
      )
    );
    setSuccess(target ? `Frage nach „${target.title}" verschoben.` : "Frage ist nun nicht zugeordnet.");
  }

  async function duplicateQuestion(q: QuestionData) {
    setError(null);
    const id = `${q.id}-kopie-${Date.now().toString(36)}`;
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [
          {
            id,
            courseId: course.id,
            chapterId: q.chapterId ?? undefined,
            chapter: q.chapter,
            chapterTitle: q.chapterTitle,
            question: `${q.question} (Kopie)`,
            answer: q.answer,
            sourceRef: q.sourceRef,
            confidence: q.confidence ?? undefined,
            taskType: (q.taskType ?? "recall") as "recall",
            payload: q.payload ?? undefined,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Duplizieren fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => [
      ...prev,
      { ...q, id, question: `${q.question} (Kopie)`, order: q.order + 1 },
    ]);
    setSuccess("Frage dupliziert.");
  }

  async function moveQuestionOrder(q: QuestionData, dir: -1 | 1) {
    const list = [...activeQuestions];
    const idx = list.findIndex((x) => x.id === q.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    const reordered = list.map((x, i) => ({ ...x, order: i + 1 }));
    setQuestions((prev) => prev.map((x) => reordered.find((r) => r.id === x.id) ?? x));
    const res = await fetch(
      `/api/courses/${course.id}/questions/reorder?chapter=${activeId ?? "null"}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((x) => x.id) }),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sortierung fehlgeschlagen.");
    }
  }

  async function addQuestion(data: EditorSubmitData) {
    setError(null);
    const chapter = chapters.find((c) => c.id === data.chapterId);
    if (!chapter) {
      setError("Bitte ein Kapitel wählen.");
      return false;
    }
    const id = `${chapter.order}-${slugify(data.question).slice(0, 40)}-${Date.now().toString(36)}`;
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [
          {
            id,
            courseId: course.id,
            chapterId: chapter.id,
            chapter: chapter.order,
            chapterTitle: chapter.title,
            question: data.question,
            answer: data.answer,
            sourceRef: data.sourceRef,
            confidence: data.confidence || undefined,
            taskType: data.taskType,
            payload: data.taskPayload,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Frage konnte nicht hinzugefügt werden.");
      return false;
    }
    const newQ: QuestionData = {
      id,
      chapter: chapter.order,
      chapterTitle: chapter.title,
      chapterId: chapter.id,
      question: data.question,
      answer: data.answer,
      sourceRef: data.sourceRef,
      confidence: data.confidence || null,
      taskType: data.taskType,
      payload: data.taskPayload ?? null,
      order: chapterQuestions(chapter.id).length + 1,
    };
    setQuestions((prev) => [...prev, newQ]);
    setSuccess("Frage hinzugefügt.");
    return true;
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="stack">
      <Notice error={error} success={success} />

      <div className="card" style={{ padding: 16 }}>
        <div className="row row--between" style={{ flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 4, flex: 1, minWidth: 200 }}>
            <strong>{course.title}</strong>
            {course.description && (
              <span className="muted" style={{ fontSize: 13 }}>{course.description}</span>
            )}
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {course.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                /kurs/{course.slug}
              </span>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {sortedChapters.length} Kapitel · {questions.length} Fragen
              </span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Link href={`/kurs/${course.id}`} className="btn btn--ghost btn--sm">
              Als Lernender ansehen
            </Link>
            <Link href={`/editor/kurs/${course.id}/einstellungen`} className="btn btn--ghost btn--sm">
              Einstellungen
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 280px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
        className="curriculum-grid"
      >
        {/* ── Kapitel-Spalte ── */}
        <div className="card" style={{ padding: 12 }}>
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>Kapitel</strong>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{sortedChapters.length}</span>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {sortedChapters.map((ch, idx) => (
              <div
                key={ch.id}
                draggable
                onDragStart={() => setDragChapterId(ch.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropChapter(ch.id)}
                onDragEnd={() => setDragChapterId(null)}
                style={{
                  border: `1px solid ${ch.id === activeId ? "var(--ds-brand, #1868db)" : "var(--ds-border)"}`,
                  borderRadius: "var(--ds-radius)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: ch.id === activeId ? "rgba(24,104,219,0.06)" : undefined,
                  opacity: dragChapterId === ch.id ? 0.5 : 1,
                }}
                onClick={() => {
                  setActiveChapter(ch.id);
                  setShowForm(false);
                }}
              >
                {renamingId === ch.id ? (
                  <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      className="input"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void renameChapter(ch.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => void renameChapter(ch.id)}>
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="row row--between" style={{ gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
                        {idx + 1}. {ch.title}
                      </span>
                      <span className="badge badge--muted" style={{ fontSize: 10 }}>
                        {chapterQuestionCount(ch.id)}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 2, marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={idx === 0} onClick={() => moveChapter(ch.id, -1)} title="Nach oben">
                        ↑
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={idx === sortedChapters.length - 1} onClick={() => moveChapter(ch.id, 1)} title="Nach unten">
                        ↓
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} onClick={() => { setRenamingId(ch.id); setRenameTitle(ch.title); }} title="Umbenennen">
                        ✎
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} onClick={() => void deleteChapter(ch)} title="Löschen">
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {unassignedCount > 0 && (
              <div
                style={{
                  border: `1px dashed ${activeChapter === UNASSIGNED ? "var(--ds-brand, #1868db)" : "var(--ds-border)"}`,
                  borderRadius: "var(--ds-radius)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: activeChapter === UNASSIGNED ? "rgba(24,104,219,0.06)" : undefined,
                }}
                onClick={() => {
                  setActiveChapter(UNASSIGNED);
                  setShowForm(false);
                }}
              >
                <div className="row row--between" style={{ gap: 4 }}>
                  <span className="muted" style={{ fontSize: 13, fontStyle: "italic" }}>
                    Nicht zugeordnet
                  </span>
                  <span className="badge badge--muted" style={{ fontSize: 10 }}>{unassignedCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 4, marginTop: 12 }}>
            <input
              className="input"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Neues Kapitel …"
              onKeyDown={(e) => {
                if (e.key === "Enter") void addChapter();
              }}
            />
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => void addChapter()} disabled={!newChapterTitle.trim()}>
              +
            </button>
          </div>
        </div>

        {/* ── Fragen-Spalte ── */}
        <div className="stack">
          <div className="row row--between" style={{ flexWrap: "wrap", gap: 8 }}>
            <strong>
              {activeChapterData
                ? `Kapitel ${activeChapterData.order} · ${activeChapterData.title}`
                : "Nicht zugeordnete Fragen"}
            </strong>
            {activeChapterData && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setShowForm(!showForm);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {showForm ? "Abbrechen" : "Neue Frage"}
              </button>
            )}
          </div>

          {showForm && activeChapterData && (
            <QuestionEditor
              chapters={sortedChapters}
              defaultChapterId={activeChapterData.id}
              courseId={course.id}
              judge0Enabled={judge0Enabled}
              onSubmit={async (data) => {
                const ok = await addQuestion(data);
                if (ok) setShowForm(false);
                return ok;
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {!activeChapterData && activeQuestions.length === 0 && sortedChapters.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p className="muted" style={{ margin: 0 }}>
                Lege links dein erstes Kapitel an – danach kannst du Fragen hinzufügen.
              </p>
            </div>
          )}

          {activeQuestions.length === 0 && (activeChapterData || unassignedCount > 0) && (
            <p className="muted">Keine Fragen in diesem Kapitel.</p>
          )}

          {activeQuestions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              chapters={sortedChapters}
              courseId={course.id}
              judge0Enabled={judge0Enabled}
              isFirst={idx === 0}
              isLast={idx === activeQuestions.length - 1}
              onDelete={() => deleteQuestion(q)}
              onEdit={(data) => editQuestion(q.id, data)}
              onMove={(target) => moveQuestion(q, target)}
              onDuplicate={() => duplicateQuestion(q)}
              onReorder={(dir) => moveQuestionOrder(q, dir)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Notice({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}
    </>
  );
}

function QuestionRow({
  question: q,
  chapters,
  courseId,
  judge0Enabled,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMove,
  onDuplicate,
  onReorder,
}: {
  question: QuestionData;
  chapters: ChapterData[];
  courseId: string;
  judge0Enabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onEdit: (data: EditorSubmitData) => Promise<boolean>;
  onMove: (targetChapterId: string | null) => void;
  onDuplicate: () => void;
  onReorder: (dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <QuestionEditor
        chapters={chapters.map((c) => ({ id: c.id, title: c.title, order: c.order }))}
        defaultChapterId={q.chapterId ?? chapters[0]?.id ?? ""}
        courseId={courseId}
        judge0Enabled={judge0Enabled}
        initial={{
          chapterId: q.chapterId ?? chapters[0]?.id ?? "",
          question: q.question,
          answer: q.answer,
          sourceRef: q.sourceRef,
          confidence: (q.confidence as "high" | "low" | "") ?? "",
          taskType: (q.taskType ?? "recall") as EditorSubmitData["taskType"],
          payload: q.payload,
        }}
        onSubmit={async (data) => {
          const ok = await onEdit(data);
          if (ok) setEditing(false);
          return ok;
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 0, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}><Markdown source={q.question} /></div>
          <div className="divider" style={{ margin: "8px 0" }} />
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            <span className="eyebrow" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
              Antwort
            </span>
            <Markdown source={q.answer.slice(0, 150) + (q.answer.length > 150 ? "…" : "")} />
          </div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>
              {TYPE_LABELS[q.taskType ?? "recall"] ?? q.taskType}
            </span>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{q.sourceRef}</span>
            {q.confidence === "low" && (
              <span className="badge badge--warn" style={{ fontSize: 11 }}>prüfen</span>
            )}
          </div>
        </div>
        <div className="stack" style={{ gap: 6, alignItems: "flex-end" }}>
          <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={isFirst} onClick={() => onReorder(-1)} title="Nach oben">
              ↑
            </button>
            <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={isLast} onClick={() => onReorder(1)} title="Nach unten">
              ↓
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
              Bearbeiten
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDuplicate} title="Duplizieren">
              ⧉
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}>
              Löschen
            </button>
          </div>
          <select
            className="input"
            style={{ fontSize: 12, padding: "4px 8px", maxWidth: 200 }}
            value={q.chapterId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== (q.chapterId ?? "")) onMove(v === "" ? null : v);
            }}
            title="In Kapitel verschieben"
          >
            <option value="">Nicht zugeordnet</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.order}. {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

