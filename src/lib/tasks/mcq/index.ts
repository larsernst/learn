import type { TaskDefinition } from "../types";
import { mcqAttemptSchema } from "./attempt";
import { gradeMcq } from "./grade";
import { mcqPayloadSchema, type McqPayload, type McqPublic } from "./payload";
import { serializeMcq } from "./serialize";
import type { McqAttempt } from "./attempt";

export const mcqTask: TaskDefinition<McqPayload, McqAttempt, McqPublic> = {
  type: "mcq",
  payloadSchema: mcqPayloadSchema,
  attemptSchema: mcqAttemptSchema,
  grade: gradeMcq,
  serialize: serializeMcq,
  emptyAttempt: () => ({ selectedOptionIds: [] }),
};

export * from "./payload";
export * from "./attempt";
export { gradeMcq } from "./grade";
export { serializeMcq } from "./serialize";
