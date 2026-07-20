// Ausgabevergleich für Code-Aufgaben – rein und ohne Judge0-Abhängigkeit.
//
// Judge0 selbst kann nur exakt vergleichen (expected_output-Feld). Wir
// senden Submissions daher OHNE expected_output und vergleichen stdout hier
// selbst – das erlaubt drei Modi und bessere Fehlermeldungen für Lernende:
//
//   exact  Byte-gleicher Vergleich (inkl. finalem \n – der Payload-
//          Normalisierung sei Dank hat expectedOutput immer genau eines).
//   trim   Pro Zeile werden trailing Whitespaces ignoriert, ebenso
//          abschließende Leerzeilen. Robust gegen cout << " " << endl-Noise.
//   float  Wie trim, zusätzlich werden Tokens, die beidseitig als Zahl
//          lesbar sind, mit Toleranz verglichen (Default 1e-4, relativ zu
//          max(1, |a|, |b|)). Für Aufgaben ohne vorgegebene Nachkommastellen.

import type { CodeComparison } from "@/lib/tasks/code/payload";

export const DEFAULT_FLOAT_TOLERANCE = 1e-4;

export type MismatchReason = "content" | "missing-lines" | "extra-lines";

export interface OutputMismatch {
  // 1-basierte Zeilennummer der ersten Abweichung.
  line: number;
  expected: string;
  actual: string;
  reason: MismatchReason;
}

export interface CompareResult {
  passed: boolean;
  mismatch?: OutputMismatch;
}

const MAX_REPORT_LEN = 200;

function clip(s: string): string {
  return s.length > MAX_REPORT_LEN ? `${s.slice(0, MAX_REPORT_LEN)}…` : s;
}

function linesOf(s: string): string[] {
  return s.split("\n");
}

// trim-Modus: trailing Whitespace je Zeile entfernen und leere Zeilen am
// Ende verwerfen (damit ist auch das finale \n egal).
function normalizeTrim(lines: string[]): string[] {
  const trimmed = lines.map((l) => l.replace(/\s+$/, ""));
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === "") {
    trimmed.pop();
  }
  return trimmed;
}

function isNumericToken(s: string): boolean {
  if (s.trim() === "" || s.includes(" ")) return false;
  return Number.isFinite(Number(s));
}

function numbersClose(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

// Vergleicht zwei Zeilen tokenweise (Whitespace-getrennt). Numerische Tokens
// auf beiden Seiten dürfen um tolerance abweichen, alles andere muss exakt
// gleich sein. Ungleiche Token-Anzahl → false.
function floatLinesEqual(a: string, b: string, tolerance: number): boolean {
  const ta = a.split(/\s+/).filter((t) => t !== "");
  const tb = b.split(/\s+/).filter((t) => t !== "");
  if (ta.length !== tb.length) return false;
  for (let i = 0; i < ta.length; i++) {
    if (ta[i] === tb[i]) continue;
    if (isNumericToken(ta[i]) && isNumericToken(tb[i])) {
      if (numbersClose(Number(ta[i]), Number(tb[i]), tolerance)) continue;
    }
    return false;
  }
  return true;
}

export function compareOutput(
  expected: string,
  actual: string,
  comparison: CodeComparison
): CompareResult {
  const mode = comparison.mode;

  if (mode === "exact") {
    if (expected === actual) return { passed: true };
    // Für die Anzeige: erste abweichende Zeile finden.
    const exp = linesOf(expected);
    const act = linesOf(actual);
    return { passed: false, mismatch: firstDiff(exp, act) };
  }

  const tolerance =
    mode === "float"
      ? (comparison.floatTolerance ?? DEFAULT_FLOAT_TOLERANCE)
      : 0;

  const exp = normalizeTrim(linesOf(expected));
  const act = normalizeTrim(linesOf(actual));

  for (let i = 0; i < Math.max(exp.length, act.length); i++) {
    const e = exp[i];
    const a = act[i];
    if (e === undefined) {
      return {
        passed: false,
        mismatch: { line: i + 1, expected: "", actual: clip(a ?? ""), reason: "extra-lines" },
      };
    }
    if (a === undefined) {
      return {
        passed: false,
        mismatch: { line: i + 1, expected: clip(e), actual: "", reason: "missing-lines" },
      };
    }
    const equal =
      mode === "float" ? floatLinesEqual(e, a, tolerance) : e === a;
    if (!equal) {
      return {
        passed: false,
        mismatch: { line: i + 1, expected: clip(e), actual: clip(a), reason: "content" },
      };
    }
  }
  return { passed: true };
}

function firstDiff(exp: string[], act: string[]): OutputMismatch {
  for (let i = 0; i < Math.max(exp.length, act.length); i++) {
    const e = exp[i];
    const a = act[i];
    if (e === a) continue;
    if (e === undefined) {
      return { line: i + 1, expected: "", actual: clip(a ?? ""), reason: "extra-lines" };
    }
    if (a === undefined) {
      return { line: i + 1, expected: clip(e), actual: "", reason: "missing-lines" };
    }
    return { line: i + 1, expected: clip(e), actual: clip(a), reason: "content" };
  }
  // Gleichlang und gleich – kann nur bei identischem Inhalt passieren,
  // dann wäre passed=true; defensiv trotzdem einen Platzhalter liefern.
  return { line: 1, expected: "", actual: "", reason: "content" };
}
