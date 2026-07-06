import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const reviewSubmitSchema = z
  .object({
    questionId: z.string().min(1),
    grade: z.enum(["again", "hard", "good", "easy"]).optional(),
    selectedOptionIds: z.array(z.string()).optional(),
    isNew: z.boolean().optional(),
  })
  .refine((v) => v.grade !== undefined || v.selectedOptionIds !== undefined, {
    message: "Entweder 'grade' (Freie Erinnerung) oder 'selectedOptionIds' (MCQ) erforderlich.",
  });

export const examAnswerSchema = z.object({
  questionId: z.string().min(1),
  mode: z.enum(["recall", "mcq"]),
  correct: z.boolean().optional(),
  selectedOptionIds: z.array(z.string()).optional(),
});

export const examSubmitSchema = z.object({
  answers: z.array(examAnswerSchema).min(1),
  saveToSm2: z.boolean().optional(),
});

export const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1).optional(),
  chapter: z.number().int().min(1),
  chapterTitle: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  sourceRef: z.string().min(1),
  confidence: z.enum(["high", "low"]).optional(),
  mcqOptions: z.array(mcqOptionSchema).optional(),
});

export const adminQuestionsBodySchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export const adminResetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein."),
});

export const adminUserPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    mcqEnabled: z.boolean().optional(),
    addRoles: z.array(z.string().min(1)).optional(),
    removeRoles: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.email !== undefined ||
      v.mcqEnabled !== undefined ||
      v.addRoles !== undefined ||
      v.removeRoles !== undefined,
    { message: "Keine Daten zum Aktualisieren." }
  );

export const adminSettingsSchema = z
  .object({
    matureThresholdDays: z.number().int().min(1).max(365).optional(),
  })
  .refine((v) => v.matureThresholdDays !== undefined, {
    message: "matureThresholdDays erforderlich.",
  });
