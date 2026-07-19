// order: Serialisierung – mischt die Item-Reihenfolge, sodass der Lerner
// die Lösung nicht aus der Anzeigereihenfolge ableiten kann.

import type { SerializeOptions, TaskType } from "../types";
import type { OrderPayload, OrderPublic } from "./payload";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function serializeOrder(
  payload: OrderPayload,
  _options: SerializeOptions = {}
): { type: TaskType; payload: OrderPublic } {
  return {
    type: "order",
    payload: { items: shuffle(payload.items) },
  };
}
