import { gradeAttempt, normalizeQuestionTask } from "@/lib/tasks/registry";
import type { TaskType } from "@/lib/tasks/types";

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectExamQuestions<T>(all: readonly T[], count: number): T[] {
  const shuffled = shuffle(all);
  if (!Number.isFinite(count) || count <= 0 || count >= all.length) return shuffled;
  return shuffled.slice(0, Math.floor(count));
}

// Exam-Versuch: recall wird selbst bewertet (correct), alle anderen Typen
// serverseitig über den Task-Grader. Code wird im Exam selbst bewertet
// (correct: boolean, da async Judge0 im Batch nicht skalierbar).
export type ExamAttempt =
  | { questionId: string; taskType: "recall"; correct: boolean }
  | { questionId: string; taskType: "mcq"; selectedOptionIds: string[] }
  | { questionId: string; taskType: "dragdrop"; assignment: Record<string, string> }
  | { questionId: string; taskType: "cloze"; answers: Record<string, string> }
  | { questionId: string; taskType: "order"; orderedIds: string[] }
  | { questionId: string; taskType: "code"; correct: boolean };

export interface ExamGradeRow {
  questionId: string;
  correct: boolean;
}

export interface ExamGradeResult {
  perQuestion: ExamGradeRow[];
  score: number;
  total: number;
}

interface ExamQuestionRef {
  taskType: string | null;
  payload: unknown;
  mcqOptions?: unknown;
}

const AUTO_GRADED_TYPES: TaskType[] = ["mcq", "dragdrop", "cloze", "order"];

export function gradeExamAttempt(
  attempts: ExamAttempt[],
  questionsById: Map<string, ExamQuestionRef>
): ExamGradeResult {
  const perQuestion: ExamGradeRow[] = attempts.map((a) => {
    const q = questionsById.get(a.questionId);
    let correct = false;

    if (a.taskType === "recall") {
      correct = a.correct === true;
    } else if (a.taskType === "code") {
      // Code: trust the pre-computed correct flag (async grading would the
      // exam flow block; clients send correct=false or pre-evaluated result).
      correct = a.correct === true;
    } else if (AUTO_GRADED_TYPES.includes(a.taskType) && q) {
      const normalized = normalizeQuestionTask(q.taskType, q.payload, q.mcqOptions);
      if (normalized.type === a.taskType) {
        const result = gradeAttempt(normalized.type, normalized.payload, a);
        correct = result.correct;
      }
    }
    return { questionId: a.questionId, correct };
  });
  const score = perQuestion.filter((r) => r.correct).length;
  return { perQuestion, score, total: perQuestion.length };
}
