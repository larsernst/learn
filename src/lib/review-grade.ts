import { gradeAttempt, normalizeQuestionTask } from "@/lib/tasks/registry";
import type { TaskResult } from "@/lib/tasks/types";
import type { TaskType } from "@/lib/tasks/types";
import { mcqGrade, type ReviewGrade } from "./sm2";

export interface ParsedAttempt {
  taskType: TaskType;
  // recall
  grade?: ReviewGrade;
  // mcq
  selectedOptionIds?: string[];
  // dragdrop
  assignment?: Record<string, string>;
  // cloze
  answers?: Record<string, string>;
  // order
  orderedIds?: string[];
  // code (Sync-Fallback: korrekt-Flag von /api/review/code-submit)
  correct?: boolean;
  [key: string]: unknown;
}

export interface ResolvedGrade {
  resolvedGrade: ReviewGrade;
  correct: boolean | null;
  correctOptionIds: string[] | null;
}

// Bewertet einen Lerner-Versuch gegen eine Frage. Recall wird selbstbewertet
// (grade), alle anderen Typen über den Task-Grader. Bei Typ-Mismatch
// (Lerner sendet MCQ-Versuch auf eine Recall-Frage) gilt das defensiv als
// inkorrekt.
export function resolveReviewGrade(
  question: {
    taskType: string | null;
    payload: unknown;
    mcqOptions?: unknown;
  },
  attempt: ParsedAttempt
): ResolvedGrade {
  const normalized = normalizeQuestionTask(
    question.taskType,
    question.payload,
    question.mcqOptions
  );

  if (attempt.taskType === "recall") {
    return {
      resolvedGrade: attempt.grade ?? "again",
      correct: null,
      correctOptionIds: null,
    };
  }

  // Auto-bewerteter Typ: Frage muss zum Versuchstyp passen, sonst inkorrekt.
  if (normalized.type !== attempt.taskType) {
    return {
      resolvedGrade: mcqGrade(false),
      correct: false,
      correctOptionIds: null,
    };
  }

  const result: TaskResult = gradeAttempt(normalized.type, normalized.payload, attempt);

  const detail = result.detail as { correctOptionIds?: string[] } | undefined;

  return {
    resolvedGrade: mcqGrade(result.correct),
    correct: result.correct,
    correctOptionIds: detail?.correctOptionIds ?? null,
  };
}
