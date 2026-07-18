import { describe, expect, it } from "vitest";
import { mcqTask } from "@/lib/tasks/mcq";
import { serializeMcq } from "@/lib/tasks/mcq/serialize";
import type { McqPayload } from "@/lib/tasks/mcq/payload";

function opts(correct: boolean[]): McqPayload {
  return {
    options: correct.map((c, i) => ({
      id: String.fromCharCode(97 + i),
      text: `Option ${i + 1}`,
      correct: c,
    })),
  };
}

describe("mcq.grade", () => {
  it("accepts an exact single-select match", () => {
    const r = mcqTask.grade(opts([true, false, false]), { selectedOptionIds: ["a"] });
    expect(r.correct).toBe(true);
  });

  it("accepts an exact multi-select match (order-independent)", () => {
    const r = mcqTask.grade(opts([true, false, true]), { selectedOptionIds: ["c", "a"] });
    expect(r.correct).toBe(true);
  });

  it("rejects a partial multi-select", () => {
    const r = mcqTask.grade(opts([true, false, true]), { selectedOptionIds: ["a"] });
    expect(r.correct).toBe(false);
  });

  it("rejects an extra wrong selection", () => {
    const r = mcqTask.grade(opts([true, false, false]), { selectedOptionIds: ["a", "b"] });
    expect(r.correct).toBe(false);
  });

  it("rejects empty selection when at least one correct exists", () => {
    const r = mcqTask.grade(opts([true, false]), { selectedOptionIds: [] });
    expect(r.correct).toBe(false);
  });

  it("exposes correctOptionIds in detail for feedback", () => {
    const r = mcqTask.grade(opts([true, false, true]), { selectedOptionIds: ["a", "c"] });
    expect(r.detail).toEqual({ correctOptionIds: ["a", "c"] });
  });
});

describe("mcq.serialize", () => {
  it("strips the correct flag from every option", () => {
    const out = serializeMcq(opts([true, false, true]), {});
    expect(out).not.toBeNull();
    for (const o of out!.payload.options) {
      expect(o).not.toHaveProperty("correct");
      expect(Object.keys(o).sort()).toEqual(["id", "text"]);
    }
  });

  it("shuffles option order as a permutation of the input", () => {
    const payload = opts([true, false, false, true]);
    const out = serializeMcq(payload, {})!;
    expect(out.payload.options.map((o) => o.id).sort()).toEqual(
      payload.options.map((o) => o.id).sort()
    );
    expect(out.payload.options).toHaveLength(payload.options.length);
  });

  it("derives single mode when exactly one option is correct", () => {
    expect(serializeMcq(opts([true, false]), {})!.payload.selectionMode).toBe("single");
  });

  it("derives multi mode when several options are correct", () => {
    expect(serializeMcq(opts([true, true]), {})!.payload.selectionMode).toBe("multi");
  });

  it("returns null when mcqEnabled is false (downgrade to recall)", () => {
    expect(serializeMcq(opts([true]), { mcqEnabled: false })).toBeNull();
  });

  it("never leaks 'correct' in the serialized output", () => {
    const json = JSON.stringify(serializeMcq(opts([true, false, true]), {}));
    expect(json).not.toContain("correct");
  });
});

describe("mcq.emptyAttempt", () => {
  it("returns an empty selection that validates", () => {
    const a = mcqTask.emptyAttempt();
    expect(mcqTask.attemptSchema.safeParse(a).success).toBe(true);
    expect(a.selectedOptionIds).toEqual([]);
  });
});
