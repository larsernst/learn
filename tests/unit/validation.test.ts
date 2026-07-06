import { describe, expect, it } from "vitest";
import {
  adminQuestionsBodySchema,
  adminResetPasswordSchema,
  adminUserPatchSchema,
  examSubmitSchema,
  loginSchema,
  passwordChangeSchema,
  registerSchema,
  reviewSubmitSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.de", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.de", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    expect(
      registerSchema.safeParse({ name: "Ada", email: "ada@b.de", password: "12345678" }).success
    ).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      registerSchema.safeParse({ name: "Ada", email: "ada@b.de", password: "short" }).success
    ).toBe(false);
  });

  it("rejects a name longer than 80 characters", () => {
    expect(
      registerSchema.safeParse({
        name: "x".repeat(81),
        email: "ada@b.de",
        password: "12345678",
      }).success
    ).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("accepts valid current and new passwords", () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "old", newPassword: "12345678" }).success
    ).toBe(true);
  });

  it("rejects a new password shorter than 8 characters", () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "old", newPassword: "short" }).success
    ).toBe(false);
  });
});

describe("reviewSubmitSchema", () => {
  it("accepts a recall grade", () => {
    expect(
      reviewSubmitSchema.safeParse({ questionId: "q1", grade: "good" }).success
    ).toBe(true);
  });

  it("accepts MCQ selectedOptionIds", () => {
    expect(
      reviewSubmitSchema.safeParse({ questionId: "q1", selectedOptionIds: ["a"] }).success
    ).toBe(true);
  });

  it("rejects when neither grade nor selectedOptionIds is given", () => {
    expect(reviewSubmitSchema.safeParse({ questionId: "q1" }).success).toBe(false);
  });

  it("rejects an invalid grade enum value", () => {
    expect(
      reviewSubmitSchema.safeParse({ questionId: "q1", grade: "medium" }).success
    ).toBe(false);
  });

  it("rejects an empty questionId", () => {
    expect(
      reviewSubmitSchema.safeParse({ questionId: "", grade: "good" }).success
    ).toBe(false);
  });
});

describe("examSubmitSchema", () => {
  it("accepts a valid exam submission", () => {
    expect(
      examSubmitSchema.safeParse({
        answers: [{ questionId: "q1", mode: "mcq", selectedOptionIds: ["a"] }],
        saveToSm2: true,
      }).success
    ).toBe(true);
  });

  it("rejects an empty answers array", () => {
    expect(examSubmitSchema.safeParse({ answers: [] }).success).toBe(false);
  });

  it("rejects an invalid mode", () => {
    expect(
      examSubmitSchema.safeParse({
        answers: [{ questionId: "q1", mode: "flashcard" }],
      }).success
    ).toBe(false);
  });
});

describe("adminQuestionsBodySchema", () => {
  const validQuestion = {
    id: "q1",
    chapter: 1,
    chapterTitle: "Kap 1",
    question: "Was?",
    answer: "So.",
    sourceRef: "src.md",
  };

  it("accepts a minimal valid question", () => {
    expect(adminQuestionsBodySchema.safeParse({ questions: [validQuestion] }).success).toBe(true);
  });

  it("accepts a question with mcqOptions and courseId", () => {
    expect(
      adminQuestionsBodySchema.safeParse({
        questions: [
          {
            ...validQuestion,
            courseId: "betriebssysteme",
            mcqOptions: [{ id: "a", text: "Antwort", correct: true }],
            confidence: "high",
          },
        ],
      }).success
    ).toBe(true);
  });

  it("rejects an empty questions array", () => {
    expect(adminQuestionsBodySchema.safeParse({ questions: [] }).success).toBe(false);
  });

  it("rejects a question with a non-integer chapter", () => {
    expect(
      adminQuestionsBodySchema.safeParse({
        questions: [{ ...validQuestion, chapter: 1.5 }],
      }).success
    ).toBe(false);
  });

  it("rejects an mcq option missing the correct flag", () => {
    expect(
      adminQuestionsBodySchema.safeParse({
        questions: [
          { ...validQuestion, mcqOptions: [{ id: "a", text: "Antwort" }] },
        ],
      }).success
    ).toBe(false);
  });
});

describe("adminResetPasswordSchema", () => {
  it("accepts a valid user id and new password", () => {
    expect(
      adminResetPasswordSchema.safeParse({ userId: "u1", newPassword: "12345678" }).success
    ).toBe(true);
  });

  it("rejects a new password shorter than 8 characters", () => {
    expect(
      adminResetPasswordSchema.safeParse({ userId: "u1", newPassword: "short" }).success
    ).toBe(false);
  });
});

describe("adminUserPatchSchema", () => {
  it("accepts a single field update", () => {
    expect(adminUserPatchSchema.safeParse({ name: "Neu" }).success).toBe(true);
  });

  it("accepts role changes", () => {
    expect(
      adminUserPatchSchema.safeParse({ addRoles: ["admin"], removeRoles: ["x"] }).success
    ).toBe(true);
  });

  it("rejects an empty patch", () => {
    expect(adminUserPatchSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(adminUserPatchSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
