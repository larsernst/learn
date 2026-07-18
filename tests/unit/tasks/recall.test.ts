import { describe, expect, it } from "vitest";
import { recallTask } from "@/lib/tasks/recall";
import { serializeRecall } from "@/lib/tasks/recall/serialize";

describe("recall.grade", () => {
  it("marks non-again grades as correct", () => {
    for (const grade of ["hard", "good", "easy"] as const) {
      expect(recallTask.grade(null, { grade }).correct).toBe(true);
    }
  });

  it("marks again as incorrect", () => {
    expect(recallTask.grade(null, { grade: "again" }).correct).toBe(false);
  });
});

describe("recall.serialize", () => {
  it("always produces a recall type with null payload", () => {
    const out = serializeRecall(null, {});
    expect(out.type).toBe("recall");
    expect(out.payload).toBeNull();
  });

  it("ignores mcqEnabled (recall is never affected)", () => {
    expect(serializeRecall(null, { mcqEnabled: false }).type).toBe("recall");
    expect(serializeRecall(null, { mcqEnabled: true }).type).toBe("recall");
  });

  it("never carries a 'correct' or secret field", () => {
    const json = JSON.stringify(serializeRecall(null, {}));
    expect(json).not.toContain("correct");
  });
});

describe("recall.emptyAttempt", () => {
  it("returns a valid recall attempt", () => {
    const a = recallTask.emptyAttempt();
    expect(recallTask.attemptSchema.safeParse(a).success).toBe(true);
  });
});
