import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { serializeQuestion, type SerializableQuestion } from "@/lib/serialize";
import { canViewCourse, courseVisibilityWhere } from "@/lib/course-access";

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

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true, ownerId: true },
    });
    if (!course || !canViewCourse(user, course)) {
      return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
    }
  }

  const visibility = courseId ? undefined : courseVisibilityWhere(user);

  const questionFilter: Record<string, unknown> = {};
  if (courseId) questionFilter.courseId = courseId;
  if (chapter !== undefined) questionFilter.chapter = chapter;
  if (!courseId) {
    const v = courseVisibilityWhere(user);
    if (v) questionFilter.course = v.course;
  }
  const reviewQuestionFilter =
    Object.keys(questionFilter).length > 0 ? { question: questionFilter } : undefined;

  const questionWhere: Record<string, unknown> = {};
  if (courseId) questionWhere.courseId = courseId;
  if (chapter !== undefined) questionWhere.chapter = chapter;
  if (!courseId) {
    const v = courseVisibilityWhere(user);
    if (v) questionWhere.course = v.course;
  }

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true, newQuestionsFirst: true },
  });
  const mcqEnabled = me?.mcqEnabled ?? true;
  const newQuestionsFirst = me?.newQuestionsFirst ?? true;

  if (reviewLearned) {
    const learnedReviews = await prisma.review.findMany({
      where: {
        userId: user.sub,
        ...(reviewQuestionFilter ?? {}),
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
      ...(reviewQuestionFilter ?? {}),
    },
    include: { question: true },
    orderBy: [{ dueAt: "asc" }, { lastReviewedAt: "asc" }],
    take: 1,
  });

  const dueFound = dueReviews.length > 0;

  const learnedQuestionIds = await prisma.review.findMany({
    where: { userId: user.sub, ...(reviewQuestionFilter ?? {}) },
    select: { questionId: true },
  });
  const learnedIds = new Set(learnedQuestionIds.map((r) => r.questionId));

  const allQuestions = await prisma.question.findMany({
    where: Object.keys(questionWhere).length > 0 ? questionWhere : undefined,
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
