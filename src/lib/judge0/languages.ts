// Kanonische Liste der für Code-Aufgaben freigeschalteten Judge0-Sprachen.
// Rein (kein Env-/Server-Zugriff) – wird sowohl vom Editor (Auswahl) als
// auch serverseitig zur Validierung von Einreichungen genutzt.
// Language-IDs: Judge0 CE 1.13.x (https://ce.judge0.com → /languages).

export const JUDGE0_LANGUAGES: readonly { languageId: number; label: string }[] = [
  { languageId: 71, label: "Python 3" },
  { languageId: 63, label: "JavaScript (Node.js)" },
  { languageId: 62, label: "Java" },
  { languageId: 50, label: "C (GCC)" },
  { languageId: 54, label: "C++ (G++)" },
  { languageId: 46, label: "Bash" },
] as const;

const ALLOWED_LANGUAGE_IDS: ReadonlySet<number> = new Set(
  JUDGE0_LANGUAGES.map((l) => l.languageId)
);

export function isAllowedLanguageId(languageId: number): boolean {
  return ALLOWED_LANGUAGE_IDS.has(languageId);
}
