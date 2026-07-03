import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { serializeQuestion } from "@/lib/serialize";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = new URL(request.url);
  const difficultOnly = url.searchParams.get("deck") === "difficult";
  const courseId = url.searchParams.get("courseId") ?? undefined;
  const now = new Date();

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true },
  });
  const mcqEnabled = me?.mcqEnabled ?? true;

  const courseFilter = courseId ? { question: { courseId } } : undefined;

  const dueReviews = await prisma.review.findMany({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      ...(difficultOnly ? { lapses: { gte: 1 } } : {}),
      ...(courseFilter ?? {}),
    },
    include: { question: true },
    orderBy: [{ lapses: "desc" }, { dueAt: "asc" }],
    take: 1,
  });

  if (dueReviews.length > 0) {
    return NextResponse.json({
      review: { question: serializeQuestion(dueReviews[0].question, mcqEnabled) },
      isNew: false,
      deck: difficultOnly ? "difficult" : "all",
    });
  }

  if (difficultOnly) {
    return NextResponse.json({ review: null, isNew: false, deck: "difficult" });
  }

  const learnedQuestionIds = await prisma.review.findMany({
    where: { userId: user.sub },
    select: { questionId: true },
  });
  const learnedIds = new Set(learnedQuestionIds.map((r) => r.questionId));

  const allQuestions = await prisma.question.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
  });
  const nextNew = allQuestions.find((q) => !learnedIds.has(q.id));

  if (!nextNew) {
    return NextResponse.json({ review: null, isNew: false, deck: "all" });
  }

  return NextResponse.json({
    review: { question: serializeQuestion(nextNew, mcqEnabled) },
    isNew: true,
    deck: "all",
  });
}