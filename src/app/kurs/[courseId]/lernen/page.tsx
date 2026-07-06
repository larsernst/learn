import { getCurrentUser } from "@/lib/session";
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
  searchParams: { deck?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId);

  const now = new Date();
  const deck = searchParams.deck === "difficult" ? "difficult" : "all";
  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { simpleGrading: true },
  });
  const dueToday = await prisma.review.count({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      question: { courseId: course.id },
      ...(deck === "difficult" ? { lapses: { gte: 1 } } : {}),
    },
  });
  const difficultDue = await prisma.review.count({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      question: { courseId: course.id },
      lapses: { gte: 1 },
    },
  });

  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">{course.title} · Lern-Sitzung</p>
      <h1>
        {deck === "difficult" ? "Schwierige Karten" : "Heute wiederholen"}
        {dueToday > 0 ? `: ${dueToday} fällig` : ""}
      </h1>
      <KursNav courseId={course.id} />
      <div className="row" style={{ marginTop: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <a
          className={`tab${deck === "all" ? " tab--active" : ""}`}
          href={`/kurs/${course.id}/lernen`}
        >
          Alle
        </a>
        <a
          className={`tab${deck === "difficult" ? " tab--active" : ""}`}
          href={`/kurs/${course.id}/lernen?deck=difficult`}
        >
          Schwierig{difficultDue > 0 ? ` (${difficultDue})` : ""}
        </a>
      </div>
      <StudyClient deck={deck} courseId={course.id} simpleGrading={me?.simpleGrading ?? false} />
      <p className="muted desktop-only" style={{ fontSize: 13, marginTop: 16 }}>
        Tastatur: <strong>Leertaste/Enter</strong> = Aufdecken/Bestätigen ·{" "}
        <strong>{me?.simpleGrading ? "1–2" : "1–4"}</strong> ={" "}
        {me?.simpleGrading ? "Falsch/Richtig" : "Again/Hard/Good/Easy"} (Freie Erinnerung) ·{" "}
        <strong>1–n</strong> = Option togglen (MCQ)
      </p>
    </div>
  );
}
