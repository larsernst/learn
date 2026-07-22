import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { intervalLabel } from "@/lib/sm2";
import { getMatureThresholdDays } from "@/lib/settings";
import Link from "next/link";
import { KursNav } from "../kurs-nav";
import { resolveCourse } from "../resolve-course";
import Stat from "@/components/stat";

type Status = "neu" | "faellig" | "gelernt" | "gefestigt";

function statusOf(
  review: {
    intervalDays: number;
    dueAt: Date;
  } | null,
  now: Date,
  matureThreshold: number
): Status {
  if (!review) return "neu";
  if (review.dueAt.getTime() <= now.getTime()) return "faellig";
  if (review.intervalDays >= matureThreshold) return "gefestigt";
  return "gelernt";
}

const STATUS_LABEL: Record<Status, string> = {
  neu: "Neu",
  faellig: "Fällig",
  gelernt: "Gelernt",
  gefestigt: "Gefestigt",
};

const STATUS_CLASS: Record<Status, string> = {
  neu: "badge badge--muted",
  faellig: "badge badge--warn",
  gelernt: "badge",
  gefestigt: "badge badge--success",
};

export default async function KatalogPage({
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
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
      select: {
      id: true,
      chapter: true,
      chapterTitle: true,
      question: true,
      taskType: true,
      confidence: true,
    },
  });

  const reviews = await prisma.review.findMany({
    where: { userId: user.sub, question: { courseId: course.id } },
    select: {
      questionId: true,
      intervalDays: true,
      lapses: true,
      dueAt: true,
      repetitions: true,
      easeFactor: true,
    },
  });
  const reviewMap = new Map(reviews.map((r) => [r.questionId, r]));

  const total = questions.length;
  const learned = reviews.length;
  const due = reviews.filter((r) => r.dueAt.getTime() <= now.getTime()).length;
  const matureThreshold = await getMatureThresholdDays();
  const mature = reviews.filter((r) => r.intervalDays >= matureThreshold).length;
  const totalLapses = reviews.reduce((s, r) => s + r.lapses, 0);
  const avgEase =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.easeFactor, 0) / reviews.length;

  // Nach Kapitel gruppieren.
  const byChapter = new Map<number, { chapter: number; chapterTitle: string; items: typeof questions }>();
  for (const q of questions) {
    const entry = byChapter.get(q.chapter) ?? {
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      items: [] as typeof questions,
    };
    entry.items.push(q);
    byChapter.set(q.chapter, entry);
  }
  const chapters = Array.from(byChapter.values()).sort((a, b) => a.chapter - b.chapter);

  return (
    <div className="page">
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">{course.title} · Fragenkatalog</p>
          <h1>Alle Fragen</h1>
        </div>
        <Link href={`/kurs/${course.id}/lernen`} className="btn btn--primary">
          Jetzt lernen
        </Link>
      </div>
      <KursNav courseId={course.id} />

      <div className="grid grid--4" style={{ marginTop: 24 }}>
        <Stat label="Fragen gesamt" value={total} />
        <Stat label="Gelernt" value={learned} accent="brand" />
        <Stat label="Fällig" value={due} accent="warn" />
        <Stat label="Gefestigt" value={mature} accent="success" />
      </div>

      <p className="muted text-sm" style={{ marginTop: 16 }}>
        Ø Ease-Faktor {avgEase.toFixed(2)} · {totalLapses} Versehen („Again") insgesamt
      </p>

      <div className="tabs" style={{ marginTop: 24 }}>
        {chapters.map((c) => (
          <a key={c.chapter} className="tab" href={`#kapitel-${c.chapter}`}>
            Kap. {c.chapter}
          </a>
        ))}
      </div>

      {chapters.map((c) => {
        const learnedInChapter = c.items.filter((q) => reviewMap.has(q.id)).length;
        const pct = Math.round((learnedInChapter / c.items.length) * 100);
        return (
          <section key={c.chapter} id={`kapitel-${c.chapter}`} style={{ marginTop: 32 }}>
            <div className="row row--between" style={{ flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>
                Kapitel {c.chapter} · {c.chapterTitle}
              </h2>
              <span className="badge badge--muted">
                {learnedInChapter}/{c.items.length} · {pct}%
              </span>
            </div>
            <div className="progress" style={{ marginTop: 12, marginBottom: 16 }}>
              <div className="progress__bar" style={{ width: `${pct}%` }} />
            </div>
            <ol className="katalog-list">
              {c.items.map((q) => {
                const r = reviewMap.get(q.id) ?? null;
                const status = statusOf(
                  r ? { intervalDays: r.intervalDays, dueAt: r.dueAt } : null,
                  now,
                  matureThreshold
                );
                const isMcq = q.taskType === "mcq";
                return (
                  <li key={q.id} className="katalog-item">
                    <Link href={`/kurs/${course.id}/katalog/${q.id}`} className="katalog-item__main">
                      <span className="katalog-item__q">{q.question}</span>
                      <span className="katalog-item__meta">
                        {isMcq ? "Multiple-Choice" : "Freie Erinnerung"}
                        {r ? ` · ${r.repetitions}× wiederholt · ${r.lapses}× falsch` : ""}
                        {r ? ` · fällig ${intervalLabel(r.intervalDays)}` : ""}
                      </span>
                    </Link>
                    <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
                    {q.confidence === "low" && (
                      <span className="badge badge--warn" title="Diese Antwort basiert auf duennem Vorlesungsskript und sollte nochmal geprueft werden.">
                        prüfen
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
