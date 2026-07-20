// Integrations-Tests für Kurs-Transfer (Phase E4): duplicateCourse und
// applyCourseImport gegen eine echte Datenbank (Kapitel-Mapping,
// ID-Neuvergabe, Fortschritt bleibt am Original).

import { beforeAll, beforeEach, afterAll, describe, expect, test } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";
import { applyCourseImport, duplicateCourse, parseCourseImport } from "../../src/lib/course-transfer";

const dbUrl = integrationDbUrl();
const dbOk = dbUrl !== null && (await ensureIntegrationDb(dbUrl));
const prisma = dbOk ? prismaFor(dbUrl!) : (null as never);

async function seedCourseWithContent() {
  await prisma.user.create({
    data: {
      id: "it-owner",
      email: "it-owner@example.com",
      name: "Owner",
      passwordHash: "x",
    },
  });
  await prisma.course.create({
    data: {
      id: "it-src",
      slug: "it-src",
      title: "Quellkurs",
      description: "Beschreibung",
      order: 1,
      status: "published",
      ownerId: "it-owner",
    },
  });
  await prisma.chapter.create({
    data: { id: "it-ch-1", courseId: "it-src", slug: "kap-1", title: "Kapitel 1", order: 1 },
  });
  await prisma.question.create({
    data: {
      id: "it-q-1",
      courseId: "it-src",
      chapterId: "it-ch-1",
      chapter: 1,
      chapterTitle: "Kapitel 1",
      question: "Frage 1?",
      answer: "Antwort 1.",
      sourceRef: "it",
      taskType: "mcq",
      payload: { options: [{ id: "o1", text: "A", correct: true }, { id: "o2", text: "B", correct: false }] },
      order: 1,
    },
  });
  await prisma.review.create({
    data: {
      userId: "it-owner",
      questionId: "it-q-1",
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: new Date(),
    },
  });
}

describe.skipIf(!dbOk)("course-transfer (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    await seedCourseWithContent();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("duplicateCourse: kopiert Kurs/Kapitel/Fragen mit neuen IDs, ohne Fortschritt", async () => {
    const copy = await duplicateCourse(prisma, "it-src", "it-owner");
    expect(copy).not.toBeNull();

    const copyCourse = await prisma.course.findUniqueOrThrow({
      where: { id: copy!.id },
      include: { chapters: true, questions: true },
    });
    expect(copyCourse.status).toBe("draft");
    expect(copyCourse.title).toBe("Quellkurs (Kopie)");
    expect(copyCourse.slug).not.toBe("it-src");
    expect(copyCourse.chapters).toHaveLength(1);
    expect(copyCourse.chapters[0].id).not.toBe("it-ch-1");
    expect(copyCourse.questions).toHaveLength(1);
    // Frage hängt am NEUEN Kapitel, nicht am alten
    expect(copyCourse.questions[0].chapterId).toBe(copyCourse.chapters[0].id);
    expect(copyCourse.questions[0].taskType).toBe("mcq");
    // Fortschritt wurde nicht kopiert
    expect(await prisma.review.count({ where: { questionId: copyCourse.questions[0].id } })).toBe(0);
  });

  test("applyCourseImport: legt Kapitel per Slug an, upsertet Fragen idempotent", async () => {
    const parsed = parseCourseImport({
      questions: [
        {
          id: "imp-q-1",
          question: "Importfrage?",
          answer: "Antwort.",
          sourceRef: "imp.md",
          chapterSlug: "import-kapitel",
        },
        {
          id: "imp-q-2",
          question: "Zweite?",
          answer: "Antwort 2.",
          sourceRef: "imp.md",
          chapterSlug: "kap-1", // existiert bereits
        },
        {
          id: "imp-q-3",
          question: "Code-Aufgabe?",
          answer: "Hinweis.",
          sourceRef: "imp.md",
          chapterSlug: "kap-1",
          taskType: "code",
          payload: {
            languages: [{ languageId: 54, label: "C++ (G++)", starterCode: "// TODO" }],
            testCases: [
              { id: "t1", input: "1/2 + 3/4 =\n", expectedOutput: "Ergebnis: 5/4", hidden: false },
              { id: "t2", input: "", args: "a b c", expectedOutput: "3\n", hidden: true },
            ],
            comparison: { mode: "float", floatTolerance: 0.001 },
            referenceSolution: "int main() { return 0; }",
            timeLimitMs: 2000,
            memoryLimitKb: 262144,
          },
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const first = await applyCourseImport(prisma, "it-src", parsed.items);
    expect(first.created).toBe(3);
    expect(first.updated).toBe(0);
    expect(first.chaptersCreated).toBe(1); // "import-kapitel" neu

    const q1 = await prisma.question.findUniqueOrThrow({ where: { id: "imp-q-1" } });
    expect(q1.courseId).toBe("it-src");
    const newChapter = await prisma.chapter.findFirstOrThrow({
      where: { courseId: "it-src", slug: "import-kapitel" },
    });
    expect(q1.chapterId).toBe(newChapter.id);
    expect(q1.chapterTitle).toBe(newChapter.title);

    // Zweiter Lauf: update statt Duplikat, kein neues Kapitel
    const second = await applyCourseImport(prisma, "it-src", parsed.items);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(3);
    expect(second.chaptersCreated).toBe(0);
    expect(await prisma.question.count({ where: { courseId: "it-src" } })).toBe(4);

    // Code-Payload v2 überlebt den Import vollständig (comparison, args,
    // referenceSolution) und ist normalisiert (expectedOutput mit \n).
    const q3 = await prisma.question.findUniqueOrThrow({ where: { id: "imp-q-3" } });
    const p3 = q3.payload as {
      comparison: { mode: string; floatTolerance?: number };
      referenceSolution?: string;
      testCases: { id: string; args?: string; expectedOutput: string }[];
    };
    expect(q3.taskType).toBe("code");
    expect(p3.comparison).toEqual({ mode: "float", floatTolerance: 0.001 });
    expect(p3.referenceSolution).toBe("int main() { return 0; }");
    expect(p3.testCases[1].args).toBe("a b c");
    expect(p3.testCases[0].expectedOutput).toBe("Ergebnis: 5/4\n");
  });
});
