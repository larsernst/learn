// Integrations-Tests für prisma/seed.ts: Idempotenz des Upserts und
// Schema-Konformität des gesamten geseedeten Katalogs (inkl. der
// Legacy-Ableitung mcqOptions -> taskType/payload).

import { beforeAll, afterAll, describe, expect, test } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";
import { isTaskType, TASK_REGISTRY } from "../../src/lib/tasks/registry";

const dbUrl = integrationDbUrl();
const dbOk = dbUrl !== null && (await ensureIntegrationDb(dbUrl));
const prisma = dbOk ? prismaFor(dbUrl!) : (null as never);

describe.skipIf(!dbOk)("seed (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Seed lädt 2 Kurse, 11 Kapitel, 131 Fragen", async () => {
    const run = await runScript(["tsx", "prisma/seed.ts"], dbUrl!);
    expect(run.code).toBe(0);
    expect(await prisma.course.count()).toBe(2);
    expect(await prisma.chapter.count()).toBe(11);
    expect(await prisma.question.count()).toBe(131);
  });

  test("Seed ist idempotent (zweiter Lauf ändert keine Zählungen)", async () => {
    const run = await runScript(["tsx", "prisma/seed.ts"], dbUrl!);
    expect(run.code).toBe(0);
    expect(await prisma.course.count()).toBe(2);
    expect(await prisma.chapter.count()).toBe(11);
    expect(await prisma.question.count()).toBe(131);
  });

  test("jede geseedete Frage validiert gegen das Schema ihres Task-Typs", async () => {
    const questions = await prisma.question.findMany({
      select: { id: true, taskType: true, payload: true },
    });
    expect(questions.length).toBe(131);
    for (const q of questions) {
      expect(isTaskType(q.taskType), `${q.id}: unbekannter taskType`).toBe(true);
      if (!isTaskType(q.taskType)) continue;
      const parsed = TASK_REGISTRY[q.taskType].payloadSchema.safeParse(q.payload);
      expect(
        parsed.success,
        `${q.id}: payload verletzt ${q.taskType}-Schema: ${parsed.success ? "" : parsed.error.message}`
      ).toBe(true);
    }
  });

  test("MCQ-Fragen tragen payload.options mit korrekten Flags", async () => {
    const mcqCount = await prisma.question.count({
      where: { taskType: "mcq" },
    });
    expect(mcqCount).toBeGreaterThan(0);
    const sample = await prisma.question.findFirstOrThrow({
      where: { taskType: "mcq" },
      select: { payload: true },
    });
    const options = (sample.payload as { options: { correct: boolean }[] }).options;
    expect(options.some((o) => o.correct)).toBe(true);
    expect(options.some((o) => !o.correct)).toBe(true);
  });
});
