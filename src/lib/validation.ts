import { z } from "zod";
import { clozeAttemptSchema } from "@/lib/tasks/cloze/attempt";
import { clozePayloadSchema } from "@/lib/tasks/cloze/payload";
import { codeAttemptSchema } from "@/lib/tasks/code/attempt";
import { codePayloadSchema } from "@/lib/tasks/code/payload";
import { dragdropAttemptSchema } from "@/lib/tasks/dragdrop/attempt";
import { dragdropPayloadSchema } from "@/lib/tasks/dragdrop/payload";
import { mcqAttemptSchema } from "@/lib/tasks/mcq/attempt";
import { mcqPayloadSchema } from "@/lib/tasks/mcq/payload";
import { orderAttemptSchema } from "@/lib/tasks/order/attempt";
import { orderPayloadSchema } from "@/lib/tasks/order/payload";
import { recallAttemptSchema } from "@/lib/tasks/recall/attempt";

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

export const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

// Review-Submit: diskriminiert nach taskType. Attempt-Schemas kommen aus
// den Task-Bundles (Single Source of Truth für die Lerner-Eingabe).
// Recall wird selbstbewertet (grade); alle anderen Typen werden serverseitig
// über den Task-Grader ausgewertet.
export const reviewSubmitSchema = z.discriminatedUnion("taskType", [
  recallAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("recall"),
    isNew: z.boolean().optional(),
  }),
  mcqAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("mcq"),
    isNew: z.boolean().optional(),
  }),
  dragdropAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("dragdrop"),
    isNew: z.boolean().optional(),
  }),
  clozeAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("cloze"),
    isNew: z.boolean().optional(),
  }),
  orderAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("order"),
    isNew: z.boolean().optional(),
  }),
  // code: async über /api/review/code-submit; hier nur der Sync-Fallback.
  codeAttemptSchema.extend({
    questionId: z.string().min(1),
    taskType: z.literal("code"),
    isNew: z.boolean().optional(),
  }),
]);

// Exam-Answer: diskriminiert nach taskType. Recall wird im Exam selbst
// bewertet (correct: boolean), alle anderen serverseitig ausgewertet.
export const examAnswerSchema = z.discriminatedUnion("taskType", [
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("recall"),
    correct: z.boolean(),
  }),
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("mcq"),
    selectedOptionIds: z.array(z.string().min(1)),
  }),
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("dragdrop"),
    assignment: z.record(z.string().min(1), z.string()),
  }),
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("cloze"),
    answers: z.record(z.string().min(1), z.string()),
  }),
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("order"),
    orderedIds: z.array(z.string().min(1)),
  }),
  z.object({
    questionId: z.string().min(1),
    taskType: z.literal("code"),
    correct: z.boolean(),
  }),
]);

export const examSubmitSchema = z.object({
  answers: z.array(examAnswerSchema).min(1),
  saveToSm2: z.boolean().optional(),
});

// Admin-/Seed-Fragen. Akzeptiert bewusst beide Formate:
//   (a) neu:  taskType + payload
//   (b) alt:  mcqOptions (legacy, wird intern zu taskType/payload gemappt)
// So bleibt der bestehende JSON-Upload funktionstüchtig, bis die
// Editor-Oberfläche (Phase 2) das neue Format primär nutzt.
export const questionSchema = z
  .object({
    id: z.string().min(1),
    courseId: z.string().min(1).optional(),
    chapter: z.number().int().min(1),
    chapterTitle: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1),
    sourceRef: z.string().min(1),
    confidence: z.enum(["high", "low"]).optional(),
    taskType: z.enum(["recall", "mcq", "dragdrop", "cloze", "order", "code"]).optional(),
    payload: z.unknown().optional(),
    mcqOptions: z.array(mcqOptionSchema).optional(),
  })
  .refine((v) => !(v.taskType !== undefined && v.mcqOptions !== undefined), {
    message: "Entweder 'taskType'/'payload' oder 'mcqOptions' angeben, nicht beides.",
  })
  .refine(
    (v) =>
      v.taskType === "mcq" ||
      v.taskType === "dragdrop" ||
      v.taskType === "cloze" ||
      v.taskType === "order" ||
      v.taskType === "code" ||
      v.mcqOptions !== undefined ||
      v.taskType === "recall" ||
      v.taskType === undefined,
    { message: "Unbekannter taskType." }
  );

export const adminQuestionsBodySchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export const mcqPayloadAdminSchema = mcqPayloadSchema;

export const adminResetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein."),
});

// Course-Metadaten für Editor-CRUD (Phase 2). Slug wird vom Server aus dem
// Titel abgeleitet, falls nicht gesetzt.
export const courseCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  slug: z.string().min(1).max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const coursePatchSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    slug: z.string().min(1).max(120).optional(),
    status: z.enum(["draft", "published"]).optional(),
    order: z.number().int().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.slug !== undefined ||
      v.status !== undefined ||
      v.order !== undefined,
    { message: "Keine Daten zum Aktualisieren." }
  );

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
