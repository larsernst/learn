import { requireEditorPage, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KurseClient from "./kurse-client";

export default async function AdminKursePage() {
  const user = await requireEditorPage();
  const admin = isAdmin(user);

  // Admins sehen alle Kurse, Editoren nur eigene.
  const courses = await prisma.course.findMany({
    where: admin ? {} : { ownerId: user.sub },
    orderBy: [{ order: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      ownerId: true,
      questions: {
        orderBy: [{ chapter: "asc" }, { id: "asc" }],
        select: {
          id: true,
          chapter: true,
          chapterTitle: true,
          question: true,
          answer: true,
          sourceRef: true,
          confidence: true,
          mcqOptions: true,
        },
      },
    },
  });

  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Verwaltung</p>
      <h1>{admin ? "Kurse" : "Meine Kurse"}</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {admin && <a className="navlink" href="/admin">Fragen</a>}
        <a className="navlink" href="/admin/kurse" style={{ fontWeight: 600 }}>Kurse</a>
        {admin && <a className="navlink" href="/admin/nutzer">Nutzer</a>}
        {admin && <a className="navlink" href="/admin/einstellungen">Einstellungen</a>}
      </div>
      <KurseClient
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          status: c.status,
          canEdit: admin || c.ownerId === user.sub,
          questions: c.questions.map((q) => ({
            id: q.id,
            chapter: q.chapter,
            chapterTitle: q.chapterTitle,
            question: q.question,
            answer: q.answer,
            sourceRef: q.sourceRef,
            confidence: q.confidence,
            mcqOptions: q.mcqOptions as
              | { id: string; text: string; correct: boolean }[]
              | null,
          })),
        }))}
        canCreate={true}
      />
    </div>
  );
}
