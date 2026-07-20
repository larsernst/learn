import { describe, expect, it } from "vitest";
import { serializeCode } from "@/lib/tasks/code/serialize";
import type { CodePayload } from "@/lib/tasks/code/payload";

const payload: CodePayload = {
  languages: [{ languageId: 71, label: "Python 3", starterCode: "print('hi')" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42", hidden: false },
    { id: "t2", input: "5", expectedOutput: "25", hidden: true },
  ],
  comparison: { mode: "exact" },
  timeLimitMs: 3000,
  memoryLimitKb: 262144,
};

describe("code.serialize", () => {
  it("strips hidden test cases entirely from public payload", () => {
    const out = serializeCode(payload, {});
    expect(out.type).toBe("code");
    expect(out.payload.publicTests).toHaveLength(1);
    expect(out.payload.publicTests[0]).toEqual({
      id: "t1",
      input: "",
      expectedOutput: "42",
    });
  });

  it("reports hiddenTestCount for transparency", () => {
    const out = serializeCode(payload, {});
    expect(out.payload.hiddenTestCount).toBe(1);
  });

  it("preserves languages and limits", () => {
    const out = serializeCode(payload, {});
    expect(out.payload.languages).toEqual(payload.languages);
    expect(out.payload.timeLimitMs).toBe(3000);
    expect(out.payload.memoryLimitKb).toBe(262144);
  });

  it("never leaks hidden test expected output in JSON", () => {
    const json = JSON.stringify(serializeCode(payload, {}));
    // hiddenTestCount ist das einzige Vorkommen des Wortes "hidden";
    // die expectedOutput der hidden Tests ("25") darf nicht auftauchen.
    expect(json).not.toContain("\"25\"");
    expect(json).toContain("hiddenTestCount");
  });

  it("handles payload with only public tests", () => {
    const allPublic: CodePayload = {
      ...payload,
      testCases: [{ id: "t1", input: "", expectedOutput: "42", hidden: false }],
    };
    const out = serializeCode(allPublic, {});
    expect(out.payload.hiddenTestCount).toBe(0);
    expect(out.payload.publicTests).toHaveLength(1);
  });
});

import {
  codePayloadSchema,
  normalizeExpectedOutput,
  CODE_SOURCE_MAX,
  CODE_IO_MAX,
  CODE_TESTCASES_MAX,
} from "@/lib/tasks/code/payload";
import { codeAttemptSchema } from "@/lib/tasks/code/attempt";
import { isAllowedLanguageId, JUDGE0_LANGUAGES } from "@/lib/judge0/languages";

describe("code.payload limits", () => {
  const valid = {
    languages: [{ languageId: 54, label: "C++", starterCode: "int main(){}" }],
    testCases: [{ id: "t1", input: "", expectedOutput: "42", hidden: false }],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
  };

  it("accepts a valid payload", () => {
    expect(codePayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects oversized starter code", () => {
    const p = {
      ...valid,
      languages: [{ languageId: 54, label: "C++", starterCode: "x".repeat(CODE_SOURCE_MAX + 1) }],
    };
    expect(codePayloadSchema.safeParse(p).success).toBe(false);
  });

  it("rejects oversized test input/output", () => {
    const big = "x".repeat(CODE_IO_MAX + 1);
    expect(
      codePayloadSchema.safeParse({
        ...valid,
        testCases: [{ id: "t1", input: big, expectedOutput: "42", hidden: false }],
      }).success
    ).toBe(false);
    expect(
      codePayloadSchema.safeParse({
        ...valid,
        testCases: [{ id: "t1", input: "", expectedOutput: big, hidden: false }],
      }).success
    ).toBe(false);
  });

  it("rejects more than the maximum number of test cases", () => {
    const tcs = Array.from({ length: CODE_TESTCASES_MAX + 1 }, (_, i) => ({
      id: `t${i}`,
      input: "",
      expectedOutput: "42",
      hidden: false,
    }));
    expect(codePayloadSchema.safeParse({ ...valid, testCases: tcs }).success).toBe(false);
  });

  it("rejects empty test case list and too many languages", () => {
    expect(codePayloadSchema.safeParse({ ...valid, testCases: [] }).success).toBe(false);
    const langs = [1, 2, 3, 4].map((id) => ({ languageId: id, label: "L", starterCode: "" }));
    expect(codePayloadSchema.safeParse({ ...valid, languages: langs }).success).toBe(false);
  });
});

describe("code.payload expectedOutput-Normalisierung", () => {
  it("appends exactly one trailing newline", () => {
    expect(normalizeExpectedOutput("42")).toBe("42\n");
    expect(normalizeExpectedOutput("42\n")).toBe("42\n");
    expect(normalizeExpectedOutput("42\n\n\n")).toBe("42\n");
    expect(normalizeExpectedOutput("")).toBe("");
  });

  it("schema parse normalizes expectedOutput", () => {
    const parsed = codePayloadSchema.parse({
      languages: [{ languageId: 54, label: "C++", starterCode: "" }],
      testCases: [
        { id: "t1", input: "", expectedOutput: "Ergebnis: 5/4\nAls Kommazahl: 1.25", hidden: false },
      ],
      timeLimitMs: 2000,
      memoryLimitKb: 262144,
    });
    expect(parsed.testCases[0].expectedOutput).toBe("Ergebnis: 5/4\nAls Kommazahl: 1.25\n");
  });
});

describe("code.attempt limits", () => {
  it("rejects oversized source code", () => {
    expect(
      codeAttemptSchema.safeParse({ languageId: 54, sourceCode: "x".repeat(CODE_SOURCE_MAX + 1) })
        .success
    ).toBe(false);
  });

  it("accepts normal submissions", () => {
    expect(codeAttemptSchema.safeParse({ languageId: 54, sourceCode: "int main(){}" }).success).toBe(
      true
    );
  });
});

describe("judge0 languages allowlist", () => {
  it("allows the canonical editor languages (inkl. C++ 54)", () => {
    for (const l of JUDGE0_LANGUAGES) {
      expect(isAllowedLanguageId(l.languageId)).toBe(true);
    }
    expect(isAllowedLanguageId(54)).toBe(true);
  });

  it("rejects unknown language ids", () => {
    expect(isAllowedLanguageId(9999)).toBe(false);
    expect(isAllowedLanguageId(0)).toBe(false);
  });
});

describe("code.serialize: Musterlösung bleibt geheim", () => {
  it("referenceSolution taucht niemals im serialisierten JSON auf", () => {
    const withSolution: CodePayload = {
      ...payload,
      referenceSolution: "int main() { /* geheime Lösung */ }",
    };
    const json = JSON.stringify(serializeCode(withSolution, {}));
    expect(json).not.toContain("geheime Lösung");
    expect(json).not.toContain("referenceSolution");
  });

  it("schema roundtrip erhält referenceSolution (Editor/DB)", () => {
    const parsed = codePayloadSchema.parse({
      languages: [{ languageId: 54, label: "C++", starterCode: "" }],
      testCases: [{ id: "t1", input: "", expectedOutput: "42", hidden: false }],
      referenceSolution: "int main(){}",
      timeLimitMs: 2000,
      memoryLimitKb: 262144,
    });
    expect(parsed.referenceSolution).toBe("int main(){}");
    expect(parsed.comparison.mode).toBe("exact"); // Default für Alt-Payloads
  });
});
