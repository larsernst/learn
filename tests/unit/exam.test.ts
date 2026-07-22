import { describe, expect, it } from "vitest";
import { gradeExamAttempt, selectExamQuestions, shuffle, type ExamAttempt } from "@/lib/exam";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-fuer-exam-verdicts-0123456789";

interface Opt {
  id: string;
  text: string;
  correct: boolean;
}

const OPTS: Opt[] = [
  { id: "a", text: "A", correct: true },
  { id: "b", text: "B", correct: false },
  { id: "c", text: "C", correct: true },
];

const questionsById = new Map<
  string,
  { taskType: string | null; payload: unknown; mcqOptions?: unknown }
>([
  ["mcq1", { taskType: "mcq", payload: { options: OPTS }, mcqOptions: OPTS }],
  ["recall1", { taskType: "recall", payload: null, mcqOptions: null }],
]);

describe("shuffle", () => {
  it("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect(out.sort()).toEqual(input);
    expect(out).not.toBe(input);
  });
});

describe("selectExamQuestions", () => {
  it("returns count questions when count < total", () => {
    const all = Array.from({ length: 100 }, (_, i) => i);
    const picked = selectExamQuestions(all, 30);
    expect(picked).toHaveLength(30);
    expect(new Set(picked).size).toBe(30);
  });

  it("returns all (shuffled) when count >= total", () => {
    const all = [1, 2, 3];
    const picked = selectExamQuestions(all, 10);
    expect(picked.sort()).toEqual([1, 2, 3]);
  });

  it("returns all when count is 0 or invalid", () => {
    const all = [1, 2, 3, 4];
    expect(selectExamQuestions(all, 0).sort()).toEqual([1, 2, 3, 4]);
    expect(selectExamQuestions(all, -5).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe("gradeExamAttempt", () => {
  it("grades MCQ by comparing selected vs correct set", () => {
    const attempts: ExamAttempt[] = [
      { questionId: "mcq1", taskType: "mcq", selectedOptionIds: ["a", "c"] },
    ];
    const res = gradeExamAttempt(attempts, questionsById);
    expect(res.score).toBe(1);
    expect(res.total).toBe(1);
  });

  it("marks an MCQ with wrong selection as incorrect", () => {
    const attempts: ExamAttempt[] = [
      { questionId: "mcq1", taskType: "mcq", selectedOptionIds: ["a", "b"] },
    ];
    const res = gradeExamAttempt(attempts, questionsById);
    expect(res.score).toBe(0);
    expect(res.perQuestion[0].correct).toBe(false);
  });

  it("trusts the self-marked correct flag for recall questions", () => {
    const attempts: ExamAttempt[] = [
      { questionId: "recall1", taskType: "recall", correct: true },
    ];
    const res = gradeExamAttempt(attempts, questionsById);
    expect(res.score).toBe(1);
    expect(res.total).toBe(1);
  });

  it("treats a recall attempt with correct=false as incorrect", () => {
    const attempts: ExamAttempt[] = [
      { questionId: "recall1", taskType: "recall", correct: false },
    ];
    const res = gradeExamAttempt(attempts, questionsById);
    expect(res.perQuestion[0].correct).toBe(false);
  });

  it("handles missing question gracefully (treated as incorrect)", () => {
    const attempts: ExamAttempt[] = [
      { questionId: "unknown", taskType: "mcq", selectedOptionIds: ["a"] },
    ];
    const res = gradeExamAttempt(attempts, questionsById);
    expect(res.perQuestion[0].correct).toBe(false);
  });
});

// ── Code-Verdicts im Prüfungsmodus ────────────────────────────────────
describe("gradeExamAttempt: code", () => {
  it("gültiges Verdict zählt als richtig", async () => {
    const { signCodeVerdict } = await import("@/lib/exam-verdict");
    const attempts: ExamAttempt[] = [
      { questionId: "code1", taskType: "code", verdict: signCodeVerdict("code1", "u1", true, "src") },
    ];
    const res = gradeExamAttempt(attempts, questionsById, "u1");
    expect(res.score).toBe(1);
  });

  it("gültiges Verdict mit false zählt als falsch", async () => {
    const { signCodeVerdict } = await import("@/lib/exam-verdict");
    const attempts: ExamAttempt[] = [
      { questionId: "code1", taskType: "code", verdict: signCodeVerdict("code1", "u1", false, "src") },
    ];
    expect(gradeExamAttempt(attempts, questionsById, "u1").score).toBe(0);
  });

  it("manipuliertes Verdict (Client-Flag) gilt als falsch", async () => {
    const { signCodeVerdict } = await import("@/lib/exam-verdict");
    const token = signCodeVerdict("code1", "u1", false, "src");
    const [v, body] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ qid: "code1", correct: true, sh: "x", exp: 9999999999 })
    ).toString("base64url");
    const attempts: ExamAttempt[] = [
      { questionId: "code1", taskType: "code", verdict: `${v}.${forgedBody}.${token.split(".")[2]}` },
    ];
    expect(gradeExamAttempt(attempts, questionsById, "u1").score).toBe(0);
    void body;
  });

  it("leeres/fehlendes Verdict gilt als falsch (kein Client-Vertrauen)", () => {
    const attempts: ExamAttempt[] = [{ questionId: "code1", taskType: "code", verdict: "" }];
    expect(gradeExamAttempt(attempts, questionsById).score).toBe(0);
  });

  it("Verdict einer anderen Frage gilt als falsch", async () => {
    const { signCodeVerdict } = await import("@/lib/exam-verdict");
    const attempts: ExamAttempt[] = [
      { questionId: "code1", taskType: "code", verdict: signCodeVerdict("andere", "u1", true, "src") },
    ];
    expect(gradeExamAttempt(attempts, questionsById, "u1").score).toBe(0);
  });
});
