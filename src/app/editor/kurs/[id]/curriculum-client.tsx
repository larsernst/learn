"use client";

import { useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";

type McqOptionData = { id: string; text: string; correct: boolean };

type QuestionData = {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: string | null;
  taskType: string | null;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
};

export default function CurriculumClient({
  course,
  questions: initialQuestions,
}: {
  course: CourseInfo;
  questions: QuestionData[];
}) {
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function groupByChapter(qs: QuestionData[]) {
    const map = new Map<number, { chapter: number; chapterTitle: string; items: QuestionData[] }>();
    for (const q of qs) {
      const entry = map.get(q.chapter) ?? { chapter: q.chapter, chapterTitle: q.chapterTitle, items: [] };
      entry.items.push(q);
      map.set(q.chapter, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.chapter - b.chapter);
  }

  async function deleteQuestion(q: QuestionData) {
    if (!window.confirm(`Frage „${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""}" wirklich löschen? Alle Nutzerfortschritte zu dieser Frage gehen verloren.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
    setSuccess("Frage gelöscht.");
  }

  async function editQuestion(id: string, data: { question: string; answer: string }) {
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return false;
    }
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: data.question, answer: data.answer } : q))
    );
    setSuccess("Frage aktualisiert.");
    return true;
  }

  async function addQuestion(data: {
    chapter: number;
    chapterTitle: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    taskType: "recall" | "mcq" | "dragdrop" | "cloze" | "order" | "code";
    // taskPayload ist typabhängig; hier als unknown, da das Bundle validiert.
    taskPayload: unknown;
    // legacy: nur noch für MCQ (kompatibilitätshalber)
    mcqOptions?: McqOptionData[];
  }) {
    setError(null);
    setSuccess(null);
    const id = `${data.chapter}-${slugify(data.question).slice(0, 40)}-${Date.now().toString(36)}`;
    const payload = {
      questions: [
        {
          id,
          courseId: course.id,
          chapter: data.chapter,
          chapterTitle: data.chapterTitle,
          question: data.question,
          answer: data.answer,
          sourceRef: data.sourceRef,
          confidence: data.confidence || undefined,
          taskType: data.taskType,
          payload: data.taskPayload,
        },
      ],
    };
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Frage konnte nicht hinzugefügt werden.");
      return false;
    }
    const newQ: QuestionData = {
      id,
      chapter: data.chapter,
      chapterTitle: data.chapterTitle,
      question: data.question,
      answer: data.answer,
      sourceRef: data.sourceRef,
      confidence: data.confidence || null,
      taskType: data.taskType,
    };
    setQuestions((prev) => [...prev, newQ]);
    setSuccess("Frage hinzugefügt.");
    setShowForm(false);
    return true;
  }

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
                {questions.length} Fragen
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

      <div className="row" style={{ justifyContent: "flex-end" }}>
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
      </div>

      {showForm && (
        <AddQuestionForm
          onSubmit={async (data) => {
            await addQuestion(data);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {questions.length === 0 ? (
        <p className="muted">Keine Fragen in diesem Kurs – lege die erste Frage an.</p>
      ) : (
        groupByChapter(questions).map((ch) => (
          <div key={ch.chapter}>
            <div
              className="row row--between"
              style={{ flexWrap: "wrap", marginTop: 24, marginBottom: 8 }}
            >
              <strong>
                Kapitel {ch.chapter} · {ch.chapterTitle}
              </strong>
              <span className="badge badge--muted">{ch.items.length} Fragen</span>
            </div>
            <div className="stack">
              {ch.items.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  onDelete={() => deleteQuestion(q)}
                  onEdit={(data) => editQuestion(q.id, data)}
                />
              ))}
            </div>
          </div>
        ))
      )}
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
  onDelete,
  onEdit,
}: {
  question: QuestionData;
  onDelete: () => void;
  onEdit: (data: { question: string; answer: string }) => Promise<boolean>;
}) {
  const isMcq = q.taskType === "mcq";
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(q.question);
  const [editAnswer, setEditAnswer] = useState(q.answer);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setEditQuestion(q.question);
    setEditAnswer(q.answer);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const ok = await onEdit({ question: editQuestion, answer: editAnswer });
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="stack">
          <div className="field">
            <label>Frage</label>
            <textarea
              className="textarea"
              rows={2}
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Antwort</label>
            <textarea
              className="textarea"
              rows={4}
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
            />
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={save}
              disabled={saving || !editQuestion.trim() || !editAnswer.trim()}
            >
              {saving ? "Speichert …" : "Speichern"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
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
              {isMcq ? "Multiple-Choice" : "Freie Erinnerung"}
            </span>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{q.sourceRef}</span>
            {q.confidence === "low" && (
              <span className="badge badge--warn" style={{ fontSize: 11 }}>prüfen</span>
            )}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={startEdit}>
            Bearbeiten
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}>
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

type EditorTaskType = "recall" | "mcq" | "dragdrop" | "cloze" | "order" | "code";

function AddQuestionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    chapter: number;
    chapterTitle: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    taskType: EditorTaskType;
    taskPayload: unknown;
    mcqOptions?: McqOptionData[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [chapter, setChapter] = useState("1");
  const [chapterTitle, setChapterTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [confidence, setConfidence] = useState<"high" | "low" | "">("");
  const [taskType, setTaskType] = useState<EditorTaskType>("recall");
  const [mcqOptions, setMcqOptions] = useState<McqOptionData[]>([
    { id: "opt-1", text: "", correct: false },
    { id: "opt-2", text: "", correct: false },
  ]);
  // dragdrop
  const [ddZones, setDdZones] = useState<{ id: string; label: string }[]>([
    { id: "zone-1", label: "" },
  ]);
  const [ddItems, setDdItems] = useState<{ id: string; text: string }[]>([
    { id: "item-1", text: "" },
  ]);
  const [ddCorrect, setDdCorrect] = useState<Record<string, string>>({});
  // cloze
  const [clozeSegments, setClozeSegments] = useState<
    Array<
      | { kind: "text"; text: string }
      | { kind: "blank"; blankId: string; accepted: string; normalize: "exact" | "ignore-case" | "trim" | "regex" }
    >
  >([{ kind: "text", text: "" }]);
  // order
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>([
    { id: "item-1", text: "" },
    { id: "item-2", text: "" },
  ]);
  // code
  const [codeLanguages, setCodeLanguages] = useState<
    { languageId: number; label: string; starterCode: string }[]
  >([{ languageId: 71, label: "Python 3", starterCode: "" }]);
  const [codeTestCases, setCodeTestCases] = useState<
    { id: string; input: string; expectedOutput: string; hidden: boolean }[]
  >([{ id: "t1", input: "", expectedOutput: "", hidden: false }]);
  const [codeTimeLimitMs, setCodeTimeLimitMs] = useState(3000);
  const [codeMemoryLimitKb, setCodeMemoryLimitKb] = useState(262144);
  const [submitting, setSubmitting] = useState(false);

  function addMcqOption() {
    setMcqOptions((prev) => [...prev, { id: `opt-${prev.length + 1}`, text: "", correct: false }]);
  }
  function removeMcqOption(idx: number) {
    setMcqOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    let taskPayload: unknown = null;
    let mcqOptionsForServer: McqOptionData[] | undefined;
    if (taskType === "mcq") {
      const normalized = mcqOptions.map((o, i) => ({ ...o, id: `opt-${i + 1}` }));
      taskPayload = { options: normalized };
      mcqOptionsForServer = normalized;
    } else if (taskType === "dragdrop") {
      taskPayload = { zones: ddZones, items: ddItems, correct: ddCorrect };
    } else if (taskType === "cloze") {
      taskPayload = {
        segments: clozeSegments.map((s) =>
          s.kind === "blank"
            ? {
                kind: "blank" as const,
                blankId: s.blankId,
                accepted: s.accepted.split("\n").map((a) => a.trim()).filter(Boolean),
                normalize: s.normalize,
              }
            : { kind: "text" as const, text: s.text }
        ),
      };
    } else if (taskType === "order") {
      taskPayload = {
        items: orderItems,
        correctOrder: orderItems.map((i) => i.id),
      };
    } else if (taskType === "code") {
      taskPayload = {
        languages: codeLanguages,
        testCases: codeTestCases,
        timeLimitMs: codeTimeLimitMs,
        memoryLimitKb: codeMemoryLimitKb,
      };
    }
    await onSubmit({
      chapter: Number(chapter) || 1,
      chapterTitle,
      question,
      answer,
      sourceRef,
      confidence,
      taskType,
      taskPayload,
      mcqOptions: mcqOptionsForServer,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ padding: 20 }}>
      <h3 style={{ margin: 0 }}>Neue Frage hinzufügen</h3>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 80px" }}>
          <label>Kapitel</label>
          <input
            className="input"
            type="number"
            min={1}
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Kapiteltitel</label>
          <input
            className="input"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="z. B. Einführung"
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Frage</label>
        <textarea
          className="textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="z. B. Welche Aufgaben hat ein Betriebssystem?"
          required
        />
      </div>
      <div className="field">
        <label>Antwort</label>
        <textarea
          className="textarea"
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
      </div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Quelle (sourceRef)</label>
          <input
            className="input"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            placeholder="z. B. Kapitel1.md"
            required
          />
        </div>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label>Confidence</label>
          <select
            className="input"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as "high" | "low" | "")}
          >
            <option value="">—</option>
            <option value="high">high</option>
            <option value="low">low</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Aufgabentyp</label>
        <select
          className="input"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as EditorTaskType)}
        >
          <option value="recall">Freie Erinnerung (Selbstbewertung)</option>
          <option value="mcq">Multiple-Choice (auto)</option>
          <option value="dragdrop">Zuordnen / Drag & Drop (auto)</option>
          <option value="cloze">Lückentext (auto)</option>
          <option value="order">Sortieren / Reihenfolge (auto)</option>
          <option value="code">Code / Programmieraufgabe (auto, Judge0)</option>
        </select>
      </div>

      {taskType === "mcq" && (
        <div className="stack">
          <span className="muted" style={{ fontSize: 13 }}>Antwort-Optionen</span>
          {mcqOptions.map((opt, idx) => (
            <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 200 }}>
                <label>Option {idx + 1}</label>
                <input
                  className="input"
                  value={opt.text}
                  onChange={(e) => setMcqOptions((prev) => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))}
                  placeholder="Antworttext …"
                />
              </div>
              <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, paddingBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={opt.correct}
                  onChange={(e) => setMcqOptions((prev) => prev.map((o, i) => i === idx ? { ...o, correct: e.target.checked } : o))}
                />
                richtig
              </label>
              {mcqOptions.length > 2 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeMcqOption(idx)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--secondary btn--sm" onClick={addMcqOption}>
            Option hinzufügen
          </button>
        </div>
      )}

      {taskType === "dragdrop" && (
        <DragDropEditor
          zones={ddZones}
          items={ddItems}
          correct={ddCorrect}
          onZonesChange={setDdZones}
          onItemsChange={setDdItems}
          onCorrectChange={setDdCorrect}
        />
      )}

      {taskType === "cloze" && (
        <ClozeEditor segments={clozeSegments} onSegmentsChange={setClozeSegments} />
      )}

      {taskType === "order" && (
        <OrderEditor items={orderItems} onItemsChange={setOrderItems} />
      )}

      {taskType === "code" && (
        <CodeEditor
          languages={codeLanguages}
          testCases={codeTestCases}
          timeLimitMs={codeTimeLimitMs}
          memoryLimitKb={codeMemoryLimitKb}
          onLanguagesChange={setCodeLanguages}
          onTestCasesChange={setCodeTestCases}
          onTimeLimitChange={setCodeTimeLimitMs}
          onMemoryLimitChange={setCodeMemoryLimitKb}
        />
      )}

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>
          {submitting ? "Speichert …" : "Frage speichern"}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function DragDropEditor({
  zones,
  items,
  correct,
  onZonesChange,
  onItemsChange,
  onCorrectChange,
}: {
  zones: { id: string; label: string }[];
  items: { id: string; text: string }[];
  correct: Record<string, string>;
  onZonesChange: (z: { id: string; label: string }[]) => void;
  onItemsChange: (i: { id: string; text: string }[]) => void;
  onCorrectChange: (c: Record<string, string>) => void;
}) {
  function addZone() {
    onZonesChange([...zones, { id: `zone-${zones.length + 1}`, label: "" }]);
  }
  function addItem() {
    onItemsChange([...items, { id: `item-${items.length + 1}`, text: "" }]);
  }
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Zonen und Elemente anlegen; pro Element die korrekte Zone wählen.
      </span>
      <div className="stack">
        <strong style={{ fontSize: 14 }}>Zonen</strong>
        {zones.map((z, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "0 0 100px" }}>
              <label>ID</label>
              <input
                className="input"
                value={z.id}
                onChange={(e) =>
                  onZonesChange(zones.map((x, i) => (i === idx ? { ...x, id: e.target.value } : x)))
                }
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Bezeichnung</label>
              <input
                className="input"
                value={z.label}
                onChange={(e) =>
                  onZonesChange(zones.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
              />
            </div>
            {zones.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onZonesChange(zones.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" onClick={addZone}>
          Zone hinzufügen
        </button>
      </div>
      <div className="stack">
        <strong style={{ fontSize: 14 }}>Elemente</strong>
        {items.map((item, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Element {idx + 1}</label>
              <input
                className="input"
                value={item.text}
                onChange={(e) =>
                  onItemsChange(items.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
                }
              />
            </div>
            <div className="field" style={{ flex: "0 0 180px" }}>
              <label>Korrekte Zone</label>
              <select
                className="input"
                value={correct[item.id] ?? ""}
                onChange={(e) => onCorrectChange({ ...correct, [item.id]: e.target.value })}
              >
                <option value="">—</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label || z.id}
                  </option>
                ))}
              </select>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  onItemsChange(items.filter((_, i) => i !== idx));
                  const next = { ...correct };
                  delete next[item.id];
                  onCorrectChange(next);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" onClick={addItem}>
          Element hinzufügen
        </button>
      </div>
    </div>
  );
}

function ClozeEditor({
  segments,
  onSegmentsChange,
}: {
  segments: Array<
    | { kind: "text"; text: string }
    | {
        kind: "blank";
        blankId: string;
        accepted: string;
        normalize: "exact" | "ignore-case" | "trim" | "regex";
      }
  >;
  onSegmentsChange: (
    s: Array<
      | { kind: "text"; text: string }
      | {
          kind: "blank";
          blankId: string;
          accepted: string;
          normalize: "exact" | "ignore-case" | "trim" | "regex";
        }
    >
  ) => void;
}) {
  function addText() {
    onSegmentsChange([...segments, { kind: "text", text: "" }]);
  }
  function addBlank() {
    onSegmentsChange([
      ...segments,
      { kind: "blank", blankId: `blank-${segments.length + 1}`, accepted: "", normalize: "ignore-case" },
    ]);
  }
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Baue den Text aus Text- und Lücken-Segmenten zusammen. Pro Lücke:
        akzeptierte Antworten (eine pro Zeile) und eine Normalisierung.
      </span>
      {segments.map((seg, idx) => (
        <div key={idx} className="card" style={{ padding: 12 }}>
          <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>
              {seg.kind === "text" ? "Text" : "Lücke"}
            </span>
            {segments.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onSegmentsChange(segments.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
          {seg.kind === "text" ? (
            <textarea
              className="textarea"
              rows={2}
              value={seg.text}
              placeholder="Text …"
              onChange={(e) =>
                onSegmentsChange(
                  segments.map((s, i) => (i === idx ? { ...s, text: e.target.value } : s))
                )
              }
            />
          ) : (
            <div className="stack">
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <div className="field" style={{ flex: "0 0 140px" }}>
                  <label>Lücken-ID</label>
                  <input
                    className="input"
                    value={seg.blankId}
                    onChange={(e) =>
                      onSegmentsChange(
                        segments.map((s, i) =>
                          i === idx ? { ...s, blankId: e.target.value } : s
                        )
                      )
                    }
                  />
                </div>
                <div className="field" style={{ flex: "0 0 160px" }}>
                  <label>Normalisierung</label>
                  <select
                    className="input"
                    value={seg.normalize}
                    onChange={(e) =>
                      onSegmentsChange(
                        segments.map((s, i) =>
                          i === idx
                            ? { ...s, normalize: e.target.value as typeof seg.normalize }
                            : s
                        )
                      )
                    }
                  >
                    <option value="ignore-case">Groß-/Kleinschreibung ignorieren</option>
                    <option value="trim">Whitespace normalisieren</option>
                    <option value="exact">Exakt</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Akzeptierte Antworten (eine pro Zeile)</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={seg.accepted}
                  onChange={(e) =>
                    onSegmentsChange(
                      segments.map((s, i) =>
                        i === idx ? { ...s, accepted: e.target.value } : s
                      )
                    )
                  }
                  placeholder={"Antwort A\nAntwort B"}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addText}>
          Text-Segment
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addBlank}>
          Lücke hinzufügen
        </button>
      </div>
    </div>
  );
}

function OrderEditor({
  items,
  onItemsChange,
}: {
  items: { id: string; text: string }[];
  onItemsChange: (i: { id: string; text: string }[]) => void;
}) {
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Elemente in der korrekten Reihenfolge anlegen (oben = zuerst).
      </span>
      {items.map((item, idx) => (
        <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "0 0 40px" }}>
            <label>Nr.</label>
            <input className="input" value={idx + 1} disabled />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Element</label>
            <input
              className="input"
              value={item.text}
              onChange={(e) =>
                onItemsChange(items.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
              }
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
            disabled={items.length <= 2}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => onItemsChange([...items, { id: `item-${items.length + 1}`, text: "" }])}
      >
        Element hinzufügen
      </button>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CodeEditor({
  languages,
  testCases,
  timeLimitMs,
  memoryLimitKb,
  onLanguagesChange,
  onTestCasesChange,
  onTimeLimitChange,
  onMemoryLimitChange,
}: {
  languages: { languageId: number; label: string; starterCode: string }[];
  testCases: { id: string; input: string; expectedOutput: string; hidden: boolean }[];
  timeLimitMs: number;
  memoryLimitKb: number;
  onLanguagesChange: (
    l: { languageId: number; label: string; starterCode: string }[]
  ) => void;
  onTestCasesChange: (
    t: { id: string; input: string; expectedOutput: string; hidden: boolean }[]
  ) => void;
  onTimeLimitChange: (n: number) => void;
  onMemoryLimitChange: (n: number) => void;
}) {
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Code-Aufgaben werden über Judge0 automatisch bewertet. Sie benötigen
        JUDGE0_ENABLED=true auf dem Server. Sprache-IDs aus der{" "}
        <a
          href="https://github.com/judge0/judge0/blob/master/EXTRA_LANGUAGES.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Judge0-Liste
        </a>{" "}
        (z. B. 71 = Python 3, 63 = JavaScript, 50 = C).
      </span>

      <div className="stack">
        <strong style={{ fontSize: 14 }}>Sprachen</strong>
        {languages.map((lang, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ flex: "0 0 90px" }}>
              <label>Lang-ID</label>
              <input
                className="input"
                type="number"
                value={lang.languageId}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) =>
                      i === idx ? { ...x, languageId: Number(e.target.value) || 0 } : x
                    )
                  )
                }
              />
            </div>
            <div className="field" style={{ flex: "0 0 160px" }}>
              <label>Label</label>
              <input
                className="input"
                value={lang.label}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                  )
                }
                placeholder="Python 3"
              />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Starter-Code</label>
              <textarea
                className="textarea"
                rows={2}
                value={lang.starterCode}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) =>
                      i === idx ? { ...x, starterCode: e.target.value } : x
                    )
                  )
                }
                placeholder="# Dein Code …"
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </div>
            {languages.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onLanguagesChange(languages.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() =>
            onLanguagesChange([
              ...languages,
              { languageId: 63, label: "", starterCode: "" },
            ])
          }
        >
          Sprache hinzufügen
        </button>
      </div>

      <div className="stack">
        <strong style={{ fontSize: 14 }}>Testfälle</strong>
        {testCases.map((tc, idx) => (
          <div key={idx} className="card" style={{ padding: 12 }}>
            <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                Test {idx + 1}
              </span>
              <label className="row" style={{ gap: 4, fontSize: 13, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={tc.hidden}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) => (i === idx ? { ...x, hidden: e.target.checked } : x))
                    )
                  }
                />
                versteckt
              </label>
              <span className="muted" style={{ fontSize: 11 }}>
                {tc.hidden
                  ? "(Lerner sieht nur Pass/Fail)"
                  : "(Lerner sieht Ein- und Ausgabe)"}
              </span>
              {testCases.length > 1 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onTestCasesChange(testCases.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 150 }}>
                <label>stdin</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={tc.input}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) => (i === idx ? { ...x, input: e.target.value } : x))
                    )
                  }
                  placeholder="(leer)"
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 150 }}>
                <label>Erwartete Ausgabe</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={tc.expectedOutput}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) =>
                        i === idx ? { ...x, expectedOutput: e.target.value } : x
                      )
                    )
                  }
                  placeholder="42"
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() =>
            onTestCasesChange([
              ...testCases,
              { id: `t${testCases.length + 1}`, input: "", expectedOutput: "", hidden: true },
            ])
          }
        >
          Testfall hinzufügen
        </button>
      </div>

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label>Zeitlimit (ms)</label>
          <input
            className="input"
            type="number"
            min={100}
            max={15000}
            value={timeLimitMs}
            onChange={(e) => onTimeLimitChange(Number(e.target.value) || 3000)}
          />
        </div>
        <div className="field" style={{ flex: "0 0 200px" }}>
          <label>Speicherlimit (KB)</label>
          <input
            className="input"
            type="number"
            min={8192}
            max={524288}
            value={memoryLimitKb}
            onChange={(e) => onMemoryLimitChange(Number(e.target.value) || 262144)}
          />
        </div>
      </div>
    </div>
  );
}
