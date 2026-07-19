import { describe, expect, test } from "vitest";
import { analyzeCourseQuality } from "@/lib/editor/quality";

describe("analyzeCourseQuality", () => {
  test("zählt Typen und nicht zugeordnete Fragen", () => {
    const q = analyzeCourseQuality([
      { id: "a", taskType: "recall", payload: null, chapterId: "c1" },
      { id: "b", taskType: "mcq", payload: { options: [{ text: "x", correct: true }, { text: "y", correct: false }] }, chapterId: null },
      { id: "c", taskType: null, payload: null, chapterId: null },
    ]);
    expect(q.total).toBe(3);
    expect(q.byType).toEqual({ recall: 2, mcq: 1 });
    expect(q.unassigned).toBe(2);
    expect(q.warnings).toEqual([]);
  });

  test("MCQ: ohne richtige Option, zu wenige Optionen, leere Option", () => {
    const q = analyzeCourseQuality([
      { id: "m1", taskType: "mcq", payload: { options: [{ text: "x", correct: false }, { text: "y", correct: false }] }, chapterId: "c" },
      { id: "m2", taskType: "mcq", payload: { options: [{ text: "x", correct: true }] }, chapterId: "c" },
      { id: "m3", taskType: "mcq", payload: { options: [{ text: "", correct: true }, { text: "y", correct: false }] }, chapterId: "c" },
      { id: "ok", taskType: "mcq", payload: { options: [{ text: "x", correct: true }, { text: "y", correct: false }] }, chapterId: "c" },
    ]);
    const messages = q.warnings.map((w) => `${w.questionId}:${w.message}`);
    expect(messages).toContain("m1:MCQ ohne richtige Option");
    expect(messages).toContain("m2:MCQ mit weniger als 2 Optionen");
    expect(messages).toContain("m3:MCQ mit leerer Option");
    expect(q.warnings.find((w) => w.questionId === "ok")).toBeUndefined();
  });

  test("DragDrop: Elemente ohne Zone", () => {
    const q = analyzeCourseQuality([
      {
        id: "d1",
        taskType: "dragdrop",
        payload: {
          zones: [{ id: "z1", label: "Z" }],
          items: [{ id: "i1", text: "a" }, { id: "i2", text: "b" }],
          correct: { i1: "z1" },
        },
        chapterId: "c",
      },
    ]);
    expect(q.warnings).toEqual([{ questionId: "d1", message: "Zuordnen: 1 Element(e) ohne Zone" }]);
  });

  test("Cloze ohne Lücke, Order mit <2 Elementen, Code ohne (öffentlichen) Testfall", () => {
    const q = analyzeCourseQuality([
      { id: "c1", taskType: "cloze", payload: { segments: [{ kind: "text", text: "nur text" }] }, chapterId: "c" },
      { id: "o1", taskType: "order", payload: { items: [{ id: "s1", text: "eins" }], correctOrder: ["s1"] }, chapterId: "c" },
      { id: "k1", taskType: "code", payload: { languages: [], testCases: [], timeLimitMs: 1, memoryLimitKb: 1 }, chapterId: "c" },
      { id: "k2", taskType: "code", payload: { languages: [], testCases: [{ id: "t", input: "", expectedOutput: "", hidden: true }], timeLimitMs: 1, memoryLimitKb: 1 }, chapterId: "c" },
    ]);
    const messages = q.warnings.map((w) => `${w.questionId}:${w.message}`);
    expect(messages).toContain("c1:Lückentext ohne Lücke");
    expect(messages).toContain("o1:Sortieren mit weniger als 2 Elementen");
    expect(messages).toContain("k1:Code-Aufgabe ohne Testfall");
    expect(messages).toContain("k2:Code-Aufgabe ohne öffentlichen Testfall");
  });

  test("leere Fragenmenge", () => {
    const q = analyzeCourseQuality([]);
    expect(q.total).toBe(0);
    expect(q.warnings).toEqual([]);
  });
});
