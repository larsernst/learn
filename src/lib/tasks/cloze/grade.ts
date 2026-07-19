// cloze: Grading = jede Lücke muss eine akzeptierte Antwort enthalten,
// normalisiert je nach `normalize`-Strategie der Lücke.

import type { TaskResult } from "../types";
import type { ClozeAttempt } from "./attempt";
import type { ClozeNormalize, ClozePayload } from "./payload";

function normalizeAnswer(input: string, mode: ClozeNormalize, accepted: string[]): boolean {
  if (mode === "regex") {
    return accepted.some((pattern) => {
      try {
        return new RegExp(pattern).test(input);
      } catch {
        return false;
      }
    });
  }
  const transform = (s: string): string => {
    let t = s;
    if (mode === "ignore-case") t = t.toLowerCase();
    if (mode === "trim" || mode === "ignore-case") {
      t = t.trim().replace(/\s+/g, " ");
    }
    return t;
  };
  const normInput = transform(input);
  return accepted.some((a) => transform(a) === normInput);
}

export function gradeCloze(payload: ClozePayload, attempt: ClozeAttempt): TaskResult {
  const blanks = payload.segments.filter((s) => s.kind === "blank");
  if (blanks.length === 0) return { correct: false };

  const perBlank = blanks.map((b) => {
    if (b.kind !== "blank") return false;
    const userAnswer = attempt.answers[b.blankId] ?? "";
    return normalizeAnswer(userAnswer, b.normalize, b.accepted);
  });
  const correct = perBlank.every(Boolean);
  return { correct, detail: { perBlank } };
}
