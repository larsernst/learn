"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TaskType } from "@/lib/tasks/types";
import { MarkdownField } from "@/components/editor/markdown-field";
import { TypePicker } from "@/components/editor/type-picker";
import { DragDropEditor, McqEditor, OrderEditor } from "@/components/editor/type-editors";
import { ClozeEditor, type ClozeFormState } from "@/components/editor/cloze-editor";
import { CodeEditor } from "@/components/editor/code-editor";
import { QuestionPreview } from "@/components/editor/question-preview";
import {
  buildCodePayload,
  buildDragDropPayload,
  buildMcqPayload,
  buildOrderPayload,
  codeFormError,
  codeToForm,
  dragdropFormError,
  dragdropToForm,
  mcqFormError,
  mcqToForm,
  orderFormError,
  orderToForm,
  type CodeFormState,
  type DragDropFormState,
  type McqFormState,
  type OrderFormState,
} from "@/lib/editor/payload";
import { clozeToBlankDefs, clozeToText, parseClozeText } from "@/lib/editor/cloze-text";

export type EditorSubmitData = {
  chapterId: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: "high" | "low" | "";
  taskType: TaskType;
  taskPayload: unknown;
};

export type EditorInitial = {
  chapterId: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: "high" | "low" | "";
  taskType: TaskType;
  payload: unknown;
};

export function QuestionEditor({
  chapters,
  defaultChapterId,
  courseId,
  initial,
  judge0Enabled,
  onSubmit,
  onCancel,
}: {
  chapters: { id: string; title: string; order: number }[];
  defaultChapterId: string;
  courseId: string;
  initial?: EditorInitial;
  judge0Enabled: boolean;
  onSubmit: (data: EditorSubmitData) => Promise<boolean>;
  onCancel: () => void;
}) {
  const editMode = !!initial;
  const [chapterId, setChapterId] = useState(initial?.chapterId ?? defaultChapterId);
  const [taskType, setTaskType] = useState<TaskType>(initial?.taskType ?? "recall");
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [sourceRef, setSourceRef] = useState(initial?.sourceRef ?? "");
  const [confidence, setConfidence] = useState<"high" | "low" | "">(initial?.confidence ?? "");
  const [mcq, setMcq] = useState<McqFormState>(
    initial?.taskType === "mcq" ? mcqToForm(initial.payload) : { options: [{ text: "", correct: false }, { text: "", correct: false }] }
  );
  const [dragdrop, setDragdrop] = useState<DragDropFormState>(
    initial?.taskType === "dragdrop" ? dragdropToForm(initial.payload) : { zones: [{ label: "" }], items: [{ text: "", zoneIndex: null }] }
  );
  const [cloze, setCloze] = useState<ClozeFormState>(() => {
    if (initial?.taskType === "cloze" && initial.payload) {
      const segs = (initial.payload as { segments?: Parameters<typeof clozeToText>[0] }).segments;
      if (Array.isArray(segs)) {
        return { text: clozeToText(segs), blanks: clozeToBlankDefs(segs) };
      }
    }
    return { text: "", blanks: [] };
  });
  const [order, setOrder] = useState<OrderFormState>(
    initial?.taskType === "order" ? orderToForm(initial.payload) : { items: ["", ""] }
  );
  const [code, setCode] = useState<CodeFormState>(
    initial?.taskType === "code"
      ? codeToForm(initial.payload)
      : { languageId: 71, starterCode: "", testCases: [{ input: "", expectedOutput: "", hidden: false }], timeLimitMs: 2000, memoryLimitKb: 262144 }
  );
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const draftKey = `editor-draft-${courseId}`;

  // Entwürfe (nur im Anlegen-Modus): bei jeder Änderung speichern.
  useEffect(() => {
    if (editMode) return;
    if (localStorage.getItem(draftKey)) setDraftAvailable(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editMode) return;
    const hasContent = question.trim() || answer.trim();
    if (!hasContent) return;
    const draft = { chapterId, taskType, question, answer, sourceRef, confidence, mcq, dragdrop, cloze, order, code };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [chapterId, taskType, question, answer, sourceRef, confidence, mcq, dragdrop, cloze, order, code, draftKey, editMode]);

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      setChapterId(d.chapterId ?? defaultChapterId);
      setTaskType(d.taskType ?? "recall");
      setQuestion(d.question ?? "");
      setAnswer(d.answer ?? "");
      setSourceRef(d.sourceRef ?? "");
      setConfidence(d.confidence ?? "");
      if (d.mcq) setMcq(d.mcq);
      if (d.dragdrop) setDragdrop(d.dragdrop);
      if (d.cloze) setCloze(d.cloze);
      if (d.order) setOrder(d.order);
      if (d.code) setCode(d.code);
    } catch {
      // kaputter Entwurf wird ignoriert
    }
    setDraftAvailable(false);
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    setDraftAvailable(false);
  }

  const typeError = useMemo(() => {
    if (taskType === "mcq") return mcqFormError(mcq);
    if (taskType === "dragdrop") return dragdropFormError(dragdrop);
    if (taskType === "cloze") {
      if (!cloze.text.trim()) return "Der Lückentext fehlt.";
      if (cloze.blanks.length === 0) return "Mindestens eine Lücke (Wort markieren → „Aus Auswahl Lücke machen“).";
      if (cloze.blanks.some((b) => b.accepted.filter((a) => a.trim()).length === 0)) {
        return "Jede Lücke braucht mindestens eine akzeptierte Antwort.";
      }
      const { missingDefs } = parseClozeText(cloze.text, cloze.blanks);
      if (missingDefs.length > 0) return `Marker [[${missingDefs.join("]], [[")}]] ohne Lücken-Definition im Text.`;
      return null;
    }
    if (taskType === "order") return orderFormError(order);
    if (taskType === "code") return codeFormError(code);
    return null;
  }, [taskType, mcq, dragdrop, cloze, order, code]);

  const baseError = useMemo(() => {
    if (!question.trim()) return "Frage-Text fehlt.";
    if (!answer.trim()) return "Musterantwort fehlt.";
    if (!sourceRef.trim()) return "Quellen-Angabe fehlt.";
    return null;
  }, [question, answer, sourceRef]);

  const formError = baseError ?? typeError;

  function buildPayload(): unknown {
    if (taskType === "recall") return null;
    if (taskType === "mcq") return buildMcqPayload(mcq);
    if (taskType === "dragdrop") return buildDragDropPayload(dragdrop);
    if (taskType === "cloze") return { segments: parseClozeText(cloze.text, cloze.blanks).segments };
    if (taskType === "order") return buildOrderPayload(order);
    if (taskType === "code") return buildCodePayload(code);
    return null;
  }

  async function submit(andNext: boolean) {
    if (formError || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({
      chapterId,
      question,
      answer,
      sourceRef,
      confidence,
      taskType,
      taskPayload: buildPayload(),
    });
    setSubmitting(false);
    if (ok && !editMode) {
      localStorage.removeItem(draftKey);
      if (andNext) {
        setQuestion("");
        setAnswer("");
        setSourceRef("");
        setConfidence("");
        setMcq({ options: [{ text: "", correct: false }, { text: "", correct: false }] });
        setDragdrop({ zones: [{ label: "" }], items: [{ text: "", zoneIndex: null }] });
        setCloze({ text: "", blanks: [] });
        setOrder({ items: ["", ""] });
        setCode({ languageId: 71, starterCode: "", testCases: [{ input: "", expectedOutput: "", hidden: false }], timeLimitMs: 2000, memoryLimitKb: 262144 });
        setShowPreview(false);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void submit(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="stack"
      onKeyDown={onKeyDown}
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
    >

      {draftAvailable && !editMode && (
        <div className="badge badge--muted row" style={{ gap: 8, justifyContent: "space-between" }}>
          <span>Entwurf aus einer früheren Sitzung gefunden.</span>
          <span className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn--primary btn--sm" onClick={restoreDraft}>
              Wiederherstellen
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={discardDraft}>
              Verwerfen
            </button>
          </span>
        </div>
      )}

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 240px" }}>
          <label>Kapitel</label>
          <select className="input" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.order}. {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Quelle (sourceRef)</label>
          <input
            className="input"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            placeholder="z. B. skript.md, Folie 12"
          />
        </div>
        <div className="field" style={{ flex: "0 0 140px" }}>
          <label>Konfidenz</label>
          <select
            className="input"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as "high" | "low" | "")}
          >
            <option value="">—</option>
            <option value="high">high</option>
            <option value="low">low (prüfen)</option>
          </select>
        </div>
      </div>

      {!editMode && <TypePicker value={taskType} onChange={setTaskType} />}
      {editMode && (
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Aufgabentyp: <strong>{taskType}</strong> (Typwechsel beim Bearbeiten nicht möglich)
        </p>
      )}

      <MarkdownField
        label="Frage"
        value={question}
        onChange={setQuestion}
        rows={3}
        placeholder="z. B. Welche Aufgaben hat ein Betriebssystem? (Markdown, $KaTeX$, ```code```)"
      />
      <MarkdownField
        label="Musterantwort"
        value={answer}
        onChange={setAnswer}
        rows={4}
        placeholder="Modellantwort aus der Vorlesung/dem Skript …"
      />

      {taskType === "mcq" && <McqEditor value={mcq} onChange={setMcq} />}
      {taskType === "dragdrop" && <DragDropEditor value={dragdrop} onChange={setDragdrop} />}
      {taskType === "cloze" && <ClozeEditor value={cloze} onChange={setCloze} />}
      {taskType === "order" && <OrderEditor value={order} onChange={setOrder} />}
      {taskType === "code" && <CodeEditor value={code} onChange={setCode} judge0Enabled={judge0Enabled} />}

      {formError && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {formError}
        </div>
      )}

      <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="submit" className="btn btn--primary btn--sm" disabled={submitting || !!formError}>
          {submitting ? "Speichert …" : editMode ? "Speichern" : "Frage speichern"}
        </button>
        {!editMode && (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={submitting || !!formError}
            onClick={() => void submit(true)}
          >
            Speichern & nächste Frage
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Vorschau schließen" : "Als Lernender testen"}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Abbrechen
        </button>
        <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>
          Strg+Enter = Speichern
        </span>
      </div>

      {showPreview && (
        <QuestionPreview
          taskType={taskType}
          payload={buildPayload()}
          question={question}
          answer={answer}
        />
      )}
    </form>
  );
}
