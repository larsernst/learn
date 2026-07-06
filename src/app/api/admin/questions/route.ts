import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { adminQuestionsBodySchema as bodySchema } from "@/lib/validation";

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
        mcqOptions: q.mcqOptions ?? Prisma.JsonNull,
        confidence: q.confidence ?? null,
      },
      update: {
        courseId: q.courseId ?? null,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? Prisma.JsonNull,
        confidence: q.confidence ?? null,
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
    },
  });
  return NextResponse.json({ questions });
}
