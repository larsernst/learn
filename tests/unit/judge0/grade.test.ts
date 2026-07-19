import { describe, expect, it } from "vitest";
import { gradeCodeWithJudge0 } from "@/lib/judge0/grade";
import type { Judge0Client, Judge0Result } from "@/lib/judge0/client";
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

const accepted: Judge0Result = {
  status: { id: 3, description: "Accepted" },
  stdout: "",
};

const wrongAnswer: Judge0Result = {
  status: { id: 4, description: "Wrong Answer" },
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
  timeLimitMs: 3000,
  memoryLimitKb: 262144,
};

describe("gradeCodeWithJudge0", () => {
  it("marks all tests passed when Judge0 accepts everything", () => {
    return gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([accepted, accepted])
    ).then((r) => {
      expect(r.correct).toBe(true);
      expect(r.detail.perTest).toHaveLength(2);
      expect(r.detail.perTest.every((t) => t.passed)).toBe(true);
    });
  });

  it("marks incorrect when one test fails", () => {
    return gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([accepted, wrongAnswer])
    ).then((r) => {
      expect(r.correct).toBe(false);
      expect(r.detail.perTest[0].passed).toBe(true);
      expect(r.detail.perTest[1].passed).toBe(false);
    });
  });

  it("stops early and surfaces compile errors", () => {
    return gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([compileError, accepted])
    ).then((r) => {
      expect(r.correct).toBe(false);
      // Compile error is public-test stdout, so it's exposed.
      expect(r.detail.perTest[0].compileOutput).toBe("SyntaxError");
    });
  });

  it("halts immediately on internal error (status 13)", () => {
    return gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([accepted, systemError])
    ).then((r) => {
      expect(r.correct).toBe(false);
      expect(r.detail.compileError).toContain("Judge0");
    });
  });

  it("does not expose stdout/stderr for hidden tests", () => {
    return gradeCodeWithJudge0(
      payload,
      { languageId: 71, sourceCode: "x" },
      mockClient([accepted, wrongAnswer])
    ).then((r) => {
      // t1 is public → stdout exposed; t2 is hidden → no stdout
      expect(r.detail.perTest[0]).toHaveProperty("stdout");
      expect(r.detail.perTest[1]).not.toHaveProperty("stdout");
      expect(r.detail.perTest[1]).not.toHaveProperty("stderr");
    });
  });
});
