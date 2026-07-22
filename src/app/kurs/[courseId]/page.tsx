import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMatureThresholdDays } from "@/lib/settings";
import Link from "next/link";
import { KursNav } from "./kurs-nav";
import { resolveCourse } from "./resolve-course";
import { CourseImage } from "@/components/course-image";
import Stat from "@/components/stat";

export default async function CourseOverviewPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId, { viewer: user });
  const now = new Date();

  const questions = await prisma.question.findMany({
    where: { courseId: course.id },
    select: { id: true, chapter: true, chapterTitle: true },
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
  });
  const reviews = await prisma.review.findMany({
    where: { userId: user.sub, question: { courseId: course.id } },
    select: { questionId: true, dueAt: true, intervalDays: true },
  });
  const learnedIds = new Set(reviews.map((r) => r.questionId));
  const dueToday = reviews.filter((r) => r.dueAt.getTime() <= now.getTime()).length;
  const matureThreshold = await getMatureThresholdDays();
  const mature = reviews.filter((r) => r.intervalDays >= matureThreshold).length;

  const total = questions.length;
  const learned = reviews.length;
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);

  const byChapter = new Map<number, { chapter: number; chapterTitle: string; total: number; learned: number }>();
  for (const q of questions) {
    const entry = byChapter.get(q.chapter) ?? {
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      total: 0,
      learned: 0,
    };
    entry.total += 1;
    byChapter.set(q.chapter, entry);
  }
  for (const q of questions) {
    if (learnedIds.has(q.id)) byChapter.get(q.chapter)!.learned += 1;
  }
  const chapters = Array.from(byChapter.values()).sort((a, b) => a.chapter - b.chapter);

  return (
    <div className="page">
      <p className="muted">
        <Link href="/" className="muted">
          ← Alle Kurse
        </Link>
      </p>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <CourseImage courseId={course.id} hasImage={course.imageMime !== null} title={course.title} height={180} />
      </div>
      <h1 style={{ marginTop: 8 }}>
        {course.title}
        {course.status === "draft" && (
          <span className="badge badge--warn" style={{ marginLeft: 12, verticalAlign: "middle" }}>
            Entwurf
          </span>
        )}
      </h1>
      <p className="muted" style={{ maxWidth: 720 }}>
        {course.description}
      </p>
      <KursNav courseId={course.id} />

      <div className="grid grid--4" style={{ marginTop: 24 }}>
        <Stat label="Fragen gesamt" value={total} />
        <Stat label="Gelernt" value={`${pct}%`} accent="brand" sub={`${learned}/${total}`} />
        <Stat label="Heute fällig" value={dueToday} accent="warn" />
        <Stat label="Gefestigt" value={mature} accent="success" />
      </div>

      <div className="row" style={{ marginTop: 24, flexWrap: "wrap" }}>
        <Link
          href={`/kurs/${course.id}/lernen`}
          className="btn btn--primary"
        >
          {dueToday > 0 ? `${dueToday} Fragen wiederholen` : "Jetzt lernen"}
        </Link>
        <Link href={`/kurs/${course.id}/pruefung`} className="btn btn--secondary">
          Prüfung proben
        </Link>
      </div>

      <h2 style={{ marginTop: 40 }}>Kapitel</h2>
      <div className="grid grid--2">
        {chapters.map((c) => {
          const cpct = c.total === 0 ? 0 : Math.round((c.learned / c.total) * 100);
          return (
            <div className="card chapter-card" key={c.chapter}>
              <div className="chapter-card__head">
                <div>
                  <span className="eyebrow">Kapitel {c.chapter}</span>
                  <h3 style={{ margin: "4px 0 0 0" }}>{c.chapterTitle}</h3>
                </div>
                <span className="badge badge--muted">
                  {c.learned}/{c.total}
                </span>
              </div>
              <div className="progress" style={{ marginTop: 16 }}>
                <div className="progress__bar" style={{ width: `${cpct}%` }} />
              </div>
              <div className="chapter-card__foot">
                <span className="muted text-sm">
                  {cpct}% gelernt
                </span>
                <Link
                  href={`/kurs/${course.id}/lernen?chapter=${c.chapter}`}
                  className="btn btn--secondary btn--sm"
                >
                  Kapitel lernen
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
