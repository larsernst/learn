import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { gradeExamAttempt, type ExamAttempt } from "@/lib/exam";
import { applySm2, mcqGrade, SM2_DEFAULTS } from "@/lib/sm2";
import { examSubmitSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const parsed = examSubmitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { answers, saveToSm2 } = parsed.data;

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const questionsById = new Map(
    questions.map((q) => [
      q.id,
      {
        taskType: q.taskType,
        payload: q.payload,
      },
    ])
  );

  const result = gradeExamAttempt(answers as ExamAttempt[], questionsById);

  if (saveToSm2) {
    const existing = await prisma.review.findMany({
      where: { userId: user.sub, questionId: { in: questionIds } },
    });
    const existingMap = new Map(existing.map((r) => [r.questionId, r]));
    const now = new Date();

    for (const row of result.perQuestion) {
      const grade = mcqGrade(row.correct);
      const prev = existingMap.get(row.questionId);
      const prevState = prev
        ? {
            easeFactor: prev.easeFactor,
            intervalDays: prev.intervalDays,
            repetitions: prev.repetitions,
            lapses: prev.lapses,
            dueAt: prev.dueAt,
            lastReviewedAt: prev.lastReviewedAt,
          }
        : {
            easeFactor: SM2_DEFAULTS.easeFactor,
            intervalDays: SM2_DEFAULTS.intervalDays,
            repetitions: SM2_DEFAULTS.repetitions,
            lapses: SM2_DEFAULTS.lapses,
            dueAt: now,
            lastReviewedAt: null,
          };
      const next = applySm2(prevState, grade, now);

      await prisma.review.upsert({
        where: { userId_questionId: { userId: user.sub, questionId: row.questionId } },
        create: {
          userId: user.sub,
          questionId: row.questionId,
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
          questionId: row.questionId,
          grade,
          correct: row.correct,
        },
      });
    }
  }

  return NextResponse.json({
    ...result,
    savedToSm2: saveToSm2 === true,
  });
}
