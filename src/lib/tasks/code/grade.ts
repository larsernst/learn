// code: Synchroner Fallback-Grader. Code-Aufgaben werden NIEMALS synchron
// bewertet (Judge0 ist async). Der echte Grader läuft in
// src/lib/judge0/grade.ts und wird über den dedizierten Code-Submit-Endpoint
// angestoßen. Dieser sync-Grader liefert defensiv "incorrect", falls code
// versehentlich über den generischen Pfad gesendet wird.

import type { TaskResult } from "../types";
import type { CodeAttempt } from "./attempt";
import type { CodePayload } from "./payload";

export function gradeCode(_payload: CodePayload, _attempt: CodeAttempt): TaskResult {
  return {
    correct: false,
    detail: { reason: "Code-Aufgaben müssen über /api/review/code-submit bewertet werden" },
  };
}
