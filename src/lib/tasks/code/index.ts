import type { TaskDefinition } from "../types";
import { codeAttemptSchema } from "./attempt";
import { gradeCode } from "./grade";
import { codePayloadSchema, type CodePayload, type CodePublic } from "./payload";
import { serializeCode } from "./serialize";
import type { CodeAttempt } from "./attempt";

export const codeTask: TaskDefinition<CodePayload, CodeAttempt, CodePublic> = {
  type: "code",
  payloadSchema: codePayloadSchema,
  attemptSchema: codeAttemptSchema,
  // Sync-Grader: immer incorrect (Code ist async via Judge0). Siehe
  // src/lib/judge0/grade.ts und /api/review/code-submit.
  grade: gradeCode,
  serialize: serializeCode,
  emptyAttempt: () => ({ languageId: 0, sourceCode: "" }),
};

export * from "./payload";
export * from "./attempt";
export { gradeCode } from "./grade";
export { serializeCode } from "./serialize";
