import { describe, expect, it } from "vitest";
import { resolveReviewGrade } from "@/lib/review-grade";
import type { McqOption } from "@/lib/types";

function options(correctIndices: number[]): McqOption[] {
  return ["a", "b", "c"].map((id, i) => ({
    id,
    text: `Option ${id}`,
    correct: correctIndices.includes(i),
  }));
}

describe("resolveReviewGrade", () => {
  it("resolves a correct MCQ selection to grade 'good'", () => {
    const out = resolveReviewGrade(
      { mcqOptions: options([0]) },
      { selectedOptionIds: ["a"] }
    );
    expect(out.resolvedGrade).toBe("good");
    expect(out.mcqCorrect).toBe(true);
    expect(out.correctOptionIds).toEqual(["a"]);
  });

  it("resolves a wrong MCQ selection to grade 'again'", () => {
    const out = resolveReviewGrade(
      { mcqOptions: options([0]) },
      { selectedOptionIds: ["b"] }
    );
    expect(out.resolvedGrade).toBe("again");
    expect(out.mcqCorrect).toBe(false);
  });

  it("resolves a multi-select MCQ correctly only when the sets match exactly", () => {
    const out = resolveReviewGrade(
      { mcqOptions: options([0, 2]) },
      { selectedOptionIds: ["a", "c"] }
    );
    expect(out.mcqCorrect).toBe(true);
    expect(out.correctOptionIds).toEqual(["a", "c"]);
  });

  it("treats a partial multi-select as incorrect", () => {
    const out = resolveReviewGrade(
      { mcqOptions: options([0, 2]) },
      { selectedOptionIds: ["a"] }
    );
    expect(out.mcqCorrect).toBe(false);
  });

  it("passes through a recall grade untouched", () => {
    const out = resolveReviewGrade({ mcqOptions: null }, { grade: "easy" });
    expect(out.resolvedGrade).toBe("easy");
    expect(out.mcqCorrect).toBeNull();
    expect(out.correctOptionIds).toBeNull();
  });

  it("treats non-array mcqOptions as no options (recall wins)", () => {
    const out = resolveReviewGrade(
      { mcqOptions: "garbage" },
      { selectedOptionIds: ["a"] }
    );
    expect(out.resolvedGrade).toBe("again");
    expect(out.mcqCorrect).toBe(false);
    expect(out.correctOptionIds).toEqual([]);
  });

  it("treats an MCQ attempt on a question without options as incorrect", () => {
    const out = resolveReviewGrade({ mcqOptions: null }, { selectedOptionIds: ["a"] });
    expect(out.mcqCorrect).toBe(false);
    expect(out.resolvedGrade).toBe("again");
  });
});
