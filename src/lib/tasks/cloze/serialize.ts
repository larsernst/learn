// cloze: Serialisierung – stript accepted-Antworten aus jeder Lücke.

import type { SerializeOptions, TaskType } from "../types";
import type { ClozePayload, ClozePublic } from "./payload";

export function serializeCloze(
  payload: ClozePayload,
  _options: SerializeOptions = {}
): { type: TaskType; payload: ClozePublic } {
  return {
    type: "cloze",
    payload: {
      segments: payload.segments.map((s) =>
        s.kind === "text"
          ? { kind: "text" as const, text: s.text }
          : {
              kind: "blank" as const,
              blankId: s.blankId,
              placeholder: s.placeholder,
            }
      ),
    },
  };
}
