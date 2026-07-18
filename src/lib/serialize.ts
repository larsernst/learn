import { normalizeQuestionTask, serializeTask } from "@/lib/tasks/registry";
import type { SerializeOptions } from "@/lib/tasks/types";
import type { QuestionPublic } from "./types";

export interface SerializableQuestion {
  id: string;
  courseId: string | null;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  taskType: string | null;
  payload: unknown;
  // Legacy: wird für Fragen verwendet, die noch kein taskType/payload haben
  // (vor oder während des Backfills in Phase 0).
  mcqOptions?: unknown;
}

export function serializeQuestion(
  q: SerializableQuestion,
  mcqEnabled: boolean = true
): QuestionPublic {
  const options: SerializeOptions = { mcqEnabled };
  const normalized = normalizeQuestionTask(q.taskType, q.payload, q.mcqOptions);
  const serialized = serializeTask(normalized.type, normalized.payload, options);

  return {
    id: q.id,
    courseId: q.courseId,
    chapter: q.chapter,
    chapterTitle: q.chapterTitle,
    question: q.question,
    answer: q.answer,
    sourceRef: q.sourceRef,
    taskType: serialized.type,
    taskPayload: serialized.payload as QuestionPublic["taskPayload"],
  };
}
