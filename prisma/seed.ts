import { PrismaClient } from "@prisma/client";
import { FRAGENKATALOG } from "./seed-data/fragenkatalog";
import { COURSES } from "./seed-data/courses";

const prisma = new PrismaClient();

const DEFAULT_COURSE_ID = "betriebssysteme";

async function main() {
  console.log(`Seede ${COURSES.length} Kurse …`);
  for (const c of COURSES) {
    await prisma.course.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        order: c.order,
        published: c.published,
      },
      update: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        order: c.order,
        published: c.published,
      },
    });
  }

  console.log(`Seede ${FRAGENKATALOG.length} Fragen aus dem Fragenkatalog …`);

  for (const q of FRAGENKATALOG) {
    const courseId = q.courseId ?? DEFAULT_COURSE_ID;
    await prisma.question.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        courseId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? null,
        confidence: q.confidence ?? null,
      },
      update: {
        courseId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? null,
        confidence: q.confidence ?? null,
      },
    });
  }

  const count = await prisma.question.count();
  console.log(`Seed abgeschlossen. ${count} Fragen in der Datenbank.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
