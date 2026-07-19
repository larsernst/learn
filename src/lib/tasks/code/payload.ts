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

export const codeLanguageSchema = z.object({
  languageId: z.number().int().positive(),
  label: z.string().min(1),
  starterCode: z.string(),
});

export const codeTestCaseSchema = z.object({
  id: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
  hidden: z.boolean(),
});

export const codePayloadSchema = z.object({
  languages: z.array(codeLanguageSchema).min(1),
  testCases: z.array(codeTestCaseSchema).min(1),
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
    expectedOutput: string;
  }[];
  hiddenTestCount: number;
  timeLimitMs: number;
  memoryLimitKb: number;
};
