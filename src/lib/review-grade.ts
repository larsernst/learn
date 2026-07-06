import { isMcqCorrect, mcqGrade, type ReviewGrade } from "./sm2";
import type { McqOption } from "./types";

export interface ResolvedGrade {
  resolvedGrade: ReviewGrade;
  mcqCorrect: boolean | null;
  correctOptionIds: string[] | null;
}

export function resolveReviewGrade(
  question: { mcqOptions: unknown },
  body: { grade?: ReviewGrade; selectedOptionIds?: string[] }
): ResolvedGrade {
  if (body.selectedOptionIds) {
    const options = Array.isArray(question.mcqOptions)
      ? (question.mcqOptions as unknown as McqOption[])
      : [];
    const correctOptionIds = options.filter((o) => o.correct).map((o) => o.id);
    const mcqCorrect = isMcqCorrect(body.selectedOptionIds, correctOptionIds);
    return {
      resolvedGrade: mcqGrade(mcqCorrect),
      mcqCorrect,
      correctOptionIds,
    };
  }

  return {
    resolvedGrade: body.grade!,
    mcqCorrect: null,
    correctOptionIds: null,
  };
}
