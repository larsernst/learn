// Code-Grading: führt für jeden Testfall eine Judge0-Submission aus
// (parallel, mit Concurrency-Limit) und vergleicht stdout selbst
// (src/lib/judge0/compare.ts) – Submissions gehen daher OHNE
// expected_output raus. Output für versteckte Tests wird aus dem
// Feedback entfernt.

import type { Judge0Client, Judge0Result } from "./client";
import { isSystemError } from "./client";
import { compareOutput, type OutputMismatch } from "./compare";
import type { CodePayload, CodeTestCase } from "@/lib/tasks/code/payload";
import type { CodeAttempt } from "@/lib/tasks/code/attempt";

// Parallele Submissions pro Grading-Lauf. Jede C++-Submission kompiliert
// neu (~1 s); 4 hält Latenz und Judge0-Last in Balance (Worker-Count).
const GRADE_CONCURRENCY = 4;

export interface CodeGradeDetail {
  perTest: Array<{
    id: string;
    hidden: boolean;
    passed: boolean;
    status: string;
    // stdout/stderr nur für public Tests, nicht für hidden.
    stdout?: string | null;
    stderr?: string | null;
    compileOutput?: string | null;
    // Erste Abweichung erwartet/ist (nur public Tests, nur bei Mismatch).
    mismatch?: OutputMismatch;
    time?: string | null;
    memory?: number | null;
  }>;
  compileError?: string;
}

export interface CodeGradeResult {
  correct: boolean;
  detail: CodeGradeDetail;
}

export async function gradeCodeWithJudge0(
  payload: CodePayload,
  attempt: CodeAttempt,
  client: Judge0Client
): Promise<CodeGradeResult> {
  const results = await mapWithConcurrency(payload.testCases, GRADE_CONCURRENCY, (tc) =>
    runOneTest(client, attempt, payload, tc)
  );

  // System-Fehler (Judge0 intern) dominieren: der Lerner kann nichts dafür
  // und das Ergebnis wäre irreführend.
  const systemFailure = results.find(isSystemError);
  if (systemFailure) {
    const perTest = payload.testCases.map((tc, i) =>
      toDetailEntry(payload, tc, results[i])
    );
    return {
      correct: false,
      detail: {
        perTest,
        compileError: `Judge0 interner Fehler: ${systemFailure.status.description}`,
      },
    };
  }

  const perTest = payload.testCases.map((tc, i) => toDetailEntry(payload, tc, results[i]));
  const allPassed = perTest.every((p) => p.passed);
  return { correct: allPassed, detail: { perTest } };
}

async function runOneTest(
  client: Judge0Client,
  attempt: CodeAttempt,
  payload: CodePayload,
  tc: CodeTestCase
): Promise<Judge0Result> {
  return client.submit({
    language_id: attempt.languageId,
    source_code: attempt.sourceCode,
    stdin: tc.input,
    ...(tc.args ? { command_line_arguments: tc.args } : {}),
    cpu_time_limit: payload.timeLimitMs / 1000,
    memory_limit: payload.memoryLimitKb,
  });
}

function toDetailEntry(
  payload: CodePayload,
  tc: CodeTestCase,
  result: Judge0Result
): CodeGradeDetail["perTest"][number] {
  // Ohne expected_output meldet Judge0 bei erfolgreichem Lauf "Accepted";
  // den fachlichen Vergleich übernimmt unser Comparator.
  const comparison =
    result.status.id === 3
      ? compareOutput(tc.expectedOutput, result.stdout ?? "", payload.comparison)
      : null;
  const passed = comparison?.passed ?? false;

  const entry: CodeGradeDetail["perTest"][number] = {
    id: tc.id,
    hidden: tc.hidden,
    passed,
    status:
      comparison && !comparison.passed ? "Wrong Answer" : result.status.description,
  };
  // Für public Tests (oder Compiler-Fehler, die überall gleich sind) das
  // stdout/stderr/compile_output mitliefern, damit der Lerner debuggen kann.
  // Versteckte Tests liefern nur Pass/Fail.
  if (!tc.hidden) {
    entry.stdout = result.stdout ?? null;
    entry.stderr = result.stderr ?? null;
    entry.compileOutput = result.compile_output ?? null;
    entry.time = result.time ?? null;
    entry.memory = result.memory ?? null;
    if (comparison && !comparison.passed && comparison.mismatch) {
      entry.mismatch = comparison.mismatch;
    }
  }
  return entry;
}

// Einfacher Concurrency-Pool: reihenfolgetreu (Ergebnis-Index = Test-Index),
// maximal `limit` gleichzeitige Submissions.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
