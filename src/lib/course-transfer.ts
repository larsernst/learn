// Kurs-Transfer (Phase E4): Export-Serializer, Import-Parser (beide rein
// testbar) und DB-gekoppelte Anwendung (Duplicate/Import-Write).

import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { isTaskType, TASK_REGISTRY } from "@/lib/tasks/registry";
import { slugify } from "@/lib/slug";

// ── Export ────────────────────────────────────────────────────────────

export type CourseExportChapter = {
  slug: string;
  title: string;
  description: string | null;
  order: number;
};

export type CourseExportQuestion = {
  id: string;
  chapter: number;
  chapterTitle: string;
  chapterSlug: string | null;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: string | null;
  taskType: string | null;
  payload: unknown;
  order: number;
};

export type CourseExport = {
  format: "lernapp-course@1";
  exportedAt: string;
  course: {
    title: string;
    slug: string;
    description: string;
  };
  chapters: CourseExportChapter[];
  questions: CourseExportQuestion[];
};

// ── Import-Parser (rein) ──────────────────────────────────────────────

const importQuestionSchema = z.object({
  id: z.string().min(1).optional(),
  chapter: z.number().int().min(1).optional(),
  chapterTitle: z.string().min(1).optional(),
  chapterSlug: z.string().min(1).optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
  sourceRef: z.string().min(1),
  confidence: z.enum(["high", "low"]).optional(),
  taskType: z.string().optional(),
  payload: z.unknown().optional(),
  mcqOptions: z
    .array(z.object({ id: z.string().min(1), text: z.string().min(1), correct: z.boolean() }))
    .optional(),
  order: z.number().int().optional(),
});

const importSchema = z.object({
  questions: z.array(importQuestionSchema).min(1),
});

export type ImportItem = {
  index: number;
  id: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: "high" | "low" | null;
  taskType: string;
  payload: unknown;
  chapterSlug: string | null;
  chapter: number;
  chapterTitle: string;
  order: number;
};

export type ImportParseResult =
  | { ok: true; items: ImportItem[] }
  | { ok: false; errors: { index: number; message: string }[] };

// Parst + validiert ein Import-JSON (Format des Kurs-Exports ODER der
// einfachen Fragen-Liste wie beim Admin-Upload). Liefert pro Eintrag
// Fehler statt beim ersten Problem abzubrechen (Dry-Run-Report).
export function parseCourseImport(raw: unknown): ImportParseResult {
  const body =
    raw !== null && typeof raw === "object" && Array.isArray((raw as { questions?: unknown }).questions)
      ? raw
      : { questions: raw };
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({
        index: typeof i.path[1] === "number" ? i.path[1] : -1,
        message: `${i.path.join(".")}: ${i.message}`,
      })),
    };
  }

  const errors: { index: number; message: string }[] = [];
  const items: ImportItem[] = [];
  const seenIds = new Set<string>();

  parsed.data.questions.forEach((q, index) => {
    // ID + Duplikat-Prüfung zuerst, damit auch ungültige Einträge ihre
    // IDs registrieren und Dubletten zuverlässig erkannt werden.
    const id = q.id ?? `import-${index + 1}`;
    if (seenIds.has(id)) {
      errors.push({ index, message: `Doppelte ID „${id}“ im Import.` });
      return;
    }
    seenIds.add(id);

    // taskType/payload wie im Seed: explizit gewinnt, sonst mcqOptions, sonst recall.
    let taskType = q.taskType ?? (q.mcqOptions ? "mcq" : "recall");
    let payload: unknown = q.payload;
    if (q.taskType === undefined && q.mcqOptions) {
      payload = { options: q.mcqOptions };
    }
    if (taskType === "recall") payload = null;

    if (!isTaskType(taskType)) {
      errors.push({ index, message: `Unbekannter taskType „${taskType}“.` });
      return;
    }
    const payloadCheck = TASK_REGISTRY[taskType].payloadSchema.safeParse(payload ?? null);
    if (!payloadCheck.success) {
      errors.push({
        index,
        message: `Payload verletzt ${taskType}-Schema: ${payloadCheck.error.issues[0]?.message ?? "ungültig"}`,
      });
      return;
    }

    items.push({
      index,
      id,
      question: q.question,
      answer: q.answer,
      sourceRef: q.sourceRef,
      confidence: q.confidence ?? null,
      taskType,
      // Geparste (normalisierte) Form speichern, nicht das Roheingabe-JSON.
      payload: payloadCheck.data ?? null,
      chapterSlug: q.chapterSlug ?? null,
      chapter: q.chapter ?? 1,
      chapterTitle: q.chapterTitle ?? "Importiert",
      order: q.order ?? index + 1,
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, items };
}

// ── Duplicate (DB) ────────────────────────────────────────────────────

// Kopiert Kurs + Kapitel + Fragen mit neuen IDs. Reviews/ReviewEvents
// werden bewusst NICHT kopiert (Nutzerfortschritt bleibt am Original).
export async function duplicateCourse(
  prisma: PrismaClient,
  courseId: string,
  newOwnerId: string
): Promise<{ id: string } | null> {
  const source = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: { orderBy: { order: "asc" } },
      questions: { orderBy: [{ chapter: "asc" }, { order: "asc" }] },
    },
  });
  if (!source) return null;

  const suffix = Date.now().toString(36);
  const newCourseId = `${source.id}-kopie-${suffix}`;
  let slug = `${source.slug}-kopie`;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug }, select: { id: true } })) {
    n++;
    slug = `${source.slug}-kopie-${n}`;
  }

  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });

  const chapterIdMap = new Map<string, string>();
  await prisma.course.create({
    data: {
      id: newCourseId,
      slug,
      title: `${source.title} (Kopie)`,
      description: source.description,
      order: (maxOrder._max.order ?? 0) + 1,
      status: "draft",
      ownerId: newOwnerId,
      chapters: {
        create: source.chapters.map((ch) => {
          const newId = `ch-${suffix}-${chapterIdMap.size + 1}`;
          chapterIdMap.set(ch.id, newId);
          return {
            id: newId,
            slug: ch.slug,
            title: ch.title,
            description: ch.description,
            order: ch.order,
          };
        }),
      },
    },
  });

  for (const q of source.questions) {
    await prisma.question.create({
      data: {
        id: `${q.id}-kopie-${suffix}`,
        courseId: newCourseId,
        chapterId: q.chapterId ? (chapterIdMap.get(q.chapterId) ?? null) : null,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        confidence: q.confidence,
        taskType: q.taskType,
        payload: q.payload === null ? undefined : (q.payload as object),
        order: q.order,
      },
    });
  }

  return { id: newCourseId };
}

// Import-Anwendung (DB): schreibt geparste Items in einen Kurs. Kapitel
// werden per Slug auf bestehende gemappt oder neu angelegt.
export async function applyCourseImport(
  prisma: PrismaClient,
  courseId: string,
  items: ImportItem[]
): Promise<{ created: number; updated: number; chaptersCreated: number }> {
  const existingChapters = await prisma.chapter.findMany({
    where: { courseId },
    select: { id: true, slug: true, title: true, order: true },
  });
  const bySlug = new Map(existingChapters.map((c) => [c.slug, c]));
  const byTitle = new Map(existingChapters.map((c) => [c.title, c]));
  let maxChapterOrder = existingChapters.reduce((m, c) => Math.max(m, c.order), 0);
  let chaptersCreated = 0;

  const chapterIdCache = new Map<string, string>();
  async function resolveChapter(item: ImportItem): Promise<string> {
    const slug = item.chapterSlug ?? slugify(item.chapterTitle) ?? "kapitel";
    const cached = chapterIdCache.get(slug);
    if (cached) return cached;
    const existing = bySlug.get(slug) ?? byTitle.get(item.chapterTitle);
    if (existing) {
      chapterIdCache.set(slug, existing.id);
      return existing.id;
    }
    const created = await prisma.chapter.create({
      data: {
        courseId,
        slug,
        title: item.chapterTitle,
        order: ++maxChapterOrder,
      },
    });
    chaptersCreated++;
    chapterIdCache.set(slug, created.id);
    return created.id;
  }

  const existingQuestionIds = new Set(
    (
      await prisma.question.findMany({
        where: { id: { in: items.map((i) => i.id) } },
        select: { id: true },
      })
    ).map((q) => q.id)
  );

  let created = 0;
  let updated = 0;
  for (const item of items) {
    const chapterId = await resolveChapter(item);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true, order: true },
    });
    await prisma.question.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        courseId,
        chapterId,
        chapter: chapter?.order ?? item.chapter,
        chapterTitle: chapter?.title ?? item.chapterTitle,
        question: item.question,
        answer: item.answer,
        sourceRef: item.sourceRef,
        confidence: item.confidence,
        taskType: item.taskType,
        payload: item.payload === null ? undefined : (item.payload as object),
        order: item.order,
      },
      update: {
        courseId,
        chapterId,
        chapter: chapter?.order ?? item.chapter,
        chapterTitle: chapter?.title ?? item.chapterTitle,
        question: item.question,
        answer: item.answer,
        sourceRef: item.sourceRef,
        confidence: item.confidence,
        taskType: item.taskType,
        payload: item.payload === null ? undefined : (item.payload as object),
        order: item.order,
      },
    });
    if (existingQuestionIds.has(item.id)) updated++;
    else created++;
  }
  return { created, updated, chaptersCreated };
}
