import { describe, expect, it } from "vitest";
import { serializeQuestion } from "@/lib/serialize";
import type { SerializableQuestion } from "@/lib/serialize";

const baseQuestion: SerializableQuestion = {
  id: "q-1",
  courseId: "betriebssysteme",
  chapter: 2,
  chapterTitle: "Prozesse und Threads",
  question: "Was ist ein Prozess?",
  answer: "Ein in Ausführung befindliches Programm.",
  sourceRef: "bs/kapitel-2.md",
  taskType: "recall",
  payload: null,
};

function mcqPayload(correct: boolean[]) {
  return {
    options: correct.map((c, i) => ({
      id: String.fromCharCode(97 + i),
      text: `Option ${i + 1}`,
      correct: c,
    })),
  };
}

function withMcq(correct: boolean[]): SerializableQuestion {
  return { ...baseQuestion, taskType: "mcq", payload: mcqPayload(correct) };
}

describe("serializeQuestion (recall)", () => {
  it("serializes a recall question with taskType=recall and null payload", () => {
    const out = serializeQuestion(baseQuestion, true);
    expect(out.taskType).toBe("recall");
    expect(out.taskPayload).toBeNull();
  });

  it("passes through non-mcq fields unchanged", () => {
    const out = serializeQuestion(baseQuestion, true);
    expect(out.id).toBe(baseQuestion.id);
    expect(out.courseId).toBe(baseQuestion.courseId);
    expect(out.chapter).toBe(baseQuestion.chapter);
    expect(out.chapterTitle).toBe(baseQuestion.chapterTitle);
    expect(out.question).toBe(baseQuestion.question);
    expect(out.answer).toBe(baseQuestion.answer);
    expect(out.sourceRef).toBe(baseQuestion.sourceRef);
  });
});

describe("serializeQuestion (mcq)", () => {
  it("serializes an MCQ question with taskType=mcq and populated payload", () => {
    const out = serializeQuestion(withMcq([true, false]), true);
    expect(out.taskType).toBe("mcq");
    expect(out.taskPayload).not.toBeNull();
  });

  it("derives single selection when exactly one option is correct", () => {
    const out = serializeQuestion(withMcq([true, false, false]), true);
    const payload = out.taskPayload as { selectionMode: string };
    expect(payload.selectionMode).toBe("single");
  });

  it("derives multi selection when several options are correct", () => {
    const out = serializeQuestion(withMcq([true, false, true]), true);
    const payload = out.taskPayload as { selectionMode: string };
    expect(payload.selectionMode).toBe("multi");
  });

  it("degrades MCQ to recall when mcqEnabled is false", () => {
    const out = serializeQuestion(withMcq([true, false]), false);
    expect(out.taskType).toBe("recall");
    expect(out.taskPayload).toBeNull();
  });

  it("never leaks the word 'correct' or any correct-flag in the serialized output", () => {
    const out = serializeQuestion(withMcq([true, true, false, true]), true);
    const json = JSON.stringify(out);
    expect(json).not.toContain("correct");
    const payload = out.taskPayload as { options: Record<string, unknown>[] };
    for (const o of payload.options) {
      expect(o).not.toHaveProperty("correct");
    }
  });
});

describe("serializeQuestion (legacy compatibility)", () => {
  it("derives taskType from legacy mcqOptions when taskType is null", () => {
    const legacy: SerializableQuestion = {
      ...baseQuestion,
      taskType: null,
      payload: null,
      mcqOptions: mcqPayload([true, false]).options,
    };
    const out = serializeQuestion(legacy, true);
    expect(out.taskType).toBe("mcq");
    expect(out.taskPayload).not.toBeNull();
  });

  it("treats null taskType with no mcqOptions as recall", () => {
    const legacy: SerializableQuestion = {
      ...baseQuestion,
      taskType: null,
      payload: null,
    };
    const out = serializeQuestion(legacy, true);
    expect(out.taskType).toBe("recall");
    expect(out.taskPayload).toBeNull();
  });
});
