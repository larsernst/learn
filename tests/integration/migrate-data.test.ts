// Integrations-Tests für prisma/migrate-data.ts (Legacy-Datenabgleich).
// Schützt das entkoppelte Verhalten: auf frischen DBs darf kein Kurs
// entstehen, Bestandsfragen ohne Kurs werden dem Standardkurs zugewiesen
// und der Chapter-Backfill läuft unabhängig von Orphan-Fragen.

import { beforeAll, beforeEach, afterAll, describe, expect, test } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";

const dbUrl = integrationDbUrl();
const dbOk = dbUrl !== null && (await ensureIntegrationDb(dbUrl));
const prisma = dbOk ? prismaFor(dbUrl!) : (null as never);

describe.skipIf(!dbOk)("migrate-data (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("frische DB: kein Standardkurs wird angelegt", async () => {
    const run = await runScript(["tsx", "prisma/migrate-data.ts"], dbUrl!);
    expect(run.code).toBe(0);
    expect(run.output).toContain("Standardkurs wird nicht angelegt");
    expect(await prisma.course.count()).toBe(0);
  });

  test("Orphan-Frage: Standardkurs wird angelegt und zugewiesen, Chapter verknüpft", async () => {
    await prisma.question.create({
      data: {
        id: "it-orphan-1",
        courseId: null,
        chapter: 2,
        chapterTitle: "Prozesse und Threads",
        chapterId: null,
        question: "Bestandsfrage ohne Kurs?",
        answer: "Antwort.",
        sourceRef: "integration-test",
        taskType: "recall",
        payload: null as never,
      },
    });

    const run = await runScript(["tsx", "prisma/migrate-data.ts"], dbUrl!);
    expect(run.code).toBe(0);

    const course = await prisma.course.findUnique({
      where: { id: "betriebssysteme" },
    });
    expect(course).not.toBeNull();

    const question = await prisma.question.findUnique({
      where: { id: "it-orphan-1" },
    });
    expect(question?.courseId).toBe("betriebssysteme");

    // Chapter-Backfill hat Kapitel angelegt und die Frage verknüpft.
    const chapter = await prisma.chapter.findFirst({
      where: { courseId: "betriebssysteme", title: "Prozesse und Threads" },
    });
    expect(chapter).not.toBeNull();
    expect(question?.chapterId).toBe(chapter?.id);
  });

  test("Chapter-Backfill läuft auch ohne Orphan-Fragen (kein Early-Return)", async () => {
    await prisma.course.create({
      data: {
        id: "it-kurs",
        slug: "it-kurs",
        title: "Integrationstest-Kurs",
        description: "",
        order: 1,
        status: "published",
      },
    });
    await prisma.question.create({
      data: {
        id: "it-linked-1",
        courseId: "it-kurs",
        chapter: 1,
        chapterTitle: "Einführung",
        chapterId: null,
        question: "Frage mit Kurs, aber ohne Chapter-Verknüpfung?",
        answer: "Antwort.",
        sourceRef: "integration-test",
        taskType: "recall",
        payload: null as never,
      },
    });

    const run = await runScript(["tsx", "prisma/migrate-data.ts"], dbUrl!);
    expect(run.code).toBe(0);

    // Kein zusätzlicher Kurs entstanden …
    expect(await prisma.course.count()).toBe(1);
    // … aber das Kapitel wurde angelegt und verknüpft.
    const question = await prisma.question.findUnique({
      where: { id: "it-linked-1" },
    });
    expect(question?.chapterId).not.toBeNull();
  });
});
