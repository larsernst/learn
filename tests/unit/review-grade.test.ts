import { describe, expect, it } from "vitest";
import { resolveReviewGrade } from "@/lib/review-grade";

// Hilfsfunktion: MCQ-Frage mit korrekten Optionen.
function mcqQuestion(correctIndices: number[]) {
  const options = ["a", "b", "c"].map((id, i) => ({
    id,
    text: `Option ${id}`,
    correct: correctIndices.includes(i),
  }));
  return { taskType: "mcq" as const, payload: { options }, mcqOptions: options };
}

const recallQuestion = { taskType: "recall" as const, payload: null, mcqOptions: null };

describe("resolveReviewGrade", () => {
  it("resolves a correct MCQ selection to grade 'good'", () => {
    const out = resolveReviewGrade(mcqQuestion([0]), {
      taskType: "mcq",
      selectedOptionIds: ["a"],
    });
    expect(out.resolvedGrade).toBe("good");
    expect(out.correct).toBe(true);
    expect(out.correctOptionIds).toEqual(["a"]);
  });

  it("resolves a wrong MCQ selection to grade 'again'", () => {
    const out = resolveReviewGrade(mcqQuestion([0]), {
      taskType: "mcq",
      selectedOptionIds: ["b"],
    });
    expect(out.resolvedGrade).toBe("again");
    expect(out.correct).toBe(false);
  });

  it("resolves a multi-select MCQ correctly only when the sets match exactly", () => {
    const out = resolveReviewGrade(mcqQuestion([0, 2]), {
      taskType: "mcq",
      selectedOptionIds: ["a", "c"],
    });
    expect(out.correct).toBe(true);
    expect(out.correctOptionIds).toEqual(["a", "c"]);
  });

  it("treats a partial multi-select as incorrect", () => {
    const out = resolveReviewGrade(mcqQuestion([0, 2]), {
      taskType: "mcq",
      selectedOptionIds: ["a"],
    });
    expect(out.correct).toBe(false);
  });

  it("passes through a recall grade untouched", () => {
    const out = resolveReviewGrade(recallQuestion, { taskType: "recall", grade: "easy" });
    expect(out.resolvedGrade).toBe("easy");
    expect(out.correct).toBeNull();
    expect(out.correctOptionIds).toBeNull();
  });

  it("treats an MCQ attempt on a recall question as incorrect (no options)", () => {
    const out = resolveReviewGrade(recallQuestion, {
      taskType: "mcq",
      selectedOptionIds: ["a"],
    });
    expect(out.correct).toBe(false);
    expect(out.resolvedGrade).toBe("again");
  });

  it("treats non-array mcqOptions on an MCQ question as no correct options", () => {
    const out = resolveReviewGrade(
      { taskType: "mcq", payload: null, mcqOptions: "garbage" },
      { taskType: "mcq", selectedOptionIds: ["a"] }
    );
    expect(out.resolvedGrade).toBe("again");
    expect(out.correct).toBe(false);
    expect(out.correctOptionIds).toBeNull();
  });

  it("falls back to recall when taskType is null and no mcqOptions exist", () => {
    const out = resolveReviewGrade(
      { taskType: null, payload: null, mcqOptions: null },
      { taskType: "recall", grade: "good" }
    );
    expect(out.resolvedGrade).toBe("good");
    expect(out.correct).toBeNull();
  });
});
