// Integrations-Tests für POST /api/review/code-run (Probelauf):
// nur öffentliche Tests, kein SM-2/ReviewEvent – gegen echte DB,
// Session und Judge0-Client gemockt.

import { beforeAll, beforeEach, afterAll, describe, expect, test, vi } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";
import type { Judge0Result, Judge0Submission } from "@/lib/judge0/client";

process.env.DISABLE_RATE_LIMIT = "true";

const dbUrl = integrationDbUrl();
const dbOk = dbUrl !== null && (await ensureIntegrationDb(dbUrl));
const prisma = dbOk ? prismaFor(dbUrl!) : (null as never);

vi.mock("@/lib/prisma", () => ({ prisma: prismaFor(integrationDbUrl() ?? "postgresql://x:x@localhost:1/x") }));

const getCurrentUserMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

const getJudge0ClientMock = vi.fn();
vi.mock("@/lib/judge0/config", () => ({
  getJudge0Client: () => getJudge0ClientMock(),
}));

const { POST } = await import("@/app/api/review/code-run/route");

function req(body: unknown) {
  return new Request("http://localhost/api/review/code-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const CODE_PAYLOAD = {
  languages: [{ languageId: 54, label: "C++ (G++)", starterCode: "int main(){}" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42\n", hidden: false },
    { id: "t2", input: "5", expectedOutput: "25\n", hidden: true },
  ],
  comparison: { mode: "exact" },
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
};

async function fixtures(id: string) {
  const user = await prisma.user.create({
    data: { id, name: "Run", email: `${id}@it.test`, passwordHash: "x" },
  });
  await prisma.course.create({
    data: { id: `c-${id}`, slug: `c-${id}`, title: id, description: "", order: 1, status: "published" },
  });
  await prisma.question.create({
    data: {
      id: `q-${id}`,
      courseId: `c-${id}`,
      chapter: 1,
      chapterTitle: "K",
      question: "Q",
      answer: "A",
      sourceRef: "it",
      taskType: "code",
      payload: CODE_PAYLOAD,
    },
  });
  return user;
}

function sessionFor(u: { id: string; email: string; name: string }) {
  return { sub: u.id, email: u.email, name: u.name, roles: [] };
}

describe.skipIf(!dbOk)("api/review/code-run (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    getCurrentUserMock.mockReset();
    getJudge0ClientMock.mockReset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("401 ohne Login", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await POST(req({ questionId: "q", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(401);
  });

  test("503 wenn Judge0 deaktiviert", async () => {
    const u = await fixtures("r1");
    getCurrentUserMock.mockResolvedValue(sessionFor(u));
    getJudge0ClientMock.mockReturnValue(null);
    const res = await POST(req({ questionId: `q-r1`, languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(503);
  });

  test("nur öffentliche Tests werden ausgeführt; kein SM-2/ReviewEvent", async () => {
    const u = await fixtures("r2");
    getCurrentUserMock.mockResolvedValue(sessionFor(u));
    const submissions: Judge0Submission[] = [];
    getJudge0ClientMock.mockReturnValue({
      submit: async (s: Judge0Submission) => {
        submissions.push(s);
        const r: Judge0Result = { status: { id: 3, description: "Accepted" }, stdout: "42\n" };
        return r;
      },
    });

    const res = await POST(req({ questionId: "q-r2", languageId: 54, sourceCode: "int main(){}" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.graded).toBe("run");
    expect(body.allPassed).toBe(true);
    expect(body.detail.perTest).toHaveLength(1);
    expect(body.detail.perTest[0].id).toBe("t1");
    // Der versteckte Test t2 wurde NICHT an Judge0 geschickt.
    expect(submissions).toHaveLength(1);
    expect(submissions[0].stdin).toBe("");
    // Keine Bewertung persistiert.
    expect(await prisma.review.count()).toBe(0);
    expect(await prisma.reviewEvent.count()).toBe(0);
  });

  test("400 wenn die Aufgabe keine öffentlichen Tests hat", async () => {
    const u = await prisma.user.create({
      data: { id: "r3", name: "Run", email: "r3@it.test", passwordHash: "x" },
    });
    await prisma.course.create({
      data: { id: "c-r3", slug: "c-r3", title: "r3", description: "", order: 1, status: "published" },
    });
    await prisma.question.create({
      data: {
        id: "q-r3",
        courseId: "c-r3",
        chapter: 1,
        chapterTitle: "K",
        question: "Q",
        answer: "A",
        sourceRef: "it",
        taskType: "code",
        payload: {
          ...CODE_PAYLOAD,
          testCases: [{ id: "t1", input: "", expectedOutput: "42\n", hidden: true }],
        },
      },
    });
    getCurrentUserMock.mockResolvedValue(sessionFor(u));
    getJudge0ClientMock.mockReturnValue({ submit: async () => ({ status: { id: 3, description: "Accepted" } }) });
    const res = await POST(req({ questionId: "q-r3", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("öffentlichen");
  });
});
