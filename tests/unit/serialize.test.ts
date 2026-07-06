import { describe, expect, it } from "vitest";
import { serializeQuestion, stripMcq } from "@/lib/serialize";
import type { McqOption } from "@/lib/types";

const baseQuestion = {
  id: "q-1",
  courseId: "betriebssysteme",
  chapter: 2,
  chapterTitle: "Prozesse und Threads",
  question: "Was ist ein Prozess?",
  answer: "Ein in Ausführung befindliches Programm.",
  sourceRef: "bs/kapitel-2.md",
};

function options(correctIndices: number[]): McqOption[] {
  return ["a", "b", "c", "d"].map((id, i) => ({
    id,
    text: `Option ${id}`,
    correct: correctIndices.includes(i),
  }));
}

describe("stripMcq", () => {
  it("removes the correct flag from every option", () => {
    const out = stripMcq(options([0, 2]));
    for (const o of out) {
      expect(o).not.toHaveProperty("correct");
      expect(Object.keys(o).sort()).toEqual(["id", "text"]);
    }
  });

  it("preserves all ids and texts as a permutation of the input", () => {
    const opts = options([1]);
    const out = stripMcq(opts);
    expect(out.map((o) => o.id).sort()).toEqual(opts.map((o) => o.id).sort());
    expect(out.map((o) => o.text).sort()).toEqual(opts.map((o) => o.text).sort());
    expect(out).toHaveLength(opts.length);
  });

  it("returns a permutation of the input order", () => {
    const opts = options([]);
    const out = stripMcq(opts);
    const originalKey = opts.map((o) => `${o.id}|${o.text}`).join(";");
    const outKey = out.map((o) => `${o.id}|${o.text}`).sort().join(";");
    expect(outKey.split(";").sort().join(";")).toEqual(
      originalKey.split(";").sort().join(";")
    );
  });

  it("handles an empty options array", () => {
    expect(stripMcq([])).toEqual([]);
  });
});

describe("serializeQuestion", () => {
  it("returns null mcq fields when mcqEnabled is false", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: options([0]) },
      false
    );
    expect(out.mcqOptions).toBeNull();
    expect(out.mcqSelectionMode).toBeNull();
  });

  it("returns null mcq fields when mcqOptions is null", () => {
    const out = serializeQuestion({ ...baseQuestion, mcqOptions: null }, true);
    expect(out.mcqOptions).toBeNull();
    expect(out.mcqSelectionMode).toBeNull();
  });

  it("returns null mcq fields when mcqOptions is not an array", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: "not-an-array" },
      true
    );
    expect(out.mcqOptions).toBeNull();
    expect(out.mcqSelectionMode).toBeNull();
  });

  it("derives single selection when exactly one option is correct", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: options([0]) },
      true
    );
    expect(out.mcqSelectionMode).toBe("single");
    expect(out.mcqOptions).not.toBeNull();
  });

  it("derives multi selection when several options are correct", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: options([0, 2]) },
      true
    );
    expect(out.mcqSelectionMode).toBe("multi");
  });

  it("never leaks the word 'correct' or any correct-flag in the serialized output", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: options([0, 1, 2, 3]) },
      true
    );
    const json = JSON.stringify(out);
    expect(json).not.toContain("correct");
    // Belt-and-braces: no option object carries a `correct` key.
    for (const o of out.mcqOptions ?? []) {
      expect(o).not.toHaveProperty("correct");
    }
  });

  it("passes through non-mcq fields unchanged", () => {
    const out = serializeQuestion(
      { ...baseQuestion, mcqOptions: null },
      true
    );
    expect(out.id).toBe(baseQuestion.id);
    expect(out.courseId).toBe(baseQuestion.courseId);
    expect(out.chapter).toBe(baseQuestion.chapter);
    expect(out.chapterTitle).toBe(baseQuestion.chapterTitle);
    expect(out.question).toBe(baseQuestion.question);
    expect(out.answer).toBe(baseQuestion.answer);
    expect(out.sourceRef).toBe(baseQuestion.sourceRef);
  });
});
