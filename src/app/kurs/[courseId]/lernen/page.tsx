import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudyClient from "./study-client";
import { prisma } from "@/lib/prisma";
import { KursNav } from "../kurs-nav";
import { resolveCourse } from "../resolve-course";

export default async function LernenPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { deck?: string; chapter?: string };
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId, { viewer: user });

  const now = new Date();
  const deck = searchParams.deck === "difficult" ? "difficult" : "all";
  const chapterParam = searchParams.chapter;
  const chapter = chapterParam && /^\d+$/.test(chapterParam) ? Number(chapterParam) : undefined;
  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { simpleGrading: true },
  });

  const scopeFilter = {
    userId: user.sub,
    question: { courseId: course.id, ...(chapter !== undefined ? { chapter } : {}) },
  };

  const dueToday = await prisma.review.count({
    where: { ...scopeFilter, dueAt: { lte: now }, ...(deck === "difficult" ? { lapses: { gte: 1 } } : {}) },
  });
  const difficultDue = await prisma.review.count({
    where: { ...scopeFilter, dueAt: { lte: now }, lapses: { gte: 1 } },
  });
  const learnedAvailable = await prisma.review.count({ where: scopeFilter });

  const heading = deck === "difficult"
    ? "Schwierige Karten"
    : chapter !== undefined
      ? `Kapitel ${chapter} lernen`
      : "Heute wiederholen";

  return (
    <div className="page page--narrow">
      <p className="eyebrow">{course.title} · Lern-Sitzung</p>
      <h1>
        {heading}
        {dueToday > 0 ? `: ${dueToday} fällig` : ""}
      </h1>
      <KursNav courseId={course.id} />
      <div className="row" style={{ marginTop: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <a
          className={`tab${deck === "all" ? " tab--active" : ""}`}
          href={`/kurs/${course.id}/lernen${chapter !== undefined ? `?chapter=${chapter}` : ""}`}
        >
          Alle
        </a>
        <a
          className={`tab${deck === "difficult" ? " tab--active" : ""}`}
          href={`/kurs/${course.id}/lernen?deck=difficult${chapter !== undefined ? `&chapter=${chapter}` : ""}`}
        >
          Schwierig{difficultDue > 0 ? ` (${difficultDue})` : ""}
        </a>
      </div>
      <StudyClient
        deck={deck}
        courseId={course.id}
        simpleGrading={me?.simpleGrading ?? false}
        chapter={chapter}
        learnedAvailable={learnedAvailable}
      />
      <p className="muted text-sm desktop-only" style={{ marginTop: 16 }}>
        Tastatur: <strong>Leertaste/Enter</strong> = Aufdecken/Bestätigen ·{" "}
        <strong>{me?.simpleGrading ? "1–2" : "1–4"}</strong> ={" "}
        {me?.simpleGrading ? "Falsch/Richtig" : "Again/Hard/Good/Easy"} (Freie Erinnerung) ·{" "}
        <strong>1–n</strong> = Option togglen (MCQ)
      </p>
    </div>
  );
}
