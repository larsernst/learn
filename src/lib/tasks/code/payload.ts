// code: Auto-bewertete Programmieraufgabe via Judge0.
//
// Payload enthält Sprachen-Liste (languages, IDs aus Judge0), Starter-Code
// pro Sprache, Testfälle (öffentlich + versteckt) und Ressourcen-Limits.
//
// WICHTIG: Im Gegensatz zu den anderen Task-Typen ist das Grading asynchron
// (Judge0 führt Code aus). Die Bundle.grade-Funktion ist daher ein
// Synchronisationsschritt für Fallback-Fälle; das tatsächliche Grading
// passiert in src/lib/judge0/run.ts (serverseitig, async).

import { z } from "zod";

// Harte Obergrenzen gegen Missbrauch (Judge0-Aufrufe kosten CPU-Zeit).
export const CODE_SOURCE_MAX = 64_000; // Starter-Code / Einreichung
export const CODE_IO_MAX = 8_000; // stdin / erwartete Ausgabe pro Testfall
export const CODE_TESTCASES_MAX = 20;

// Judge0 vergleicht stdout exakt (inkl. finalem Newline). Damit Autoren das
// abschließende `\n` nicht von Hand pflegen müssen, wird die erwartete
// Ausgabe beim Parsen normalisiert: kein oder mehrere abschließende
// Zeilenumbrüche → genau einer. Leere Ausgabe bleibt leer.
export function normalizeExpectedOutput(value: string): string {
  if (value === "") return value;
  return value.replace(/\n+$/, "") + "\n";
}

export const codeLanguageSchema = z.object({
  languageId: z.number().int().positive(),
  label: z.string().min(1).max(60),
  starterCode: z.string().max(CODE_SOURCE_MAX),
});

export const codeTestCaseSchema = z.object({
  id: z.string().min(1).max(60),
  input: z.string().max(CODE_IO_MAX),
  // Kommandozeilen-Argumente (argv) für Übungen wie „Worte auf der
  // Befehlszeile". Wird an Judge0 `command_line_arguments` durchgereicht.
  args: z.string().max(2000).optional(),
  expectedOutput: z.string().max(CODE_IO_MAX).transform(normalizeExpectedOutput),
  hidden: z.boolean(),
});

// Vergleichsmodus für stdout (Umsetzung: src/lib/judge0/compare.ts).
// Alt-Payloads ohne `comparison` gelten als "exact" (bisheriges Verhalten).
export const codeComparisonSchema = z
  .object({
    mode: z.enum(["exact", "trim", "float"]).default("exact"),
    floatTolerance: z.number().positive().max(1).optional(),
  })
  .default({ mode: "exact" });

export type CodeComparison = z.infer<typeof codeComparisonSchema>;

export const codePayloadSchema = z.object({
  languages: z.array(codeLanguageSchema).min(1).max(3),
  testCases: z.array(codeTestCaseSchema).min(1).max(CODE_TESTCASES_MAX),
  comparison: codeComparisonSchema,
  // Musterlösung (nur Editor/Admin sichtbar, wird NIEMALS an Lernende
  // serialisiert – serialize.ts mappt nur explizite Felder).
  referenceSolution: z.string().max(CODE_SOURCE_MAX).optional(),
  timeLimitMs: z.number().int().positive().max(15000),
  memoryLimitKb: z.number().int().positive().max(524288),
});

export type CodePayload = z.infer<typeof codePayloadSchema>;
export type CodeLanguage = z.infer<typeof codeLanguageSchema>;
export type CodeTestCase = z.infer<typeof codeTestCaseSchema>;

// Public-Payload: Testfälle ohne `expectedOutput` und ohne `input` bei
// versteckten Tests. Sensitive Daten werden strikt beim Client entfernt.
export type CodePublic = {
  languages: CodeLanguage[];
  publicTests: {
    id: string;
    input: string;
    args?: string;
    expectedOutput: string;
  }[];
  hiddenTestCount: number;
  comparison: CodeComparison;
  timeLimitMs: number;
  memoryLimitKb: number;
};
