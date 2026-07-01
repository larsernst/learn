import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const now = new Date();

  const dueReviews = await prisma.review.findMany({
    where: { userId: user.sub, dueAt: { lte: now } },
    include: { question: true },
    orderBy: [{ lapses: "desc" }, { dueAt: "asc" }],
    take: 1,
  });

  if (dueReviews.length > 0) {
    return NextResponse.json({ review: dueReviews[0], isNew: false });
  }

  const learnedQuestionIds = await prisma.review.findMany({
    where: { userId: user.sub },
    select: { questionId: true },
  });
  const learnedIds = new Set(learnedQuestionIds.map((r) => r.questionId));

  const allQuestions = await prisma.question.findMany({ orderBy: [{ chapter: "asc" }, { id: "asc" }] });
  const nextNew = allQuestions.find((q) => !learnedIds.has(q.id));

  if (!nextNew) {
    return NextResponse.json({ review: null, isNew: false });
  }

  return NextResponse.json({ review: { question: nextNew }, isNew: true });
}