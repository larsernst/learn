import type { TaskDefinition } from "../types";
import { orderAttemptSchema } from "./attempt";
import { gradeOrder } from "./grade";
import { orderPayloadSchema, type OrderPayload, type OrderPublic } from "./payload";
import { serializeOrder } from "./serialize";
import type { OrderAttempt } from "./attempt";

export const orderTask: TaskDefinition<OrderPayload, OrderAttempt, OrderPublic> = {
  type: "order",
  payloadSchema: orderPayloadSchema,
  attemptSchema: orderAttemptSchema,
  grade: gradeOrder,
  serialize: serializeOrder,
  emptyAttempt: () => ({ orderedIds: [] }),
};

export * from "./payload";
export * from "./attempt";
export { gradeOrder } from "./grade";
export { serializeOrder } from "./serialize";
