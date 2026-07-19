import { describe, expect, test } from "vitest";
import {
  clozeToBlankDefs,
  clozeToText,
  insertBlankMarker,
  nextBlankId,
  parseClozeText,
} from "@/lib/editor/cloze-text";

describe("cloze-text", () => {
  test("parseClozeText: Text mit Markern wird zu Segmenten", () => {
    const { segments, missingDefs } = parseClozeText(
      "Ein [[1]] hat vier [[2]].",
      [
        { blankId: "1", accepted: ["Deadlock"], normalize: "ignore-case" },
        { blankId: "2", accepted: ["Bedingungen"], normalize: "exact" },
      ]
    );
    expect(missingDefs).toEqual([]);
    expect(segments).toEqual([
      { kind: "text", text: "Ein " },
      { kind: "blank", blankId: "1", accepted: ["Deadlock"], normalize: "ignore-case" },
      { kind: "text", text: " hat vier " },
      { kind: "blank", blankId: "2", accepted: ["Bedingungen"], normalize: "exact" },
      { kind: "text", text: "." },
    ]);
  });

  test("parseClozeText: Marker ohne Definition werden Text, gelistet als fehlend", () => {
    const { segments, missingDefs } = parseClozeText("A [[9]] B", []);
    expect(missingDefs).toEqual(["9"]);
    expect(segments).toEqual([{ kind: "text", text: "A [[9]] B" }]);
  });

  test("Rundreise: clozeToText ∘ parseClozeText = identisch", () => {
    const text = "Vor [[1]] mitte [[2]] nach.";
    const blanks = [
      { blankId: "1", accepted: ["x"], normalize: "trim" as const },
      { blankId: "2", accepted: ["y"], normalize: "regex" as const },
    ];
    const { segments } = parseClozeText(text, blanks);
    expect(clozeToText(segments)).toBe(text);
    expect(clozeToBlankDefs(segments)).toEqual(blanks);
  });

  test("nextBlankId: kleinste freie Nummer", () => {
    expect(nextBlankId([])).toBe("1");
    expect(nextBlankId([{ blankId: "1", accepted: [], normalize: "exact" }])).toBe("2");
    expect(
      nextBlankId([
        { blankId: "1", accepted: [], normalize: "exact" },
        { blankId: "2", accepted: [], normalize: "exact" },
        { blankId: "4", accepted: [], normalize: "exact" },
      ])
    ).toBe("3");
  });

  test("insertBlankMarker: Auswahl wird Marker, Auswahltext wird akzeptierte Antwort", () => {
    const text = "Die MMU löst einen Seitenfehler aus.";
    const start = text.indexOf("MMU");
    const end = start + 3;
    const result = insertBlankMarker(text, start, end, []);
    expect(result.text).toBe("Die [[1]] löst einen Seitenfehler aus.");
    expect(result.blankId).toBe("1");
    expect(result.blanks).toEqual([
      { blankId: "1", accepted: ["MMU"], normalize: "ignore-case" },
    ]);
  });

  test("insertBlankMarker: ohne Auswahl (Cursor) leere accepted-Liste", () => {
    const result = insertBlankMarker("Hallo Welt", 5, 5, []);
    expect(result.text).toBe("Hallo[[1]] Welt");
    expect(result.blanks[0].accepted).toEqual([]);
  });
});
