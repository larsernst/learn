import { requireEditorPage, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditorDashboardClient from "./editor-dashboard-client";

export default async function EditorPage() {
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
      updatedAt: true,
      _count: { select: { questions: true, chapters: true } },
    },
  });

  return (
    <div className="page" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Editor</p>
      <h1>{admin ? "Alle Kurse" : "Meine Kurse"}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        Lege Kurse an, baue Kapitel und Fragen im Curriculum und veröffentliche
        sie für alle Lernenden.
      </p>
      <EditorDashboardClient
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          status: c.status,
          questionCount: c._count.questions,
          chapterCount: c._count.chapters,
          updatedAt: c.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
