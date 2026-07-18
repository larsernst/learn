import type { TaskType } from "@/lib/tasks/types";
import type { McqPublic } from "@/lib/tasks/mcq/payload";

// Public-Payload je Task-Typ (was der Client sieht, ohne Geheimnisse).
// null für recall (kein Payload), McqPublic für mcq.
export type TaskPublicPayload = null | McqPublic;

export interface QuestionPublic {
  id: string;
  courseId: string | null;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  taskType: TaskType;
  taskPayload: TaskPublicPayload;
}

export interface ReviewNextResponse {
  review: { question: QuestionPublic } | null;
  isNew: boolean;
}

export type SettingsPatch = {
  mcqEnabled?: boolean;
  simpleGrading?: boolean;
  newQuestionsFirst?: boolean;
};
