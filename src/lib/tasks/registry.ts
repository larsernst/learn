// Zentrale Task-Registry. Alle Handler und UIs konsultieren nur diese Datei.
//
// Ein neuer Task-Typ wird ausschließlich als Bundle unter
// src/lib/tasks/<type>/ angelegt und hier angemeldet – nirgendwo sonst
// gibt es typspezifische Switches.

import { clozeTask } from "./cloze";
import { dragdropTask } from "./dragdrop";
import { mcqTask } from "./mcq";
import { orderTask } from "./order";
import { recallTask } from "./recall";
import type {
  AnyTaskDefinition,
  SerializeOptions,
  TaskResult,
  TaskType,
} from "./types";

export const TASK_REGISTRY: Record<TaskType, AnyTaskDefinition> = {
  recall: recallTask,
  mcq: mcqTask,
  dragdrop: dragdropTask,
  cloze: clozeTask,
  order: orderTask,
};

export const ALL_TASK_TYPES: TaskType[] = Object.keys(TASK_REGISTRY) as TaskType[];

export function isTaskType(value: unknown): value is TaskType {
  return typeof value === "string" && value in TASK_REGISTRY;
}

export function getTask(type: TaskType): AnyTaskDefinition {
  return TASK_REGISTRY[type];
}

// Erzeugt den Public-Payload für eine Frage. Berücksichtigt mcqEnabled:
// MCQ-Fragen degenerieren dann zu recall (kompatibel zum alten Verhalten).
// Rückgabe ist der tatsächlich auszuliefernde TaskType (kann von `type`
// abweichen, wenn downgegraded wurde) plus der serialisierte Payload.
export function serializeTask(
  type: TaskType,
  payload: unknown,
  options: SerializeOptions = {}
): { type: TaskType; payload: unknown } {
  if (type === "mcq" && options.mcqEnabled === false) {
    return { type: "recall", payload: null };
  }
  const task = getTask(type);
  const out = task.serialize(payload, options);
  return out ?? { type: "recall", payload: null };
}

// Bewertet einen Attempt. `attempt` muss zum TaskType passen; unbekannte
// oder nicht valide Attempts gelten als falsch (defensiv).
export function gradeAttempt(
  type: TaskType,
  payload: unknown,
  attempt: unknown
): TaskResult {
  const task = getTask(type);
  const parsedPayload = task.payloadSchema.safeParse(payload);
  const parsedAttempt = task.attemptSchema.safeParse(attempt);
  if (!parsedPayload.success || !parsedAttempt.success) {
    return { correct: false };
  }
  return task.grade(parsedPayload.data, parsedAttempt.data);
}

// Legacy-Kompatibilität: leitet den TaskType aus dem rohen DB-Zustand ab,
// falls taskType noch nicht gesetzt ist (Übergangsphase bis Backfill).
// Gleichzeitig normalisiert es den Payload (mcqOptions-Array -> {options}).
export function normalizeQuestionTask(
  taskType: string | null,
  payload: unknown,
  mcqOptions: unknown
): { type: TaskType; payload: unknown } {
  if (taskType === "mcq" || (taskType === null && Array.isArray(mcqOptions))) {
    const options = Array.isArray(mcqOptions) ? mcqOptions : unwrapMcqPayload(payload);
    return { type: "mcq", payload: { options } };
  }
  if (taskType === "recall" || taskType === null) {
    return { type: "recall", payload: null };
  }
  if (isTaskType(taskType)) {
    return { type: taskType, payload };
  }
  return { type: "recall", payload: null };
}

function unwrapMcqPayload(payload: unknown): unknown[] {
  if (
    payload !== null &&
    typeof payload === "object" &&
    Array.isArray((payload as { options?: unknown }).options)
  ) {
    return (payload as { options: unknown[] }).options;
  }
  return [];
}

// Wandelt einen Payload in die DB-taugliche Form um (für Admin-Seed/Editor).
// MCQ-Optionen bleiben inline mit correct-Flag (autor-seitig).
export function toDbPayload(type: TaskType, payload: unknown): unknown {
  if (type === "recall") return null;
  return payload;
}
