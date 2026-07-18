// mcq: Grading = Mengengleichheit der gewählten mit den korrekten IDs.
// Kein Partial Credit (kompatibel zum bisherigen isMcqCorrect).

import type { TaskResult } from "../types";
import type { McqAttempt } from "./attempt";
import type { McqPayload } from "./payload";

export function gradeMcq(payload: McqPayload, attempt: McqAttempt): TaskResult {
  const correctIds = payload.options.filter((o) => o.correct).map((o) => o.id);
  const selected = new Set(attempt.selectedOptionIds);
  const correct = new Set(correctIds);

  const isCorrect =
    selected.size === correct.size &&
    Array.from(selected).every((id) => correct.has(id));

  return {
    correct: isCorrect,
    detail: { correctOptionIds: correctIds },
  };
}
