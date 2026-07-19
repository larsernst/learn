// code: Serialisierung – stript hidden Testfälle vollständig (input/expected)
// und überträgt nur public Testfälle für Transparenz.

import type { SerializeOptions, TaskType } from "../types";
import type { CodePayload, CodePublic } from "./payload";

export function serializeCode(
  payload: CodePayload,
  _options: SerializeOptions = {}
): { type: TaskType; payload: CodePublic } {
  const publicTests = payload.testCases
    .filter((t) => !t.hidden)
    .map((t) => ({
      id: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
    }));
  const hiddenCount = payload.testCases.filter((t) => t.hidden).length;

  return {
    type: "code",
    payload: {
      languages: payload.languages,
      publicTests,
      hiddenTestCount: hiddenCount,
      timeLimitMs: payload.timeLimitMs,
      memoryLimitKb: payload.memoryLimitKb,
    },
  };
}
