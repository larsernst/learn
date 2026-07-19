import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { adminQuestionsBodySchema as bodySchema } from "@/lib/validation";
import { normalizeQuestionTask } from "@/lib/tasks/registry";
import type { TaskType } from "@/lib/tasks/types";

// Wandelt ein validiertes Frage-Objekt (das sowohl das neue taskType/payload-
// als auch das legacy mcqOptions-Format haben kann) in die kanonische Form
// { taskType, payload, mcqOptionsLegacy } um. mcqOptionsLegacy wird für den
// Dual-Write beibehalten, bis die Cleanup-Migration die Spalte entfernt.
function toTaskFields(q: {
  taskType?: "recall" | "mcq" | "dragdrop" | "cloze" | "order";
  payload?: unknown;
  mcqOptions?: { id: string; text: string; correct: boolean }[];
}): { taskType: string; payload: unknown; mcqOptions: unknown } {
  // recall: kein Payload.
  if (q.taskType === "recall") {
    return { taskType: "recall", payload: null, mcqOptions: null };
  }
  // mcq: payload = { options }; legacy mcqOptions wird dual-write mitgeführt.
  if (q.taskType === "mcq") {
    const options = (q.payload as { options?: unknown[] } | undefined)?.options ?? [];
    return { taskType: "mcq", payload: { options }, mcqOptions: options };
  }
  // dragdrop/cloze/order: neuer Typ mit autor-seitigem payload; kein legacy.
  if (q.taskType === "dragdrop" || q.taskType === "cloze" || q.taskType === "order") {
    return { taskType: q.taskType, payload: q.payload ?? null, mcqOptions: null };
  }
  // legacy: mcqOptions gesetzt (ohne taskType)
  if (q.mcqOptions !== undefined) {
    const normalized = normalizeQuestionTask("mcq", { options: q.mcqOptions }, q.mcqOptions);
    return {
      taskType: normalized.type,
      payload: normalized.payload,
      mcqOptions: q.mcqOptions,
    };
  }
  // default: recall
  return { taskType: "recall", payload: null, mcqOptions: null };
}

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  for (const q of parsed.data.questions) {
    const exists = await prisma.question.findUnique({ where: { id: q.id }, select: { id: true } });
    const taskFields = toTaskFields(q);
    const payloadValue = taskFields.payload ?? Prisma.JsonNull;
    await prisma.question.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        courseId: q.courseId ?? null,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: taskFields.mcqOptions ?? Prisma.JsonNull,
        confidence: q.confidence ?? null,
        taskType: taskFields.taskType,
        payload: payloadValue,
      },
      update: {
        courseId: q.courseId ?? null,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: taskFields.mcqOptions ?? Prisma.JsonNull,
        confidence: q.confidence ?? null,
        taskType: taskFields.taskType,
        payload: payloadValue,
      },
    });
    if (exists) updated++;
    else created++;
  }

  return NextResponse.json({ ok: true, created, updated, total: parsed.data.questions.length });
}

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const questions = await prisma.question.findMany({
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
    select: {
      id: true,
      courseId: true,
      chapter: true,
      chapterTitle: true,
      question: true,
      answer: true,
      sourceRef: true,
      mcqOptions: true,
      confidence: true,
      taskType: true,
      payload: true,
    },
  });
  return NextResponse.json({ questions: questions as (typeof questions[number] & { taskType: TaskType | null })[] });
}
