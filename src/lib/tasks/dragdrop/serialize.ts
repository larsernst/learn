// dragdrop: Serialisierung – entfernt das `correct`-Feld, mischt Item-Reihenfolge.

import type { SerializeOptions, TaskType } from "../types";
import type { DragDropPayload, DragDropPublic } from "./payload";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function serializeDragDrop(
  payload: DragDropPayload,
  _options: SerializeOptions = {}
): { type: TaskType; payload: DragDropPublic } {
  return {
    type: "dragdrop",
    payload: {
      zones: payload.zones,
      items: shuffle(payload.items),
    },
  };
}
