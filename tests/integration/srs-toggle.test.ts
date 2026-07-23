// Integrations-Tests für den Kurs-Schalter "srsEnabled" (Migration 0017) und
// den Einzel-Fragen-Modus von GET /api/review/next:
// - Review-Endpunkte sperren Kurse mit deaktiviertem Spaced Repetition (403).
// - ?question=<id> liefert gezielt eine Frage (Einzel-Lernen aus dem Katalog).
// Session ist gemockt, DB ist echt (Suite skippt ohne erreichbare DB).

import { beforeAll, beforeEach, afterAll, describe, expect, test, vi } from "vitest";
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

vi.mock("@/lib/prisma", () => ({ prisma: prismaFor(integrationDbUrl() ?? "postgresql://x:x@localhost:1/x") }));

const getCurrentUserMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

// Import NACH den Mocks.
const { GET } = await import("@/app/api/review/next/route");
const { POST } = await import("@/app/api/review/submit/route");

function nextReq(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return new Request(`http://localhost/api/review/next?${qs}`);
}

function submitReq(body: unknown) {
  return new Request("http://localhost/api/review/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createUser(id: string) {
  return prisma.user.create({
    data: { id, name: "SRS", email: `${id}@it.test`, passwordHash: "x" },
  });
}

async function createCourse(id: string, srsEnabled: boolean) {
  return prisma.course.create({
    data: { id, slug: id, title: id, description: "", order: 1, status: "published", srsEnabled },
  });
}

async function createQuestion(id: string, courseId: string) {
  return prisma.question.create({
    data: {
      id,
      courseId,
      chapter: 1,
      chapterTitle: "K",
      question: "Q",
      answer: "A",
      sourceRef: "it",
      taskType: "recall",
    },
  });
}

function login(user: { id: string; email: string; name: string }) {
  getCurrentUserMock.mockResolvedValue({ sub: user.id, email: user.email, name: user.name, roles: [] });
}

describe.skipIf(!dbOk)("srsEnabled-Schalter + Einzel-Fragen-Modus (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    getCurrentUserMock.mockReset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("review/next: 403 für Kurs mit deaktiviertem SR", async () => {
    const u = await createUser("srs-u1");
    await createCourse("srs-off", false);
    await createQuestion("srs-q1", "srs-off");
    login(u);
    const res = await GET(nextReq({ courseId: "srs-off" }));
    expect(res.status).toBe(403);
  });

  test("review/next: kursübergreifend ohne courseId ignoriert deaktivierte Kurse", async () => {
    const u = await createUser("srs-u2");
    await createCourse("srs-off-2", false);
    await createCourse("srs-on-2", true);
    await createQuestion("srs-q-off", "srs-off-2");
    await createQuestion("srs-q-on", "srs-on-2");
    login(u);
    const res = await GET(nextReq({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.review?.question?.id).toBe("srs-q-on");
  });

  test("review/next?question= liefert gezielt eine Frage (isNew=true)", async () => {
    const u = await createUser("srs-u3");
    await createCourse("srs-on-3", true);
    await createQuestion("srs-q-single", "srs-on-3");
    login(u);
    const res = await GET(nextReq({ courseId: "srs-on-3", question: "srs-q-single" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.review.question.id).toBe("srs-q-single");
    expect(json.isNew).toBe(true);
  });

  test("review/next?question= meldet gelernte Frage als isNew=false", async () => {
    const u = await createUser("srs-u4");
    await createCourse("srs-on-4", true);
    await createQuestion("srs-q-learned", "srs-on-4");
    await prisma.review.create({
      data: { userId: u.id, questionId: "srs-q-learned" },
    });
    login(u);
    const res = await GET(nextReq({ courseId: "srs-on-4", question: "srs-q-learned" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isNew).toBe(false);
  });

  test("review/next?question= 404 bei fremdem Kurs oder deaktiviertem SR", async () => {
    const u = await createUser("srs-u5");
    await createCourse("srs-on-5", true);
    await createCourse("srs-off-5", false);
    await createQuestion("srs-q-a", "srs-on-5");
    await createQuestion("srs-q-b", "srs-off-5");
    login(u);
    const wrongCourse = await GET(nextReq({ courseId: "srs-off-5", question: "srs-q-a" }));
    expect(wrongCourse.status).toBe(403);
    const disabled = await GET(nextReq({ courseId: "srs-off-5", question: "srs-q-b" }));
    expect(disabled.status).toBe(403);
    const unknown = await GET(nextReq({ courseId: "srs-on-5", question: "gibts-nicht" }));
    expect(unknown.status).toBe(404);
  });

  test("review/submit: 403 für Frage aus Kurs mit deaktiviertem SR", async () => {
    const u = await createUser("srs-u6");
    await createCourse("srs-off-6", false);
    await createQuestion("srs-q6", "srs-off-6");
    login(u);
    const res = await POST(
      submitReq({ questionId: "srs-q6", taskType: "recall", grade: "good", isNew: true })
    );
    expect(res.status).toBe(403);
    const count = await prisma.review.count({ where: { questionId: "srs-q6" } });
    expect(count).toBe(0);
  });

  test("review/submit: erlaubt bei aktiviertem SR (SM-2-Review wird angelegt)", async () => {
    const u = await createUser("srs-u7");
    await createCourse("srs-on-7", true);
    await createQuestion("srs-q7", "srs-on-7");
    login(u);
    const res = await POST(
      submitReq({ questionId: "srs-q7", taskType: "recall", grade: "good", isNew: true })
    );
    expect(res.status).toBe(200);
    const review = await prisma.review.findUnique({
      where: { userId_questionId: { userId: u.id, questionId: "srs-q7" } },
    });
    expect(review).not.toBeNull();
  });
});
