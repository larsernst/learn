import { describe, expect, it } from "vitest";
import {
  applySm2,
  clampEase,
  gradeToQuality,
  isDue,
  isMcqCorrect,
  mcqGrade,
  nextIntervalDays,
  SM2_DEFAULTS,
  type Sm2UpdateInput,
} from "@/lib/sm2";

function initialState(): Sm2UpdateInput {
  return {
    easeFactor: SM2_DEFAULTS.easeFactor,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: new Date(),
    lastReviewedAt: null,
  };
}

describe("clampEase", () => {
  it("limits the ease factor to the configured floor", () => {
    expect(clampEase(1.0)).toBe(SM2_DEFAULTS.easeFloor);
    expect(clampEase(2.5)).toBe(2.5);
  });
});

describe("gradeToQuality", () => {
  it("maps the four UI grades to SM-2 quality values", () => {
    expect(gradeToQuality("again")).toBe(1);
    expect(gradeToQuality("hard")).toBe(3);
    expect(gradeToQuality("good")).toBe(4);
    expect(gradeToQuality("easy")).toBe(5);
  });
});

describe("nextIntervalDays", () => {
  it("follows the capped progression (max 2 days)", () => {
    const ef = 2.5;
    expect(nextIntervalDays(1, 0, ef)).toBe(1);
    expect(nextIntervalDays(2, 1, ef)).toBe(2);
    expect(nextIntervalDays(3, 6, ef)).toBe(2);
    expect(nextIntervalDays(4, 15, ef)).toBe(2);
  });

  it("returns 0 for repetitions before the first review", () => {
    expect(nextIntervalDays(0, 0, 2.5)).toBe(0);
  });
});

describe("applySm2", () => {
  it("resets the card on 'again' and increases lapses", () => {
    const before: Sm2UpdateInput = {
      easeFactor: 2.6,
      intervalDays: 30,
      repetitions: 4,
      lapses: 0,
      dueAt: new Date(),
      lastReviewedAt: null,
    };
    const after = applySm2(before, "again", new Date("2026-07-01T00:00:00Z"));
    expect(after.repetitions).toBe(0);
    expect(after.intervalDays).toBe(0);
    expect(after.lapses).toBe(1);
    // 'again' lowers the ease factor but never below the floor.
    expect(after.easeFactor).toBeLessThan(before.easeFactor);
    expect(after.easeFactor).toBeGreaterThanOrEqual(SM2_DEFAULTS.easeFloor);
    // Due again today.
    expect(after.dueAt.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("progresses 1 -> 2 -> 2 days for 'good' on a new card (capped)", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    let state = initialState();
    state = applySm2(state, "good", now);
    expect(state.repetitions).toBe(1);
    expect(state.intervalDays).toBe(1);
    expect(state.dueAt.toISOString().slice(0, 10)).toBe("2026-07-02");

    state = applySm2(state, "good", now);
    expect(state.repetitions).toBe(2);
    expect(state.intervalDays).toBe(2);
    expect(state.dueAt.toISOString().slice(0, 10)).toBe("2026-07-03");

    state = applySm2(state, "good", now);
    expect(state.repetitions).toBe(3);
    expect(state.intervalDays).toBe(2);
  });

  it("raises the ease factor on 'easy' and lowers it on 'hard'", () => {
    const base = 2.5;
    const easyState = applySm2({ ...initialState(), easeFactor: base }, "easy");
    const hardState = applySm2({ ...initialState(), easeFactor: base }, "hard");
    expect(easyState.easeFactor).toBeGreaterThan(base);
    expect(hardState.easeFactor).toBeLessThan(base);
  });
});

describe("isDue", () => {
  it("treats dueAt on or before now as due", () => {
    const now = new Date("2026-07-01T15:00:00Z");
    expect(isDue({ dueAt: new Date("2026-07-01T00:00:00Z") }, now)).toBe(true);
    expect(isDue({ dueAt: new Date("2026-06-30T23:00:00Z") }, now)).toBe(true);
    expect(isDue({ dueAt: new Date("2026-07-02T00:00:00Z") }, now)).toBe(false);
  });

  it("makes an 'again' card due immediately so it repeats in the same session", () => {
    const now = new Date("2026-07-01T15:00:00Z");
    const before: Sm2UpdateInput = {
      easeFactor: 2.5,
      intervalDays: 6,
      repetitions: 2,
      lapses: 0,
      dueAt: new Date("2026-07-07T00:00:00Z"),
      lastReviewedAt: null,
    };
    const after = applySm2(before, "again", now);
    // dueAt == now (Intervall 0) -> sofort wieder faellig
    expect(after.dueAt.getTime()).toBe(now.getTime());
    expect(isDue({ dueAt: after.dueAt }, now)).toBe(true);
  });

  it("schedules a 'good' card into the future (not due now)", () => {
    const now = new Date("2026-07-01T15:00:00Z");
    const after = applySm2(initialState(), "good", now);
    expect(after.dueAt.getTime()).toBeGreaterThan(now.getTime());
    expect(isDue({ dueAt: after.dueAt }, now)).toBe(false);
  });
});

describe("isMcqCorrect", () => {
  const correct = ["a", "b", "c"];

  it("returns true when the selection matches the correct set exactly", () => {
    expect(isMcqCorrect(["a", "b", "c"], correct)).toBe(true);
    expect(isMcqCorrect(["c", "a", "b"], correct)).toBe(true);
  });

  it("returns false on a missing correct option", () => {
    expect(isMcqCorrect(["a", "b"], correct)).toBe(false);
  });

  it("returns false on an extra (wrong) option", () => {
    expect(isMcqCorrect(["a", "b", "c", "x"], correct)).toBe(false);
  });

  it("returns false when a wrong option replaces a correct one", () => {
    expect(isMcqCorrect(["a", "b", "x"], correct)).toBe(false);
  });

  it("returns false for an empty selection", () => {
    expect(isMcqCorrect([], correct)).toBe(false);
  });
});

describe("mcqGrade", () => {
  it("maps a correct answer to 'good' and a wrong one to 'again'", () => {
    expect(mcqGrade(true)).toBe("good");
    expect(mcqGrade(false)).toBe("again");
  });

  it("an MCQ 'again' result makes the card due immediately", () => {
    const now = new Date("2026-07-01T15:00:00Z");
    const after = applySm2(initialState(), mcqGrade(false), now);
    expect(after.dueAt.getTime()).toBe(now.getTime());
    expect(isDue({ dueAt: after.dueAt }, now)).toBe(true);
    expect(after.lapses).toBe(1);
  });

  it("an MCQ 'good' result schedules the card into the future", () => {
    const now = new Date("2026-07-01T15:00:00Z");
    const after = applySm2(initialState(), mcqGrade(true), now);
    expect(after.dueAt.getTime()).toBeGreaterThan(now.getTime());
    expect(isDue({ dueAt: after.dueAt }, now)).toBe(false);
  });
});