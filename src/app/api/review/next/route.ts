import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { serializeQuestion, type SerializableQuestion } from "@/lib/serialize";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = new URL(request.url);
  const difficultOnly = url.searchParams.get("deck") === "difficult";
  const courseId = url.searchParams.get("courseId") ?? undefined;
  const chapterParam = url.searchParams.get("chapter");
  const chapter = chapterParam && /^\d+$/.test(chapterParam) ? Number(chapterParam) : undefined;
  const reviewLearned = url.searchParams.get("review") === "learned";
  const now = new Date();

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true, newQuestionsFirst: true },
  });
  const mcqEnabled = me?.mcqEnabled ?? true;
  const newQuestionsFirst = me?.newQuestionsFirst ?? true;

  const questionFilter: Record<string, unknown> = {};
  if (courseId) questionFilter.courseId = courseId;
  if (chapter !== undefined) questionFilter.chapter = chapter;
  const courseFilter = Object.keys(questionFilter).length > 0 ? { question: questionFilter } : undefined;

  if (reviewLearned) {
    const learnedReviews = await prisma.review.findMany({
      where: {
        userId: user.sub,
        ...(courseFilter ?? {}),
      },
      include: { question: true },
      orderBy: [{ lastReviewedAt: "asc" }],
      take: 1,
    });
    if (learnedReviews.length > 0) {
      return NextResponse.json({
        review: {
          question: serializeQuestion(
            learnedReviews[0].question as SerializableQuestion,
            mcqEnabled
          ),
        },
        isNew: false,
        deck: difficultOnly ? "difficult" : "all",
      });
    }
    return NextResponse.json({ review: null, isNew: false, deck: difficultOnly ? "difficult" : "all" });
  }

  const dueReviews = await prisma.review.findMany({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      ...(difficultOnly ? { lapses: { gte: 1 } } : {}),
      ...(courseFilter ?? {}),
    },
    include: { question: true },
    orderBy: [{ dueAt: "asc" }, { lastReviewedAt: "asc" }],
    take: 1,
  });

  const dueFound = dueReviews.length > 0;

  const learnedQuestionIds = await prisma.review.findMany({
    where: { userId: user.sub },
    select: { questionId: true },
  });
  const learnedIds = new Set(learnedQuestionIds.map((r) => r.questionId));

  const allQuestions = await prisma.question.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
  });
  const nextNew = allQuestions.find(
    (q) => !learnedIds.has(q.id) && (chapter === undefined || q.chapter === chapter)
  );

  const dueResponse = dueFound
    ? {
        review: {
          question: serializeQuestion(
            dueReviews[0].question as SerializableQuestion,
            mcqEnabled
          ),
        },
        isNew: false,
        deck: difficultOnly ? ("difficult" as const) : ("all" as const),
      }
    : null;

  const newResponse = nextNew
    ? {
        review: {
          question: serializeQuestion(nextNew as SerializableQuestion, mcqEnabled),
        },
        isNew: true,
        deck: "all" as const,
      }
    : null;

  if (difficultOnly) {
    return NextResponse.json(dueResponse ?? { review: null, isNew: false, deck: "difficult" as const });
  }

  if (newQuestionsFirst) {
    return NextResponse.json(newResponse ?? dueResponse ?? { review: null, isNew: false, deck: "all" as const });
  }

  return NextResponse.json(dueResponse ?? newResponse ?? { review: null, isNew: false, deck: "all" as const });
}
