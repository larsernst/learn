import { isMcqCorrect } from "@/lib/sm2";
import type { McqOption } from "@/lib/types";

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

export interface ExamAttempt {
  questionId: string;
  mode: "recall" | "mcq";
  correct?: boolean;
  selectedOptionIds?: string[];
}

export interface ExamGradeRow {
  questionId: string;
  correct: boolean;
}

export interface ExamGradeResult {
  perQuestion: ExamGradeRow[];
  score: number;
  total: number;
}

export function gradeExamAttempt(
  attempts: ExamAttempt[],
  questionsById: Map<string, { mcqOptions: McqOption[] | null }>
): ExamGradeResult {
  const perQuestion: ExamGradeRow[] = attempts.map((a) => {
    let correct = false;
    if (a.mode === "mcq" && a.selectedOptionIds) {
      const q = questionsById.get(a.questionId);
      const correctIds = (q?.mcqOptions ?? []).filter((o) => o.correct).map((o) => o.id);
      correct = isMcqCorrect(a.selectedOptionIds, correctIds);
    } else {
      correct = a.correct === true;
    }
    return { questionId: a.questionId, correct };
  });
  const score = perQuestion.filter((r) => r.correct).length;
  return { perQuestion, score, total: perQuestion.length };
}