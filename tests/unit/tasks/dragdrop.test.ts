import { describe, expect, it } from "vitest";
import { dragdropTask } from "@/lib/tasks/dragdrop";
import { serializeDragDrop } from "@/lib/tasks/dragdrop/serialize";
import type { DragDropPayload } from "@/lib/tasks/dragdrop/payload";

const payload: DragDropPayload = {
  zones: [
    { id: "even", label: "Gerade" },
    { id: "odd", label: "Ungerade" },
  ],
  items: [
    { id: "n2", text: "2" },
    { id: "n3", text: "3" },
    { id: "n4", text: "4" },
  ],
  correct: { n2: "even", n3: "odd", n4: "even" },
};

describe("dragdrop.grade", () => {
  it("accepts a complete and correct assignment", () => {
    const r = dragdropTask.grade(payload, {
      assignment: { n2: "even", n3: "odd", n4: "even" },
    });
    expect(r.correct).toBe(true);
  });

  it("rejects a wrong assignment for one item", () => {
    const r = dragdropTask.grade(payload, {
      assignment: { n2: "even", n3: "even", n4: "even" },
    });
    expect(r.correct).toBe(false);
  });

  it("rejects an incomplete assignment (missing item)", () => {
    const r = dragdropTask.grade(payload, {
      assignment: { n2: "even", n4: "even" },
    });
    expect(r.correct).toBe(false);
  });

  it("rejects an empty assignment", () => {
    expect(dragdropTask.grade(payload, { assignment: {} }).correct).toBe(false);
  });
});

describe("dragdrop.serialize", () => {
  it("strips the correct mapping from the public payload", () => {
    const out = serializeDragDrop(payload, {});
    expect(out.type).toBe("dragdrop");
    expect(JSON.stringify(out)).not.toContain("correct");
    expect(out.payload.zones).toEqual(payload.zones);
  });

  it("shuffles item order as a permutation of the input", () => {
    const out = serializeDragDrop(payload, {});
    expect(out.payload.items.map((i) => i.id).sort()).toEqual(
      payload.items.map((i) => i.id).sort()
    );
    expect(out.payload.items).toHaveLength(payload.items.length);
  });

  it("preserves zone order (zones are not shuffled)", () => {
    const out = serializeDragDrop(payload, {});
    expect(out.payload.zones.map((z) => z.id)).toEqual(["even", "odd"]);
  });
});

describe("dragdrop.emptyAttempt", () => {
  it("returns an empty assignment", () => {
    const a = dragdropTask.emptyAttempt();
    expect(a.assignment).toEqual({});
    expect(dragdropTask.attemptSchema.safeParse(a).success).toBe(true);
  });
});
