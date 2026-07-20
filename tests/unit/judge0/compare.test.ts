import { describe, expect, it } from "vitest";
import { compareOutput, DEFAULT_FLOAT_TOLERANCE } from "@/lib/judge0/compare";

describe("compareOutput: exact", () => {
  const cmp = { mode: "exact" } as const;

  it("identical output passes", () => {
    expect(compareOutput("42\n", "42\n", cmp).passed).toBe(true);
  });

  it("missing trailing newline fails (exact heißt exakt)", () => {
    const r = compareOutput("42\n", "42", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch?.reason).toBe("missing-lines");
    expect(r.mismatch?.line).toBe(2);
  });

  it("extra trailing newline fails", () => {
    const r = compareOutput("42\n", "42\n\n", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch?.reason).toBe("extra-lines");
  });

  it("trailing spaces fail", () => {
    expect(compareOutput("42\n", "42 \n", cmp).passed).toBe(false);
  });

  it("reports first differing line (1-basiert)", () => {
    const r = compareOutput("a\nb\nc\n", "a\nX\nc\n", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch).toMatchObject({ line: 2, expected: "b", actual: "X", reason: "content" });
  });

  it("empty expected matches empty actual", () => {
    expect(compareOutput("", "", cmp).passed).toBe(true);
  });
});

describe("compareOutput: trim", () => {
  const cmp = { mode: "trim" } as const;

  it("ignores trailing whitespace per line and final newlines", () => {
    expect(compareOutput("42\n", "42   \n\n\n", cmp).passed).toBe(true);
    expect(compareOutput("a  \nb\t\n", "a\nb\n", cmp).passed).toBe(true);
  });

  it("keeps leading whitespace significant", () => {
    expect(compareOutput("  42\n", "42\n", cmp).passed).toBe(false);
  });

  it("content mismatch still fails with details", () => {
    const r = compareOutput("Ergebnis: 5/4\n", "Ergebnis: 4/5\n", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch).toMatchObject({ line: 1, reason: "content" });
  });

  it("extra content line fails as extra-lines", () => {
    const r = compareOutput("a\n", "a\nb\n", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch?.reason).toBe("extra-lines");
  });
});

describe("compareOutput: float", () => {
  const cmp = { mode: "float", floatTolerance: 1e-4 } as const;

  it("close numbers pass (15.3333 vs 15.33333)", () => {
    expect(
      compareOutput("Gruppe A: Mittelwert 15.3333\n", "Gruppe A: Mittelwert 15.33333\n", cmp)
        .passed
    ).toBe(true);
  });

  it("default tolerance applies when none given", () => {
    const r = compareOutput("x 1.00001\n", "x 1.0\n", { mode: "float" });
    expect(r.passed).toBe(true);
    expect(DEFAULT_FLOAT_TOLERANCE).toBeCloseTo(1e-4);
  });

  it("distant numbers fail", () => {
    const r = compareOutput("Mittelwert 15.3333\n", "Mittelwert 15.4\n", cmp);
    expect(r.passed).toBe(false);
    expect(r.mismatch?.reason).toBe("content");
  });

  it("non-numeric tokens must match exactly", () => {
    expect(compareOutput("Mittelwert 1\n", "Durchschnitt 1\n", cmp).passed).toBe(false);
  });

  it("different token counts fail", () => {
    expect(compareOutput("1 2\n", "1 2 3\n", cmp).passed).toBe(false);
  });

  it("integers compare exactly within tolerance (1 vs 1)", () => {
    expect(compareOutput("5\n", "5\n", cmp).passed).toBe(true);
    expect(compareOutput("5\n", "6\n", cmp).passed).toBe(false);
  });

  it("large numbers use relative tolerance", () => {
    // |1000000 - 1000001| = 1 <= 1e-4 * 1000001 → ok.
    expect(compareOutput("1000000\n", "1000001\n", cmp).passed).toBe(true);
    expect(compareOutput("1000000\n", "1001000\n", cmp).passed).toBe(false);
  });

  it("nan/inf tokens are not numeric and must match literally", () => {
    expect(compareOutput("nan\n", "nan\n", cmp).passed).toBe(true);
    expect(compareOutput("nan\n", "NaN\n", cmp).passed).toBe(false);
    expect(compareOutput("inf\n", "1e999\n", cmp).passed).toBe(false);
  });

  it("trailing whitespace tolerance works like trim", () => {
    expect(compareOutput("v 1.5\n", "v 1.5  \n\n", cmp).passed).toBe(true);
  });
});
