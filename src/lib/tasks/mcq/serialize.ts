// mcq: Serialisierung – strips correct-Flag, mischt die Reihenfolge,
// leitet single/multi ab. Gibt null zurück, wenn mcqEnabled=false
// (Aufrufer soll dann zu recall degenerieren).

import type { SerializeOptions, TaskType } from "../types";
import type { McqPayload, McqPublic } from "./payload";

export function serializeMcq(
  payload: McqPayload,
  options: SerializeOptions = {}
): { type: TaskType; payload: McqPublic } | null {
  if (options.mcqEnabled === false) return null;

  const stripped = payload.options.map((o) => ({ id: o.id, text: o.text }));
  for (let i = stripped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stripped[i], stripped[j]] = [stripped[j], stripped[i]];
  }

  const correctCount = payload.options.filter((o) => o.correct).length;
  return {
    type: "mcq",
    payload: {
      options: stripped,
      selectionMode: correctCount === 1 ? "single" : "multi",
    },
  };
}
