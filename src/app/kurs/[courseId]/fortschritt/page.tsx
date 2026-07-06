import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMatureThresholdDays } from "@/lib/settings";
import ProgressClient from "./progress-client";
import { KursNav } from "../kurs-nav";
import { resolveCourse } from "../resolve-course";

export default async function FortschrittPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId);

  const now = new Date();

  const total = await prisma.question.count({ where: { courseId: course.id } });
  const reviews = await prisma.review.findMany({
    where: { userId: user.sub, question: { courseId: course.id } },
    select: {
      questionId: true,
      repetitions: true,
      lapses: true,
      intervalDays: true,
      dueAt: true,
      question: { select: { chapter: true, chapterTitle: true } },
    },
  });

  const learned = reviews.length;
  const dueToday = reviews.filter((r) => r.dueAt.getTime() <= now.getTime()).length;
  const matureThreshold = await getMatureThresholdDays();
  const mature = reviews.filter((r) => r.intervalDays >= matureThreshold).length;
  const totalLapses = reviews.reduce((s, r) => s + r.lapses, 0);

  const perChapterMap = new Map<number, { chapter: number; chapterTitle: string; total: number; learned: number }>();
  const allQ = await prisma.question.findMany({
    where: { courseId: course.id },
    select: { id: true, chapter: true, chapterTitle: true },
  });
  for (const q of allQ) {
    const entry = perChapterMap.get(q.chapter) ?? {
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      total: 0,
      learned: 0,
    };
    entry.total += 1;
    perChapterMap.set(q.chapter, entry);
  }
  const learnedIds = new Set(reviews.map((r) => r.questionId));
  for (const q of allQ) {
    if (learnedIds.has(q.id)) {
      perChapterMap.get(q.chapter)!.learned += 1;
    }
  }
  const perChapter = Array.from(perChapterMap.values()).sort((a, b) => a.chapter - b.chapter);

  return (
    <div className="page" style={{ paddingTop: 64 }}>
      <p className="eyebrow">{course.title} · Lernfortschritt</p>
      <h1>Dein Stand</h1>
      <KursNav courseId={course.id} />
      <div style={{ marginTop: 16 }}>
        <ProgressClient
          stats={{ total, learned, dueToday, mature, totalLapses }}
          perChapter={perChapter}
        />
      </div>
    </div>
  );
}
