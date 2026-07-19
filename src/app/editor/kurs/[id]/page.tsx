import { notFound } from "next/navigation";
import Link from "next/link";
import { requireEditorPage } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { prisma } from "@/lib/prisma";
import CurriculumClient from "./curriculum-client";

export default async function EditorKursPage({
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
      chapters: {
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true, description: true, order: true },
      },
      questions: {
        orderBy: [{ chapter: "asc" }, { order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          chapter: true,
          chapterTitle: true,
          chapterId: true,
          question: true,
          answer: true,
          sourceRef: true,
          confidence: true,
          taskType: true,
          payload: true,
          order: true,
        },
      },
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
        · Curriculum
      </p>
      <h1>{course.title}</h1>
      <CurriculumClient
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          status: course.status,
        }}
        chapters={course.chapters.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          order: c.order,
        }))}
        questions={course.questions.map((q) => ({
          id: q.id,
          chapter: q.chapter,
          chapterTitle: q.chapterTitle,
          chapterId: q.chapterId,
          question: q.question,
          answer: q.answer,
          sourceRef: q.sourceRef,
          confidence: q.confidence,
          taskType: q.taskType as string | null,
          payload: q.payload,
          order: q.order,
        }))}
        judge0Enabled={process.env.JUDGE0_ENABLED === "true"}
      />
    </div>
  );
}
