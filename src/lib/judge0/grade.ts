// Code-Grading: führt für jeden Testfall eine Judge0-Submission aus und
// entscheidet Overall-korrekt nur, wenn alle (public + hidden) akzeptiert
// wurden. Output für versteckte Tests wird aus dem Feedback entfernt.

import type { Judge0Client, Judge0Result } from "./client";
import { isAccepted, isSystemError } from "./client";
import type { CodePayload, CodeTestCase } from "@/lib/tasks/code/payload";
import type { CodeAttempt } from "@/lib/tasks/code/attempt";

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
  const perTest: CodeGradeDetail["perTest"] = [];

  for (const tc of payload.testCases) {
    const result = await runOneTest(client, attempt, payload, tc);
    perTest.push(toDetailEntry(tc, result));
    // Bei einem System-Fehler (Judge0 intern) sofort abbrechen – der Lerner
    // kann nichts dafür und das Ergebnis wäre irreführend.
    if (isSystemError(result)) {
      return {
        correct: false,
        detail: {
          perTest,
          compileError: `Judge0 interner Fehler: ${result.status.description}`,
        },
      };
    }
  }

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
    expected_output: tc.expectedOutput,
    cpu_time_limit: payload.timeLimitMs / 1000,
    memory_limit: payload.memoryLimitKb,
  });
}

function toDetailEntry(
  tc: CodeTestCase,
  result: Judge0Result
): CodeGradeDetail["perTest"][number] {
  const passed = isAccepted(result);
  const entry: CodeGradeDetail["perTest"][number] = {
    id: tc.id,
    hidden: tc.hidden,
    passed,
    status: result.status.description,
  };
  // Für public Tests (oder Compiler-Fehler, die überall gleich sind) das
  // stdout/stderr/compile_output mitliefern, damit der Lerner debuggen kann.
  // Versteckte Tests liefern nur Pass/Fail.
  if (!tc.hidden) {
    entry.stdout = result.stdout ?? null;
    entry.stderr = result.stderr ?? null;
    entry.compileOutput = result.compile_output ?? null;
  }
  return entry;
}
