import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { applySm2, SM2_DEFAULTS } from "@/lib/sm2";
import { reviewSubmitSchema } from "@/lib/validation";
import { resolveReviewGrade } from "@/lib/review-grade";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const parsed = reviewSubmitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const body = parsed.data;
  const { questionId, isNew } = body;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }

  const { resolvedGrade, correct, correctOptionIds } = resolveReviewGrade(
    { taskType: question.taskType, payload: question.payload },
    body
  );

  const existing = await prisma.review.findUnique({
    where: { userId_questionId: { userId: user.sub, questionId } },
  });

  const prevState = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
        lapses: existing.lapses,
        dueAt: existing.dueAt,
        lastReviewedAt: existing.lastReviewedAt,
      }
    : {
        easeFactor: SM2_DEFAULTS.easeFactor,
        intervalDays: SM2_DEFAULTS.intervalDays,
        repetitions: SM2_DEFAULTS.repetitions,
        lapses: SM2_DEFAULTS.lapses,
        dueAt: new Date(),
        lastReviewedAt: null,
      };

  const next = applySm2(prevState, resolvedGrade, new Date());

  const updated = await prisma.review.upsert({
    where: { userId_questionId: { userId: user.sub, questionId } },
    create: {
      userId: user.sub,
      questionId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
    },
    update: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
    },
  });

  await prisma.reviewEvent.create({
    data: {
      userId: user.sub,
      questionId,
      grade: resolvedGrade,
      correct,
    },
  });

  return NextResponse.json({
    ok: true,
    review: updated,
    isNew: isNew ?? !existing,
    taskType: body.taskType,
    correct,
    correctOptionIds,
    nextDue: next.dueAt,
    intervalDays: next.intervalDays,
  });
}
