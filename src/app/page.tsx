import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();
  const now = new Date();

  const courses = await prisma.course.findMany({
    where: { status: "published" },
    orderBy: { order: "asc" },
  });

  if (!user) {
    const totalQuestions = await prisma.question.count();
    return (
      <div className="page" style={{ paddingTop: "clamp(48px, 10vw, 96px)", paddingBottom: "clamp(48px, 10vw, 96px)" }}>
        <p className="eyebrow">Lern-Plattform · Fragenkataloge 2026</p>
        <h1>Mehrere Kurse. Ein Lernsystem.</h1>
        <p className="muted" style={{ maxWidth: 720, fontSize: "clamp(16px, 2.5vw, 20px)" }}>
          Wiederhole Prüfungsfragen aus verschiedenen Kursen mit Spaced Repetition
          (SM-2), verfolge deinen Fortschritt pro Kurs und Kapitel und merke dir,
          was du noch nicht konntest. Aktuell {totalQuestions} Fragen.
        </p>

        <div className="row" style={{ marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/registrieren" className="btn btn--primary">
            Konto erstellen
          </Link>
          <Link href="/login" className="btn btn--secondary">
            Anmelden
          </Link>
        </div>

        <div className="grid grid--3" style={{ marginTop: 64 }}>
          <div className="card">
            <span className="badge">SM-2</span>
            <h3>Spaced Repetition</h3>
            <p className="muted">
              Schwierige Karten häufiger, leichte seltener – so bleibt alles im
              Langzeitgedächtnis.
            </p>
          </div>
          <div className="card">
            <span className="badge">Pro Kurs &amp; Kapitel</span>
            <h3>Fortschritt verfolgen</h3>
            <p className="muted">
              Sieh auf einen Blick, wo du in jedem Kurs und Kapitel stehst.
            </p>
          </div>
          <div className="card">
            <span className="badge">Selbsteinschätzung</span>
            <h3>Freie Erinnerung &amp; MCQ</h3>
            <p className="muted">
              Antworte frei, decke die Musterlösung auf und bewerte dich selbst –
              oder übe Multiple-Choice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const courseIds = courses.map((c) => c.id);

  const questions = await prisma.question.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, courseId: true, chapter: true, chapterTitle: true },
  });
  const reviews = await prisma.review.findMany({
    where: { userId: user.sub, question: { courseId: { in: courseIds } } },
    select: { questionId: true, dueAt: true, intervalDays: true },
  });
  const learnedIds = new Set(reviews.map((r) => r.questionId));
  const dueTodayTotal = reviews.filter((r) => r.dueAt.getTime() <= now.getTime()).length;

  const coursesWithStats = courses.map((c) => {
    const cq = questions.filter((q) => q.courseId === c.id);
    const total = cq.length;
    const learned = cq.filter((q) => learnedIds.has(q.id)).length;
    const courseReviewIds = new Set(cq.map((q) => q.id));
    const dueToday = reviews.filter(
      (r) => courseReviewIds.has(r.questionId) && r.dueAt.getTime() <= now.getTime()
    ).length;

    const byChapter = new Map<number, { chapter: number; chapterTitle: string; total: number; learned: number }>();
    for (const q of cq) {
      const entry = byChapter.get(q.chapter) ?? {
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        total: 0,
        learned: 0,
      };
      entry.total += 1;
      byChapter.set(q.chapter, entry);
    }
    for (const q of cq) {
      if (learnedIds.has(q.id)) byChapter.get(q.chapter)!.learned += 1;
    }
    const chapters = Array.from(byChapter.values()).sort((a, b) => a.chapter - b.chapter);
    const pct = total === 0 ? 0 : Math.round((learned / total) * 100);
    return { course: c, total, learned, dueToday, pct, chapters };
  });

  return (
    <div className="page" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Übersicht</p>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Hallo, {user.name.split(" ")[0]}!</h1>
        {dueTodayTotal > 0 && (
          <span className="badge badge--warn">{dueTodayTotal} Frage(n) fällig</span>
        )}
      </div>

      {dueTodayTotal > 0 && (
        <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <Link
            href={`/kurs/${firstDueCourse(coursesWithStats)}/lernen`}
            className="btn btn--primary"
          >
            {dueTodayTotal} Fragen wiederholen
          </Link>
        </div>
      )}

      <h2 style={{ marginTop: 40 }}>Deine Kurse</h2>
      <div className="stack">
        {coursesWithStats.map(({ course, total, learned, dueToday, pct, chapters }) => (
          <div className="card" key={course.id} style={{ padding: 0 }}>
            <div style={{ padding: "24px 24px 16px" }}>
              <div className="row row--between" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    <Link
                      href={`/kurs/${course.id}`}
                      style={{ color: "var(--ds-ink)", textDecoration: "none" }}
                    >
                      {course.title}
                    </Link>
                  </h3>
                  <p className="muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
                    {course.description}
                  </p>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge--muted">{learned}/{total} gelernt</span>
                  {dueToday > 0 && <span className="badge badge--warn">{dueToday} fällig</span>}
                  <span className="badge">{pct}%</span>
                </div>
              </div>
              <div className="progress" style={{ marginTop: 16 }}>
                <div className="progress__bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
                <Link href={`/kurs/${course.id}/lernen`} className="btn btn--primary btn--sm">
                  {dueToday > 0 ? "Wiederholen" : "Lernen"}
                </Link>
                <Link href={`/kurs/${course.id}`} className="btn btn--secondary btn--sm">
                  Übersicht
                </Link>
                <Link href={`/kurs/${course.id}/katalog`} className="btn btn--ghost btn--sm">
                  Katalog
                </Link>
              </div>
            </div>

            {chapters.length > 0 && (
              <div
                className="grid grid--2"
                style={{ padding: "0 24px 24px", gap: 12 }}
              >
                {chapters.map((c) => {
                  const cpct = c.total === 0 ? 0 : Math.round((c.learned / c.total) * 100);
                  return (
                    <div
                      key={c.chapter}
                      style={{
                        border: "1px solid var(--ds-border)",
                        borderRadius: "var(--ds-radius)",
                        padding: 12,
                      }}
                    >
                      <div className="row row--between" style={{ gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          Kap. {c.chapter} · {c.chapterTitle}
                        </span>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {c.learned}/{c.total}
                        </span>
                      </div>
                      <div className="progress" style={{ marginTop: 8, height: 4 }}>
                        <div className="progress__bar" style={{ width: `${cpct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function firstDueCourse(
  courses: { course: { id: string }; dueToday: number }[]
): string {
  const withDue = courses.find((c) => c.dueToday > 0);
  return (withDue ?? courses[0]).course.id;
}
