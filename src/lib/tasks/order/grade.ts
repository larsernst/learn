// order: Grading = exakte Reihenfolge-Übereinstimmung.

import type { TaskResult } from "../types";
import type { OrderAttempt } from "./attempt";
import type { OrderPayload } from "./payload";

export function gradeOrder(payload: OrderPayload, attempt: OrderAttempt): TaskResult {
  if (attempt.orderedIds.length !== payload.correctOrder.length) {
    return { correct: false };
  }
  const correct = payload.correctOrder.every(
    (id, i) => attempt.orderedIds[i] === id
  );
  return { correct };
}
