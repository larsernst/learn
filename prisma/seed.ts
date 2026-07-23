import { PrismaClient } from "@prisma/client";
import { FRAGENKATALOG } from "./seed-data/fragenkatalog";
import { COURSES } from "./seed-data/courses";
import { TASK_REGISTRY, isTaskType } from "../src/lib/tasks/registry";

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
        status: c.published ? "published" : "draft",
        srsEnabled: c.srsEnabled ?? true,
      },
      update: {},
    });
  }

  // Chapter aus courses.ts seeden (Migration 0011). Idempotent per (courseId, slug).
  const totalChapters = COURSES.reduce((n, c) => n + (c.chapters?.length ?? 0), 0);
  if (totalChapters > 0) {
    console.log(`Seede ${totalChapters} Kapitel …`);
    for (const c of COURSES) {
      for (const ch of c.chapters ?? []) {
        await prisma.chapter.upsert({
          where: { courseId_slug: { courseId: c.id, slug: ch.slug } },
          create: {
            courseId: c.id,
            slug: ch.slug,
            title: ch.title,
            description: ch.description ?? null,
            order: ch.order,
          },
          update: {},
        });
      }
    }
  }

  console.log(`Seede ${FRAGENKATALOG.length} Fragen aus dem Fragenkatalog …`);

  for (const q of FRAGENKATALOG) {
    const courseId = q.courseId ?? DEFAULT_COURSE_ID;
    // Neues taskType/payload-Modell (Migration 0010). Wenn der Katalog-Eintrag
    // taskType explizit setzt, gewinnt das; sonst Legacy-Ableitung aus mcqOptions.
    const hasMcq = Array.isArray(q.mcqOptions) && q.mcqOptions.length > 0;
    const taskType = q.taskType ?? (hasMcq ? "mcq" : "recall");
    const payload =
      q.taskType !== undefined && q.payload !== undefined
        ? q.payload
        : hasMcq
        ? { options: q.mcqOptions }
        : null;
    // Payload zur Laufzeit gegen das Zod-Schema des Task-Bundles validieren,
    // damit fehlerhafte Katalog-Einträge nicht unbemerkt in der DB landen.
    if (!isTaskType(taskType)) {
      throw new Error(`Frage ${q.id}: unbekannter taskType "${taskType}"`);
    }
    const parsed = TASK_REGISTRY[taskType].payloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(
        `Frage ${q.id}: ungültiges payload für taskType "${taskType}": ${parsed.error.message}`
      );
    }
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
        confidence: q.confidence ?? null,
        taskType,
        payload,
      },
      update: {
        courseId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        confidence: q.confidence ?? null,
        taskType,
        payload,
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
