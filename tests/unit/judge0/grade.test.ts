import { describe, expect, it } from "vitest";
import { gradeCodeWithJudge0, mapWithConcurrency } from "@/lib/judge0/grade";
import type { Judge0Client, Judge0Result, Judge0Submission } from "@/lib/judge0/client";
import type { CodePayload } from "@/lib/tasks/code/payload";

function mockClient(results: Judge0Result[]): Judge0Client {
  let i = 0;
  return {
    submit: async () => {
      const r = results[i] ?? results[results.length - 1];
      i++;
      return r;
    },
  };
}

function recordingClient(
  handler: (s: Judge0Submission, i: number) => Judge0Result,
  submissions?: Judge0Submission[]
): Judge0Client {
  let i = 0;
  return {
    submit: async (s) => {
      submissions?.push(s);
      return handler(s, i++);
    },
  };
}

// stdout muss zur expectedOutput der Testfälle passen (wir vergleichen
// selbst, Judge0 liefert nur den Status).
const ok42: Judge0Result = { status: { id: 3, description: "Accepted" }, stdout: "42" };
const ok25: Judge0Result = { status: { id: 3, description: "Accepted" }, stdout: "25" };

const wrongStdout: Judge0Result = {
  status: { id: 3, description: "Accepted" },
  stdout: "falsch",
};

const compileError: Judge0Result = {
  status: { id: 6, description: "Compilation Error" },
  compile_output: "SyntaxError",
};

const systemError: Judge0Result = {
  status: { id: 13, description: "Internal Error" },
};

const payload: CodePayload = {
  languages: [{ languageId: 71, label: "Python 3", starterCode: "pass" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42", hidden: false },
    { id: "t2", input: "5", expectedOutput: "25", hidden: true },
  ],
  comparison: { mode: "exact" },
  timeLimitMs: 3000,
  memoryLimitKb: 262144,
};

describe("gradeCodeWithJudge0", () => {
  it("marks all tests passed when stdout matches everywhere", async () => {
    const r = await gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([ok42, ok25])
    );
    expect(r.correct).toBe(true);
    expect(r.detail.perTest).toHaveLength(2);
    expect(r.detail.perTest.every((t) => t.passed)).toBe(true);
  });

  it("marks incorrect when stdout differs (Wrong Answer + Mismatch)", async () => {
    const r = await gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([ok42, wrongStdout])
    );
    expect(r.correct).toBe(false);
    expect(r.detail.perTest[0].passed).toBe(true);
    expect(r.detail.perTest[1].passed).toBe(false);
    expect(r.detail.perTest[1].status).toBe("Wrong Answer");
  });

  it("surfaces compile errors on public tests", async () => {
    const r = await gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([compileError, ok25])
    );
    expect(r.correct).toBe(false);
    expect(r.detail.perTest[0].compileOutput).toBe("SyntaxError");
  });

  it("reports system errors (status 13) as overall failure", async () => {
    const r = await gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([ok42, systemError])
    );
    expect(r.correct).toBe(false);
    expect(r.detail.compileError).toContain("Judge0");
  });

  it("does not expose stdout/stderr/mismatch for hidden tests", async () => {
    const r = await gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([ok42, wrongStdout])
    );
    // t1 is public → stdout + mismatch exposed; t2 is hidden → nichts davon.
    expect(r.detail.perTest[0]).toHaveProperty("stdout");
    expect(r.detail.perTest[1]).not.toHaveProperty("stdout");
    expect(r.detail.perTest[1]).not.toHaveProperty("stderr");
    expect(r.detail.perTest[1]).not.toHaveProperty("mismatch");
  });

  it("sends submissions WITHOUT expected_output and WITH args/stdin/limits", async () => {
    const submissions: Judge0Submission[] = [];
    const p: CodePayload = {
      ...payload,
      testCases: [
        { id: "t1", input: "in1", args: "a b c", expectedOutput: "42", hidden: false },
        { id: "t2", input: "", expectedOutput: "25", hidden: true },
      ],
    };
    await gradeCodeWithJudge0(
      p,
      { languageId: 54, sourceCode: "int main(){}" },
      recordingClient((s) => ({ status: { id: 3, description: "Accepted" }, stdout: "42" }), submissions)
    );
    expect(submissions).toHaveLength(2);
    expect(submissions[0]).toMatchObject({
      language_id: 54,
      source_code: "int main(){}",
      stdin: "in1",
      command_line_arguments: "a b c",
      cpu_time_limit: 3,
      memory_limit: 262144,
    });
    expect(submissions[0]).not.toHaveProperty("expected_output");
    expect(submissions[1]).not.toHaveProperty("command_line_arguments");
  });

  it("applies trim mode (trailing whitespace tolerant)", async () => {
    const p: CodePayload = {
      ...payload,
      comparison: { mode: "trim" },
      testCases: [{ id: "t1", input: "", expectedOutput: "42\n", hidden: false }],
    };
    const r = await gradeCodeWithJudge0(
      p,
      { languageId: 71, sourceCode: "x" },
      mockClient([{ status: { id: 3, description: "Accepted" }, stdout: "42   \n\n" }])
    );
    expect(r.correct).toBe(true);
  });

  it("applies float mode with tolerance and reports mismatch details", async () => {
    const p: CodePayload = {
      ...payload,
      comparison: { mode: "float", floatTolerance: 1e-3 },
      testCases: [
        { id: "t1", input: "", expectedOutput: "Mittelwert 15.3333\n", hidden: false },
      ],
    };
    const close = await gradeCodeWithJudge0(
      p,
      { languageId: 71, sourceCode: "x" },
      mockClient([{ status: { id: 3, description: "Accepted" }, stdout: "Mittelwert 15.33333\n" }])
    );
    expect(close.correct).toBe(true);

    const far = await gradeCodeWithJudge0(
      p,
      { languageId: 71, sourceCode: "x" },
      mockClient([{ status: { id: 3, description: "Accepted" }, stdout: "Mittelwert 16.5\n" }])
    );
    expect(far.correct).toBe(false);
    expect(far.detail.perTest[0].mismatch).toMatchObject({ line: 1, reason: "content" });
  });
});

describe("mapWithConcurrency", () => {
  it("hält das Concurrency-Limit ein und bleibt reihenfolgetreu", async () => {
    let running = 0;
    let maxRunning = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    const results = await mapWithConcurrency(items, 3, async (n) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return n * 2;
    });
    expect(results).toEqual(items.map((n) => n * 2));
    expect(maxRunning).toBeLessThanOrEqual(3);
    expect(maxRunning).toBeGreaterThan(1);
  });
});
