// recall: Serialisierung – kein Geheimnis zu verstecken, kein Public-Payload.

import type { SerializeOptions, TaskType } from "../types";
import type { RecallPayload } from "./payload";

export function serializeRecall(
  _payload: RecallPayload,
  _options: SerializeOptions = {}
): { type: TaskType; payload: null } {
  return { type: "recall", payload: null };
}
