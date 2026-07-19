import { notFound } from "next/navigation";
import Link from "next/link";
import { requireEditorPage } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { prisma } from "@/lib/prisma";
import CourseSettingsClient from "./course-settings-client";

export default async function EditorKursEinstellungenPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireEditorPage();

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      ownerId: true,
      _count: { select: { questions: true } },
    },
  });

  if (!course || !canEditCourse(user, course)) {
    notFound();
  }

  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">
        <Link href="/editor" style={{ color: "inherit", textDecoration: "none" }}>
          Editor
        </Link>{" "}
        ·{" "}
        <Link
          href={`/editor/kurs/${course.id}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {course.title}
        </Link>{" "}
        · Einstellungen
      </p>
      <h1>Kurs-Einstellungen</h1>
      <CourseSettingsClient
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          status: course.status === "published" ? "published" : "draft",
          questionCount: course._count.questions,
        }}
      />
    </div>
  );
}
