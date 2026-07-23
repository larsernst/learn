import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { applySm2, mcqGrade, SM2_DEFAULTS } from "@/lib/sm2";
import { rateLimit } from "@/lib/rate-limit";
import { getJudge0Client } from "@/lib/judge0/config";
import { gradeCodeWithJudge0 } from "@/lib/judge0/grade";
import { checkCodeQuestionAccess } from "@/lib/judge0/request-guard";
import { codeAttemptSchema } from "@/lib/tasks/code/attempt";

const codeSubmitSchema = codeAttemptSchema.extend({
  questionId: z.string().min(1),
  isNew: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Rate-Limit pro User: max 5 Code-Submissions pro Minute (Judge0 ist teuer).
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`code-submit:${user.sub}:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele Code-Einreichungen. Bitte in einer Minute erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const client = getJudge0Client();
  if (!client) {
    return NextResponse.json(
      { error: "Code-Aufgaben sind auf diesem Server nicht aktiviert (JUDGE0_ENABLED=false)." },
      { status: 503 }
    );
  }

  const parsed = codeSubmitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { questionId, languageId, sourceCode, isNew } = parsed.data;

  const check = await checkCodeQuestionAccess(user, questionId, languageId, { requireSrs: true });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let gradeResult;
  try {
    gradeResult = await gradeCodeWithJudge0(
      check.payload,
      { languageId, sourceCode },
      client
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler.";
    return NextResponse.json(
      { error: `Bewertung fehlgeschlagen: ${msg}` },
      { status: 502 }
    );
  }

  const grade = mcqGrade(gradeResult.correct);

  // SM-2-Update wie beim normalen Review-Submit.
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
  const next = applySm2(prevState, grade, new Date());

  await prisma.review.upsert({
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
      grade,
      correct: gradeResult.correct,
    },
  });

  return NextResponse.json({
    ok: true,
    correct: gradeResult.correct,
    detail: gradeResult.detail,
    isNew: isNew ?? !existing,
    nextDue: next.dueAt,
    intervalDays: next.intervalDays,
  });
}
