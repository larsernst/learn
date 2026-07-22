import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveCourse } from "../../resolve-course";
import { Markdown } from "@/components/markdown";

export default async function CramPage({
  params,
}: {
  params: { courseId: string; id: string };
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId, { viewer: user });

  const q = await prisma.question.findUnique({ where: { id: params.id } });
  if (!q || q.courseId !== course.id) notFound();

  return (
    <div className="page page--narrow">
      <p className="eyebrow">{course.title} · Vorschau (ohne Bewertung)</p>
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <h1>Kapitel {q.chapter} · {q.chapterTitle}</h1>
        <Link href={`/kurs/${course.id}/katalog`} className="btn btn--ghost">
          ← Zurück zum Katalog
        </Link>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <Markdown source={q.question} className="review-question" />
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Musterantwort</p>
        <Markdown source={q.answer} className="review-answer" />
      </div>

      <p className="muted text-sm" style={{ marginTop: 12 }}>
        Quelle: {q.sourceRef} · Diese Ansicht beeinflusst nicht deinen SM-2-Fortschritt.
      </p>

      <div className="row" style={{ marginTop: 16 }}>
        <Link href={`/kurs/${course.id}/lernen`} className="btn btn--primary">
          Jetzt lernen
        </Link>
        <Link href={`/kurs/${course.id}/pruefung`} className="btn btn--secondary">
          Prüfung proben
        </Link>
      </div>
    </div>
  );
}
