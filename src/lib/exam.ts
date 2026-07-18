import { gradeAttempt, normalizeQuestionTask } from "@/lib/tasks/registry";

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

export type ExamAttempt =
  | { questionId: string; taskType: "recall"; correct: boolean }
  | {
      questionId: string;
      taskType: "mcq";
      selectedOptionIds: string[];
    };

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

export function gradeExamAttempt(
  attempts: ExamAttempt[],
  questionsById: Map<string, ExamQuestionRef>
): ExamGradeResult {
  const perQuestion: ExamGradeRow[] = attempts.map((a) => {
    const q = questionsById.get(a.questionId);
    let correct = false;

    if (a.taskType === "recall") {
      correct = a.correct === true;
    } else if (a.taskType === "mcq" && q) {
      const normalized = normalizeQuestionTask(q.taskType, q.payload, q.mcqOptions);
      if (normalized.type === "mcq") {
        const result = gradeAttempt(normalized.type, normalized.payload, {
          selectedOptionIds: a.selectedOptionIds,
        });
        correct = result.correct;
      }
    }
    return { questionId: a.questionId, correct };
  });
  const score = perQuestion.filter((r) => r.correct).length;
  return { perQuestion, score, total: perQuestion.length };
}
