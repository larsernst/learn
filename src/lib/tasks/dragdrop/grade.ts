// dragdrop: Grading = alle Items müssen in der korrekten Zone landen.

import type { TaskResult } from "../types";
import type { DragDropAttempt } from "./attempt";
import type { DragDropPayload } from "./payload";

export function gradeDragDrop(
  payload: DragDropPayload,
  attempt: DragDropAttempt
): TaskResult {
  const allCorrect = payload.items.every((item) => {
    const expected = payload.correct[item.id];
    if (expected === undefined) return false;
    return attempt.assignment[item.id] === expected;
  });
  return { correct: allCorrect };
}
