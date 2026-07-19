import type { TaskDefinition } from "../types";
import { dragdropAttemptSchema } from "./attempt";
import { gradeDragDrop } from "./grade";
import { dragdropPayloadSchema, type DragDropPayload, type DragDropPublic } from "./payload";
import { serializeDragDrop } from "./serialize";
import type { DragDropAttempt } from "./attempt";

export const dragdropTask: TaskDefinition<
  DragDropPayload,
  DragDropAttempt,
  DragDropPublic
> = {
  type: "dragdrop",
  payloadSchema: dragdropPayloadSchema,
  attemptSchema: dragdropAttemptSchema,
  grade: gradeDragDrop,
  serialize: serializeDragDrop,
  emptyAttempt: () => ({ assignment: {} }),
};

export * from "./payload";
export * from "./attempt";
export { gradeDragDrop } from "./grade";
export { serializeDragDrop } from "./serialize";
