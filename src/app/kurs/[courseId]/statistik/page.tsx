import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildHeatmap, buildLapsesLeaderboard, computeStreak, toDayKey } from "@/lib/stats";
import Link from "next/link";
import { KursNav } from "../kurs-nav";
import { resolveCourse } from "../resolve-course";
import Stat from "@/components/stat";

export default async function StatistikPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId, { viewer: user });

  const now = new Date();

  const [events, reviews, questions] = await Promise.all([
    prisma.reviewEvent.findMany({
      where: { userId: user.sub, question: { courseId: course.id } },
      select: { at: true, grade: true, correct: true },
      orderBy: { at: "asc" },
    }),
    prisma.review.findMany({
      where: { userId: user.sub, question: { courseId: course.id } },
      select: { questionId: true, lapses: true, repetitions: true, easeFactor: true, intervalDays: true },
    }),
    prisma.question.findMany({
      where: { courseId: course.id },
      select: { id: true, question: true, chapter: true, chapterTitle: true },
    }),
  ]);

  const streak = computeStreak(events, now);
  const heatmap = buildHeatmap(events, 84, now);
  const totalReviews = events.length;
  const againCount = events.filter((e) => e.grade === "again").length;
  const mcqCorrectCount = events.filter((e) => e.correct === true).length;
  const mcqTotal = events.filter((e) => e.correct !== null).length;
  const avgEase = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.easeFactor, 0) / reviews.length;

  const questionsMap = new Map(questions.map((q) => [q.id, q]));
  const leaderboard = buildLapsesLeaderboard(reviews, questionsMap);

  const maxCount = Math.max(1, ...heatmap.map((b) => b.count));
  const weeks: typeof heatmap[] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="page">
      <p className="eyebrow">{course.title} · Statistik</p>
      <h1>Deine Lern-Statistik</h1>
      <KursNav courseId={course.id} />

      <div className="grid grid--4" style={{ marginTop: 8 }}>
        <Stat label="Aktuelle Serie" value={`${streak} Tag${streak === 1 ? "" : "e"}`} accent="brand" />
        <Stat label="Wiederholungen gesamt" value={String(totalReviews)} />
        <Stat label="Ø Ease-Faktor" value={avgEase.toFixed(2)} />
        <Stat
          label="MCQ-Trefferquote"
          value={mcqTotal === 0 ? "–" : `${Math.round((mcqCorrectCount / mcqTotal) * 100)}%`}
        />
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>Aktivität (letzte 12 Wochen)</h2>
        <p className="muted text-sm">
          {againCount} „Again"-Bewertungen über alle Versuche.
        </p>
        <div className="heatmap" role="img" aria-label="Aktivität der letzten 12 Wochen">
          {weeks.map((week, wi) => (
            <div className="heatmap__week" key={wi}>
              {week.map((b) => {
                const intensity = b.count === 0 ? 0 : Math.ceil((b.count / maxCount) * 3);
                return (
                  <div
                    key={b.date}
                    className={intensity === 0 ? "heatmap__cell" : `heatmap__cell heatmap__cell--${intensity}`}
                    title={`${b.date}: ${b.count} Wiederholung(en)`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Schwierigste Fragen</h2>
        {leaderboard.length === 0 ? (
          <p className="muted">
            Noch keine schwierigen Karten – bewerte eine Frage mit „Again", um sie hier zu sehen.
          </p>
        ) : (
          <ol className="katalog-list">
            {leaderboard.map((row, i) => (
              <li key={row.questionId} className="katalog-item">
                <div className="katalog-item__main">
                  <span className="katalog-item__q">
                    {i + 1}. {row.question}
                  </span>
                  <span className="katalog-item__meta">
                    Kapitel {row.chapter} · {row.chapterTitle} · {row.repetitions}× wiederholt
                  </span>
                </div>
                <span className="badge badge--warn">{row.lapses}× falsch</span>
              </li>
            ))}
          </ol>
        )}
        <p style={{ marginTop: 16 }}>
          <Link href={`/kurs/${course.id}/lernen?deck=difficult`} className="btn btn--primary">
            Schwierige Karten üben
          </Link>
        </p>
      </section>
    </div>
  );
}
