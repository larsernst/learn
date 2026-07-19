import { describe, expect, it } from "vitest";
import { clozeTask } from "@/lib/tasks/cloze";
import { serializeCloze } from "@/lib/tasks/cloze/serialize";
import type { ClozePayload } from "@/lib/tasks/cloze/payload";

const exactPayload: ClozePayload = {
  segments: [
    { kind: "text", text: "Ein " },
    {
      kind: "blank",
      blankId: "b1",
      accepted: ["Prozess"],
      normalize: "exact",
    },
    { kind: "text", text: " ist ein in Ausführung befindliches Programm." },
  ],
};

const caseInsPayload: ClozePayload = {
  segments: [
    { kind: "text", text: "Die " },
    {
      kind: "blank",
      blankId: "cpu",
      accepted: ["CPU", "cpu", "Central Processing Unit"],
      normalize: "ignore-case",
    },
    { kind: "text", text: " führt Befehle aus." },
  ],
};

const regexPayload: ClozePayload = {
  segments: [
    {
      kind: "blank",
      blankId: "num",
      accepted: ["^\\d+$"],
      normalize: "regex",
    },
    { kind: "text", text: " ist eine Zahl." },
  ],
};

describe("cloze.grade", () => {
  it("accepts an exact match", () => {
    expect(clozeTask.grade(exactPayload, { answers: { b1: "Prozess" } }).correct).toBe(true);
  });

  it("rejects a wrong exact match", () => {
    expect(clozeTask.grade(exactPayload, { answers: { b1: "prozess" } }).correct).toBe(false);
  });

  it("accepts case-insensitive matches", () => {
    expect(clozeTask.grade(caseInsPayload, { answers: { cpu: "cpu" } }).correct).toBe(true);
    expect(clozeTask.grade(caseInsPayload, { answers: { cpu: "CPU" } }).correct).toBe(true);
    expect(clozeTask.grade(caseInsPayload, { answers: { cpu: "central processing unit" } }).correct).toBe(true);
  });

  it("accepts regex matches", () => {
    expect(clozeTask.grade(regexPayload, { answers: { num: "42" } }).correct).toBe(true);
    expect(clozeTask.grade(regexPayload, { answers: { num: "007" } }).correct).toBe(true);
  });

  it("rejects invalid regex matches", () => {
    expect(clozeTask.grade(regexPayload, { answers: { num: "abc" } }).correct).toBe(false);
  });

  it("rejects missing answers", () => {
    expect(clozeTask.grade(exactPayload, { answers: {} }).correct).toBe(false);
  });

  it("rejects when no blanks exist", () => {
    expect(clozeTask.grade({ segments: [{ kind: "text", text: "Hallo" }] }, { answers: {} }).correct).toBe(false);
  });
});

describe("cloze.serialize", () => {
  it("strips accepted answers from blanks", () => {
    const out = serializeCloze(exactPayload, {});
    expect(out.type).toBe("cloze");
    const json = JSON.stringify(out);
    expect(json).not.toContain("accepted");
    expect(json).not.toContain("Prozess");
  });

  it("preserves text segments, blankIds, and placeholders", () => {
    const out = serializeCloze(exactPayload, {});
    expect(out.payload.segments).toHaveLength(3);
    expect(out.payload.segments[0]).toEqual({ kind: "text", text: "Ein " });
    expect(out.payload.segments[1]).toEqual({ kind: "blank", blankId: "b1", placeholder: undefined });
    expect(out.payload.segments[2]).toEqual({ kind: "text", text: " ist ein in Ausführung befindliches Programm." });
  });
});

describe("cloze.emptyAttempt", () => {
  it("returns an empty answers object", () => {
    const a = clozeTask.emptyAttempt();
    expect(a.answers).toEqual({});
    expect(clozeTask.attemptSchema.safeParse(a).success).toBe(true);
  });
});
