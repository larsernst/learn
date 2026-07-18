import type { TaskDefinition } from "../types";
import { recallAttemptSchema } from "./attempt";
import { gradeRecall } from "./grade";
import { recallPayloadSchema, type RecallPayload } from "./payload";
import { serializeRecall } from "./serialize";
import type { RecallAttempt } from "./attempt";

export const recallTask: TaskDefinition<RecallPayload, RecallAttempt, null> = {
  type: "recall",
  payloadSchema: recallPayloadSchema,
  attemptSchema: recallAttemptSchema,
  grade: gradeRecall,
  serialize: serializeRecall,
  emptyAttempt: () => ({ grade: "again" }),
};

export * from "./payload";
export * from "./attempt";
export { gradeRecall } from "./grade";
export { serializeRecall } from "./serialize";
