import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEditorApi, isAdmin } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { isTaskType, TASK_REGISTRY } from "@/lib/tasks/registry";
import { z } from "zod";

const patchSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  sourceRef: z.string().min(1).optional(),
  confidence: z.enum(["high", "low"]).nullable().optional(),
  chapterId: z.string().min(1).nullable().optional(),
  taskType: z.string().optional(),
  payload: z.unknown().optional(),
  order: z.number().int().optional(),
});

async function loadQuestionWithCourse(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true, courseId: true, course: { select: { id: true, ownerId: true, status: true } } },
  });
  return question;
}

function canEditQuestion(
  user: { sub: string; roles: string[] },
  question: { courseId: string | null; course: { id: string; ownerId: string | null; status: string } | null }
): boolean {
  if (isAdmin(user)) return true;
  if (!question.course) return false;
  return canEditCourse(user, question.course);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await loadQuestionWithCourse(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }
  if (!canEditQuestion(guard.user, existing)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const data: Prisma.QuestionUpdateInput = {};
  if (parsed.data.question !== undefined) data.question = parsed.data.question;
  if (parsed.data.answer !== undefined) data.answer = parsed.data.answer;
  if (parsed.data.sourceRef !== undefined) data.sourceRef = parsed.data.sourceRef;
  if (parsed.data.confidence !== undefined) data.confidence = parsed.data.confidence;
  if (parsed.data.order !== undefined) data.order = parsed.data.order;

  // Kapitel-Zuordnung: chapterId darf null (entkoppeln) oder ein Kapitel
  // desselben Kurses sein; flache Anzeige-Felder werden synchronisiert.
  if (parsed.data.chapterId !== undefined) {
    if (parsed.data.chapterId === null) {
      data.chapterRef = { disconnect: true };
    } else {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parsed.data.chapterId },
        select: { id: true, courseId: true, title: true, order: true },
      });
      if (!chapter || chapter.courseId !== existing.courseId) {
        return NextResponse.json(
          { error: "Kapitel nicht gefunden (oder gehört zu einem anderen Kurs)." },
          { status: 400 }
        );
      }
      data.chapterRef = { connect: { id: chapter.id } };
      data.chapterTitle = chapter.title;
      data.chapter = chapter.order;
    }
  }

  // Task-Typ/Payload: bei Typwechsel ist payload Pflicht; das Payload wird
  // gegen das Zod-Schema des Task-Bundles validiert.
  if (parsed.data.taskType !== undefined) {
    if (!isTaskType(parsed.data.taskType)) {
      return NextResponse.json(
        { error: `Unbekannter taskType "${parsed.data.taskType}".` },
        { status: 400 }
      );
    }
    const taskPayload = parsed.data.taskType === "recall" ? null : parsed.data.payload;
    const payloadCheck = TASK_REGISTRY[parsed.data.taskType].payloadSchema.safeParse(taskPayload);
    if (!payloadCheck.success) {
      return NextResponse.json(
        { error: `Payload verletzt ${parsed.data.taskType}-Schema.`, issues: payloadCheck.error.issues },
        { status: 400 }
      );
    }
    data.taskType = parsed.data.taskType;
    // Geparste (normalisierte) Daten speichern, nicht den Rohtext.
    data.payload =
      taskPayload === null ? Prisma.JsonNull : (payloadCheck.data as Prisma.InputJsonValue);
  } else if (parsed.data.payload !== undefined) {
    // Payload ohne Typwechsel: gegen den bestehenden Typ validieren.
    const current = await prisma.question.findUnique({
      where: { id: params.id },
      select: { taskType: true },
    });
    const type = current?.taskType;
    if (!type || !isTaskType(type)) {
      return NextResponse.json(
        { error: "Bestehender taskType unbekannt – taskType mitgeben." },
        { status: 400 }
      );
    }
    const payloadCheck = TASK_REGISTRY[type].payloadSchema.safeParse(parsed.data.payload);
    if (!payloadCheck.success) {
      return NextResponse.json(
        { error: `Payload verletzt ${type}-Schema.`, issues: payloadCheck.error.issues },
        { status: 400 }
      );
    }
    data.payload =
      parsed.data.payload === null
        ? Prisma.JsonNull
        : (payloadCheck.data as Prisma.InputJsonValue);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren." }, { status: 400 });
  }

  await prisma.question.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const existing = await loadQuestionWithCourse(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }
  if (!canEditQuestion(guard.user, existing)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
