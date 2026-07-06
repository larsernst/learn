import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getMatureThresholdDays } from "@/lib/settings";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? undefined;
  const where = courseId ? { courseId } : undefined;

  const now = new Date();

  const total = await prisma.question.count({ where });

  const reviews = await prisma.review.findMany({
    where: { userId: user.sub, question: where ? { courseId } : undefined },
    select: { questionId: true, repetitions: true, lapses: true, intervalDays: true, dueAt: true },
  });

  const learned = reviews.length;
  const dueToday = reviews.filter((r) => r.dueAt.getTime() <= now.getTime()).length;
  const matureThreshold = await getMatureThresholdDays();
  const mature = reviews.filter((r) => r.intervalDays >= matureThreshold).length;
  const totalLapses = reviews.reduce((sum, r) => sum + r.lapses, 0);

  const byChapterRaw = await prisma.question.groupBy({
    by: ["chapter", "chapterTitle"],
    where,
    _count: { _all: true },
    orderBy: { chapter: "asc" },
  });

  const learnedByChapter = await prisma.review.groupBy({
    by: ["questionId"],
    where: { userId: user.sub },
    _count: { _all: true },
  });
  const learnedIds = new Set(learnedByChapter.map((r) => r.questionId));

  const questionsByChapter = await prisma.question.findMany({
    where,
    select: { id: true, chapter: true, chapterTitle: true },
  });
  const perChapter = byChapterRaw.map((c) => {
    const totalInChapter = questionsByChapter.filter((q) => q.chapter === c.chapter).length;
    const learnedInChapter = questionsByChapter.filter(
      (q) => q.chapter === c.chapter && learnedIds.has(q.id)
    ).length;
    return {
      chapter: c.chapter,
      chapterTitle: c.chapterTitle,
      total: totalInChapter,
      learned: learnedInChapter,
    };
  });

  return NextResponse.json({
    total,
    learned,
    dueToday,
    mature,
    totalLapses,
    perChapter,
  });
}