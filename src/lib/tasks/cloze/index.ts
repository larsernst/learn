import type { TaskDefinition } from "../types";
import { clozeAttemptSchema } from "./attempt";
import { gradeCloze } from "./grade";
import { clozePayloadSchema, type ClozePayload, type ClozePublic } from "./payload";
import { serializeCloze } from "./serialize";
import type { ClozeAttempt } from "./attempt";

export const clozeTask: TaskDefinition<ClozePayload, ClozeAttempt, ClozePublic> = {
  type: "cloze",
  payloadSchema: clozePayloadSchema,
  attemptSchema: clozeAttemptSchema,
  grade: gradeCloze,
  serialize: serializeCloze,
  emptyAttempt: () => ({ answers: {} }),
};

export * from "./payload";
export * from "./attempt";
export { gradeCloze } from "./grade";
export { serializeCloze } from "./serialize";
