import { describe, expect, it } from "vitest";
import { orderTask } from "@/lib/tasks/order";
import { serializeOrder } from "@/lib/tasks/order/serialize";
import type { OrderPayload } from "@/lib/tasks/order/payload";

const payload: OrderPayload = {
  items: [
    { id: "a", text: "Erstens" },
    { id: "b", text: "Zweitens" },
    { id: "c", text: "Drittens" },
  ],
  correctOrder: ["a", "b", "c"],
};

describe("order.grade", () => {
  it("accepts the exact correct order", () => {
    expect(orderTask.grade(payload, { orderedIds: ["a", "b", "c"] }).correct).toBe(true);
  });

  it("rejects a wrong order", () => {
    expect(orderTask.grade(payload, { orderedIds: ["c", "b", "a"] }).correct).toBe(false);
    expect(orderTask.grade(payload, { orderedIds: ["a", "c", "b"] }).correct).toBe(false);
  });

  it("rejects partial order (wrong length)", () => {
    expect(orderTask.grade(payload, { orderedIds: ["a", "b"] }).correct).toBe(false);
    expect(orderTask.grade(payload, { orderedIds: ["a", "b", "c", "d"] }).correct).toBe(false);
  });

  it("rejects empty order", () => {
    expect(orderTask.grade(payload, { orderedIds: [] }).correct).toBe(false);
  });
});

describe("order.serialize", () => {
  it("shuffles item order as a permutation of the input", () => {
    const out = serializeOrder(payload, {});
    expect(out.type).toBe("order");
    expect(out.payload.items.map((i) => i.id).sort()).toEqual(["a", "b", "c"]);
    expect(out.payload.items).toHaveLength(3);
  });

  it("does not expose correctOrder in output", () => {
    const json = JSON.stringify(serializeOrder(payload, {}));
    expect(json).not.toContain("correctOrder");
  });
});

describe("order.emptyAttempt", () => {
  it("returns empty orderedIds", () => {
    const a = orderTask.emptyAttempt();
    expect(a.orderedIds).toEqual([]);
    expect(orderTask.attemptSchema.safeParse(a).success).toBe(true);
  });
});
