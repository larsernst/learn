import { describe, expect, it } from "vitest";
import { serializeCode } from "@/lib/tasks/code/serialize";
import type { CodePayload } from "@/lib/tasks/code/payload";

const payload: CodePayload = {
  languages: [{ languageId: 71, label: "Python 3", starterCode: "print('hi')" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42", hidden: false },
    { id: "t2", input: "5", expectedOutput: "25", hidden: true },
  ],
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
