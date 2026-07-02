import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

const questionSchema = z.object({
  id: z.string().min(1),
  chapter: z.number().int().min(1),
  chapterTitle: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  sourceRef: z.string().min(1),
  confidence: z.enum(["high", "low"]).optional(),
  mcqOptions: z.array(mcqOptionSchema).optional(),
});

const bodySchema = z.object({
  questions: z.array(questionSchema).min(1),
});

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 16) return false;
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token && token === expected) return true;
  }
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken && queryToken === expected) return true;
  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

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
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? Prisma.JsonNull,
        confidence: q.confidence ?? null,
      },
      update: {
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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const questions = await prisma.question.findMany({
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
    select: {
      id: true,
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
