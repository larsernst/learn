import { describe, expect, test } from "vitest";
import {
  buildDragDropPayload,
  buildMcqPayload,
  buildOrderPayload,
  buildCodePayload,
  codeFormError,
  codeToForm,
  dragdropFormError,
  dragdropToForm,
  mcqFormError,
  mcqSelectionMode,
  mcqToForm,
  orderFormError,
  orderToForm,
} from "@/lib/editor/payload";
import { mcqPayloadSchema } from "@/lib/tasks/mcq/payload";
import { dragdropPayloadSchema } from "@/lib/tasks/dragdrop/payload";
import { orderPayloadSchema } from "@/lib/tasks/order/payload";
import { codePayloadSchema } from "@/lib/tasks/code/payload";

describe("editor/payload: mcq", () => {
  test("buildMcqPayload vergibt stabile IDs und validiert gegen das Schema", () => {
    const payload = buildMcqPayload({
      options: [
        { text: "A", correct: true },
        { text: "B", correct: false },
      ],
    });
    expect(payload.options[0].id).toBe("opt-1");
    expect(mcqPayloadSchema.safeParse(payload).success).toBe(true);
  });

  test("mcqToForm Rundreise", () => {
    const form = {
      options: [
        { text: "A", correct: true },
        { text: "B", correct: false },
        { text: "C", correct: true },
      ],
    };
    expect(mcqToForm(buildMcqPayload(form))).toEqual(form);
  });

  test("mcqFormError: erkennt fehlende/zu wenige korrekte Optionen", () => {
    expect(mcqFormError({ options: [{ text: "A", correct: false }] })).toContain("zwei Optionen");
    expect(
      mcqFormError({
        options: [
          { text: "A", correct: false },
          { text: "B", correct: false },
        ],
      })
    ).toContain("richtig");
    expect(
      mcqFormError({
        options: [
          { text: "A", correct: true },
          { text: "B", correct: false },
        ],
      })
    ).toBeNull();
  });

  test("mcqSelectionMode: single bei genau einer korrekten, sonst multi", () => {
    expect(mcqSelectionMode({ options: [{ text: "A", correct: true }, { text: "B", correct: false }] })).toBe("single");
    expect(mcqSelectionMode({ options: [{ text: "A", correct: true }, { text: "B", correct: true }] })).toBe("multi");
    expect(mcqSelectionMode({ options: [{ text: "A", correct: false }] })).toBe("multi");
  });

  test("mcqToForm: null/leer ergibt leere Optionsliste", () => {
    expect(mcqToForm(null)).toEqual({ options: [] });
    expect(mcqToForm({})).toEqual({ options: [] });
  });

  test("mcqFormError: korrekt markierte Option ohne Text", () => {
    expect(
      mcqFormError({
        options: [
          { text: "", correct: true },
          { text: "B", correct: true },
          { text: "C", correct: false },
        ],
      })
    ).toContain("keinen Text");
  });
});

describe("editor/payload: dragdrop", () => {
  const form = {
    zones: [{ label: "Prozess" }, { label: "Thread" }],
    items: [
      { text: "eigener Adressraum", zoneIndex: 0 },
      { text: "eigener Stack", zoneIndex: 1 },
    ],
  };

  test("buildDragDropPayload mappt Indizes auf IDs und validiert", () => {
    const payload = buildDragDropPayload(form);
    expect(payload.correct).toEqual({ "item-1": "zone-1", "item-2": "zone-2" });
    expect(dragdropPayloadSchema.safeParse(payload).success).toBe(true);
  });

  test("dragdropToForm Rundreise", () => {
    expect(dragdropToForm(buildDragDropPayload(form))).toEqual(form);
  });

  test("dragdropFormError: nicht zugeordnete Elemente werden erkannt", () => {
    expect(
      dragdropFormError({
        zones: [{ label: "Z" }],
        items: [{ text: "x", zoneIndex: null }],
      })
    ).toContain("zugeordnet");
    expect(dragdropFormError(form)).toBeNull();
  });

  test("dragdropFormError: leere Zonen/Elemente und fehlende Texte", () => {
    expect(dragdropFormError({ zones: [{ label: " " }], items: [{ text: "x", zoneIndex: 0 }] })).toContain("Zone");
    expect(dragdropFormError({ zones: [{ label: "Z" }], items: [{ text: " ", zoneIndex: 0 }] })).toContain("Element");
    expect(
      dragdropFormError({ zones: [{ label: "Z" }, { label: "" }], items: [{ text: "x", zoneIndex: 0 }] })
    ).toContain("keine Bezeichnung");
    expect(
      dragdropFormError({ zones: [{ label: "Z" }], items: [{ text: "", zoneIndex: 0 }, { text: "y", zoneIndex: 0 }] })
    ).toContain("keinen Text");
  });

  test("dragdropToForm: null und unbekannte Zonen-Referenzen", () => {
    expect(dragdropToForm(null)).toEqual({ zones: [], items: [] });
    const form2 = dragdropToForm({
      zones: [{ id: "zone-1", label: "A" }],
      items: [{ id: "item-1", text: "x" }, { id: "item-2", text: "y" }],
      correct: { "item-1": "zone-1", "item-2": "zone-99" },
    });
    expect(form2.items[0].zoneIndex).toBe(0);
    expect(form2.items[1].zoneIndex).toBeNull();
  });
});

describe("editor/payload: order", () => {
  test("buildOrderPayload: Reihenfolge der Liste ist die korrekte Reihenfolge", () => {
    const payload = buildOrderPayload({ items: ["eins", "zwei", "drei"] });
    expect(payload.correctOrder).toEqual(["step-1", "step-2", "step-3"]);
    expect(orderPayloadSchema.safeParse(payload).success).toBe(true);
  });

  test("orderToForm Rundreise", () => {
    const form = { items: ["eins", "zwei", "drei"] };
    expect(orderToForm(buildOrderPayload(form))).toEqual(form);
  });

  test("orderFormError: Mindestanzahl und leere Texte", () => {
    expect(orderFormError({ items: ["nur eins"] })).toContain("zwei");
    expect(orderFormError({ items: ["a", " "] })).toContain("keinen Text");
    expect(orderFormError({ items: ["a", "b"] })).toBeNull();
  });

  test("orderToForm: null und verwaiste correctOrder-Referenzen (Fallback auf items)", () => {
    expect(orderToForm(null)).toEqual({ items: [] });
    expect(
      orderToForm({
        items: [{ id: "step-1", text: "a" }, { id: "step-2", text: "b" }],
        correctOrder: ["gibts-nicht"],
      })
    ).toEqual({ items: ["a", "b"] });
  });
});

describe("editor/payload: code", () => {
  const form = {
    languageId: 71,
    starterCode: "print()",
    testCases: [
      { input: "1", expectedOutput: "1\n", hidden: false },
      { input: "2", expectedOutput: "2\n", hidden: true },
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
  };

  test("buildCodePayload validiert gegen das Schema", () => {
    const payload = buildCodePayload(form);
    expect(codePayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.languages[0].label).toBe("Python 3");
    expect(payload.testCases[1].hidden).toBe(true);
  });

  test("codeToForm Rundreise", () => {
    expect(codeToForm(buildCodePayload(form))).toEqual(form);
  });

  test("codeFormError: Testfall-Pflicht und öffentlicher Test", () => {
    expect(codeFormError({ ...form, testCases: [] })).toContain("Testfall");
    expect(
      codeFormError({ ...form, testCases: [{ input: "", expectedOutput: "x", hidden: true }] })
    ).toContain("öffentlich");
    expect(codeFormError(form)).toBeNull();
  });

  test("codeFormError: Testfall ohne erwartete Ausgabe", () => {
    expect(
      codeFormError({ ...form, testCases: [{ input: "", expectedOutput: " ", hidden: false }] })
    ).toContain("erwartete Ausgabe");
  });

  test("codeToForm: null ergibt Standardwerte", () => {
    expect(codeToForm(null)).toEqual({
      languageId: 71,
      starterCode: "",
      testCases: [],
      timeLimitMs: 2000,
      memoryLimitKb: 262144,
    });
  });

  test("buildCodePayload: unbekannte languageId bekommt Fallback-Label", () => {
    const payload = buildCodePayload({ ...form, languageId: 999 });
    expect(payload.languages[0].label).toBe("Language 999");
  });
});
