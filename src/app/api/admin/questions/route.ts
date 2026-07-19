import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEditorApi, requireAdminApi, isAdmin } from "@/lib/auth";
import { adminQuestionsBodySchema as bodySchema } from "@/lib/validation";
import { normalizeQuestionTask } from "@/lib/tasks/registry";
import { canEditCourse } from "@/lib/course-access";
import { slugify } from "@/lib/slug";
import type { Course } from "@prisma/client";
import type { TaskType } from "@/lib/tasks/types";

const chapterKey = (courseId: string, chapter: number, title: string) =>
  `${courseId}:${chapter}:${slugify(title)}`;

async function ensureChapterId(courseId: string, chapter: number, title: string): Promise<string> {
  const slug = `${chapter}-${slugify(title)}`;
  const upserted = await prisma.chapter.upsert({
    where: { courseId_slug: { courseId, slug } },
    create: { courseId, slug, title, order: chapter },
    update: {},
  });
  return upserted.id;
}

// Prüft, ob der Nutzer die Frage mit der gegebenen courseId anlegen/ändern darf.
// null bedeutet "verwaiste Frage" und ist für Nicht-Admins verboten.
function assertCourseEditPermission(
  user: { sub: string; roles: string[] },
  courseId: string | null,
  courses: Map<string, Course>
): { ok: true } | { ok: false; response: NextResponse } {
  if (isAdmin(user)) return { ok: true };
  if (!courseId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Nur Admins dürfen verwaiste Fragen bearbeiten." },
        { status: 403 }
      ),
    };
  }
  const course = courses.get(courseId);
  if (!course) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 }),
    };
  }
  if (!canEditCourse(user, course)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Keine Berechtigung für diesen Kurs." }, { status: 403 }),
    };
  }
  return { ok: true };
}

// Wandelt ein validiertes Frage-Objekt (das sowohl das neue taskType/payload-
// als auch das legacy mcqOptions-Format haben kann) in die kanonische Form
// { taskType, payload, mcqOptionsLegacy } um. mcqOptionsLegacy wird für den
// Dual-Write beibehalten, bis die Cleanup-Migration die Spalte entfernt.
function toTaskFields(q: {
  taskType?: "recall" | "mcq" | "dragdrop" | "cloze" | "order" | "code";
  payload?: unknown;
  mcqOptions?: { id: string; text: string; correct: boolean }[];
}): { taskType: string; payload: unknown } {
  // recall: kein Payload.
  if (q.taskType === "recall") {
    return { taskType: "recall", payload: null };
  }
  // mcq: payload = { options }.
  if (q.taskType === "mcq") {
    const options = (q.payload as { options?: unknown[] } | undefined)?.options ?? [];
    return { taskType: "mcq", payload: { options } };
  }
  // dragdrop/cloze/order/code: neuer Typ mit autor-seitigem payload.
  if (
    q.taskType === "dragdrop" ||
    q.taskType === "cloze" ||
    q.taskType === "order" ||
    q.taskType === "code"
  ) {
    return { taskType: q.taskType, payload: q.payload ?? null };
  }
  // legacy: mcqOptions gesetzt (ohne taskType)
  if (q.mcqOptions !== undefined) {
    const normalized = normalizeQuestionTask("mcq", { options: q.mcqOptions }, q.mcqOptions);
    return {
      taskType: normalized.type,
      payload: normalized.payload,
    };
  }
  // default: recall
  return { taskType: "recall", payload: null };
}

export async function POST(request: Request) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const questionIds = parsed.data.questions.map((q) => q.id);
  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, courseId: true },
  });
  const existingById = new Map(existingQuestions.map((q) => [q.id, q]));

  const courseIds = new Set<string>();
  for (const q of parsed.data.questions) {
    if (q.courseId) courseIds.add(q.courseId);
    const existing = existingById.get(q.id);
    if (existing?.courseId) courseIds.add(existing.courseId);
  }
  const courses = new Map(
    (await prisma.course.findMany({ where: { id: { in: Array.from(courseIds) } } })).map((c) => [
      c.id,
      c,
    ])
  );

  for (const q of parsed.data.questions) {
    const existing = existingById.get(q.id);
    const targetCourseId = q.courseId ?? null;
    const sourceCourseId = existing?.courseId ?? null;

    // Quell-Prüfung nur für bestehende Fragen (Verschieben/Überschreiben).
    // Bei neuen Fragen gibt es keine Quelle – die Ziel-Prüfung genügt,
    // sonst könnten Editoren nie Fragen anlegen (null = "verwaist").
    if (existing) {
      const sourcePerm = assertCourseEditPermission(guard.user, sourceCourseId, courses);
      if (!sourcePerm.ok) return sourcePerm.response;
    }
    const targetPerm = assertCourseEditPermission(guard.user, targetCourseId, courses);
    if (!targetPerm.ok) return targetPerm.response;
  }

  const chapterIds = new Map<string, string>();
  const getChapterId = async (courseId: string, chapter: number, title: string): Promise<string> => {
    const key = chapterKey(courseId, chapter, title);
    const cached = chapterIds.get(key);
    if (cached) return cached;
    const id = await ensureChapterId(courseId, chapter, title);
    chapterIds.set(key, id);
    return id;
  };

  let created = 0;
  let updated = 0;
  for (const q of parsed.data.questions) {
    const exists = existingById.get(q.id);
    const taskFields = toTaskFields(q);
    const payloadValue = taskFields.payload ?? Prisma.JsonNull;
    const courseId = q.courseId ?? null;
    const chapterId = courseId
      ? await getChapterId(courseId, q.chapter, q.chapterTitle)
      : null;
    await prisma.question.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        courseId,
        chapterId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        confidence: q.confidence ?? null,
        taskType: taskFields.taskType,
        payload: payloadValue,
      },
      update: {
        courseId,
        chapterId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        confidence: q.confidence ?? null,
        taskType: taskFields.taskType,
        payload: payloadValue,
      },
    });
    if (exists) updated++;
    else created++;
  }

  return NextResponse.json({ ok: true, created, updated, total: parsed.data.questions.length });
}

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const questions = await prisma.question.findMany({
    orderBy: [{ chapter: "asc" }, { id: "asc" }],
    select: {
      id: true,
      courseId: true,
      chapter: true,
      chapterTitle: true,
      question: true,
      answer: true,
      sourceRef: true,
      confidence: true,
      taskType: true,
      payload: true,
    },
  });
  return NextResponse.json({ questions: questions as (typeof questions[number] & { taskType: TaskType | null })[] });
}
