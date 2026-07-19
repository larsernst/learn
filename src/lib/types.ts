import type { TaskType } from "@/lib/tasks/types";
import type { McqPublic } from "@/lib/tasks/mcq/payload";
import type { DragDropPublic } from "@/lib/tasks/dragdrop/payload";
import type { ClozePublic } from "@/lib/tasks/cloze/payload";
import type { OrderPublic } from "@/lib/tasks/order/payload";
import type { CodePublic } from "@/lib/tasks/code/payload";

// Public-Payload je Task-Typ (was der Client sieht, ohne Geheimnisse).
// null für recall (kein Payload), McqPublic für mcq usw.
export type TaskPublicPayload =
  | null
  | McqPublic
  | DragDropPublic
  | ClozePublic
  | OrderPublic
  | CodePublic;

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
