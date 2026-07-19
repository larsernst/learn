"use client";

import { useState } from "react";
import type { TaskType } from "@/lib/tasks/types";
import { gradeAttempt, serializeTask } from "@/lib/tasks/registry";
import { Markdown } from "@/components/markdown";
import { McqRenderer } from "@/components/questions/McqRenderer";
import { RecallRenderer } from "@/components/questions/RecallRenderer";
import {
  DragDropRenderer,
  ClozeRenderer,
  OrderRenderer,
} from "@/components/questions/AdvancedRenderers";
import type { McqPublic } from "@/lib/tasks/mcq/payload";
import type { DragDropPublic } from "@/lib/tasks/dragdrop/payload";
import type { ClozePublic } from "@/lib/tasks/cloze/payload";
import type { OrderPublic } from "@/lib/tasks/order/payload";
import type { McqPayload } from "@/lib/tasks/mcq/payload";
import type { DragDropPayload } from "@/lib/tasks/dragdrop/payload";
import type { OrderPayload } from "@/lib/tasks/order/payload";

// Lernenden-Vorschau im Editor: rendert die echten Task-Renderer mit dem
// Public-Payload (serializeTask strippt Lösungen) und bewertet Versuche
// client-seitig via gradeAttempt – ohne Server, ohne SM-2-Eintrag.
export function QuestionPreview({
  taskType,
  payload,
  question,
  answer,
}: {
  taskType: TaskType;
  payload: unknown;
  question: string;
  answer: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");

  if (taskType === "code") {
    return (
      <div className="card" style={{ padding: 16 }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>Vorschau</span>
        <Markdown source={question} className="review-question" />
        <p className="muted" style={{ fontSize: 13 }}>
          Code-Aufgaben können in der Vorschau nicht ausgeführt werden – die Bewertung
          läuft über Judge0 auf dem Server.
        </p>
      </div>
    );
  }

  const serialized = serializeTask(taskType, payload, { mcqEnabled: true });

  function submit() {
    let attempt: unknown;
    if (taskType === "mcq") attempt = { selectedOptionIds: selected };
    else if (taskType === "dragdrop") attempt = { assignment };
    else if (taskType === "cloze") attempt = { answers };
    else if (taskType === "order") attempt = { orderedIds };
    else return;
    const r = gradeAttempt(taskType, payload, attempt);
    setResult(r.correct);
    setRevealed(true);
  }

  const mcqCorrectIds =
    taskType === "mcq"
      ? ((payload as McqPayload)?.options ?? []).filter((o) => o.correct).map((o) => o.id)
      : null;
  const ddCorrectAssignment = taskType === "dragdrop" ? (payload as DragDropPayload)?.correct ?? null : null;
  const orderCorrect = taskType === "order" ? (payload as OrderPayload)?.correctOrder ?? null : null;

  return (
    <div className="card preview-card" style={{ padding: 16, borderStyle: "dashed" }}>
      <div className="row row--between" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>Vorschau (Lernenden-Sicht)</span>
        {result !== null && (
          <span className={`badge ${result ? "badge--success" : "badge--warn"}`}>
            {result ? "Richtig" : "Falsch"}
          </span>
        )}
      </div>
      <Markdown source={question || "*(Frage fehlt)*"} className="review-question" />

      {serialized.type === "mcq" && serialized.payload ? (
        <McqRenderer
          options={(serialized.payload as McqPublic).options}
          selectionMode={(serialized.payload as McqPublic).selectionMode}
          selected={selected}
          disabled={revealed}
          correctIds={revealed ? mcqCorrectIds : null}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onSubmit={submit}
          revealed={revealed}
          submitLabel="Prüfen"
        />
      ) : taskType === "dragdrop" && serialized.payload ? (
        <DragDropRenderer
          payload={serialized.payload as DragDropPublic}
          assignment={assignment}
          onAssignmentChange={setAssignment}
          revealed={revealed}
          correctAssignment={revealed ? ddCorrectAssignment : null}
          onSubmit={submit}
        />
      ) : taskType === "cloze" && serialized.payload ? (
        <ClozeRenderer
          payload={serialized.payload as ClozePublic}
          answers={answers}
          onAnswersChange={setAnswers}
          revealed={revealed}
          onSubmit={submit}
        />
      ) : taskType === "order" && serialized.payload ? (
        <OrderRenderer
          payload={serialized.payload as OrderPublic}
          orderedIds={orderedIds}
          onOrderChange={setOrderedIds}
          revealed={revealed}
          correctOrder={revealed ? orderCorrect : null}
          onSubmit={submit}
        />
      ) : (
        <RecallRenderer
          draft={draft}
          onDraft={setDraft}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          submitting={false}
          onGrade={() => setRevealed(true)}
          simpleGrading={true}
        />
      )}

      {revealed && (
        <div style={{ marginTop: 12 }}>
          <p className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>
            Musterantwort
          </p>
          <Markdown source={answer || "*(Antwort fehlt)*"} className="review-answer" />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ marginTop: 8 }}
            onClick={() => {
              setRevealed(false);
              setResult(null);
              setSelected([]);
              setAssignment({});
              setAnswers({});
              setOrderedIds([]);
            }}
          >
            Zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
