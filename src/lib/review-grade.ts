import { gradeAttempt, normalizeQuestionTask } from "@/lib/tasks/registry";
import type { TaskResult } from "@/lib/tasks/types";
import { mcqGrade, type ReviewGrade } from "./sm2";

export interface ParsedAttempt {
  taskType: "recall" | "mcq";
  // recall
  grade?: ReviewGrade;
  // mcq
  selectedOptionIds?: string[];
}

export interface ResolvedGrade {
  resolvedGrade: ReviewGrade;
  correct: boolean | null;
  correctOptionIds: string[] | null;
}

// Bewertet einen Lerner-Versuch gegen eine Frage (mit Legacy-Kompatibilität
// für Zeilen ohne taskType). Der Versuchstyp (attempt.taskType) bestimmt das
// Bewertungsverfahren; ist die Frage damit inkompatibel (z. B. MCQ-Versuch auf
// eine Recall-Frage ohne Optionen), gilt das defensiv als inkorrekt.
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

  // attempt.taskType === "mcq": Frage muss MCQ-kompatibel sein, sonst inkorrekt.
  if (normalized.type !== "mcq") {
    return {
      resolvedGrade: mcqGrade(false),
      correct: false,
      correctOptionIds: null,
    };
  }

  const result: TaskResult = gradeAttempt(
    normalized.type,
    normalized.payload,
    {
      selectedOptionIds: attempt.selectedOptionIds ?? [],
    }
  );

  const detail = result.detail as { correctOptionIds?: string[] } | undefined;

  return {
    resolvedGrade: mcqGrade(result.correct),
    correct: result.correct,
    correctOptionIds: detail?.correctOptionIds ?? null,
  };
}
