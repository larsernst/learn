import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMatureThresholdDays } from "@/lib/settings";
import Link from "next/link";
import { KursNav } from "./kurs-nav";
import { resolveCourse } from "./resolve-course";

export default async function CourseOverviewPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId);
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
    <div className="page" style={{ paddingTop: 64 }}>
      <p className="muted">
        <Link href="/" className="muted">
          ← Alle Kurse
        </Link>
      </p>
      <h1 style={{ marginTop: 8 }}>{course.title}</h1>
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
            <div className="card" key={c.chapter}>
              <div className="row row--between">
                <strong>
                  Kapitel {c.chapter} · {c.chapterTitle}
                </strong>
                <span className="badge badge--muted">
                  {c.learned}/{c.total}
                </span>
              </div>
              <div className="progress" style={{ marginTop: 12 }}>
                <div className="progress__bar" style={{ width: `${cpct}%` }} />
              </div>
              <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
                {cpct}% gelernt
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "brand" | "warn" | "success";
}) {
  const cls = accent === "brand" ? "card card--brand" : "card";
  return (
    <div className={cls}>
      <p
        className="eyebrow"
        style={accent === "brand" ? { color: "rgba(255,255,255,0.8)" } : undefined}
      >
        {label}
      </p>
      <p style={{ fontSize: 32, fontWeight: 600, margin: 0 }}>{value}</p>
      {sub && (
        <p
          className="muted"
          style={{ fontSize: 14, marginTop: 4, ...(accent === "brand" ? { color: "rgba(255,255,255,0.85)" } : {}) }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
