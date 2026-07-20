// Integrations-Tests für POST /api/review/code-submit (Phase 2-Härtung):
// Schema-Limits, Sprach-Allowlist, Kurs-Sichtbarkeit, SM-2-Schreibpfad –
// gegen eine echte Datenbank. Session und Judge0-Client sind gemockt
// (kein echter Judge0-Server nötig).

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

// Import NACH den Mocks.
const { POST } = await import("@/app/api/review/code-submit/route");

function req(body: unknown) {
  return new Request("http://localhost/api/review/code-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const accepted: Judge0Result = {
  status: { id: 3, description: "Accepted" },
  stdout: "42\n",
  time: "0.01",
  memory: 3000,
};

function stubClient(result: Judge0Result = accepted) {
  const submissions: Judge0Submission[] = [];
  return {
    submissions,
    client: {
      submit: async (s: Judge0Submission) => {
        submissions.push(s);
        return result;
      },
    },
  };
}

const CODE_PAYLOAD = {
  languages: [{ languageId: 54, label: "C++ (G++)", starterCode: "int main(){}" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42\n", hidden: false },
    { id: "t2", input: "5", expectedOutput: "25\n", hidden: true },
  ],
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
};

async function createUser(id: string) {
  return prisma.user.create({
    data: { id, name: "Code", email: `${id}@it.test`, passwordHash: "x" },
  });
}

async function createCourse(id: string, status: string, ownerId: string | null) {
  return prisma.course.create({
    data: { id, slug: id, title: id, description: "", order: 1, status, ownerId },
  });
}

async function createQuestion(
  id: string,
  courseId: string | null,
  taskType: string,
  payload: unknown
) {
  return prisma.question.create({
    data: {
      id,
      courseId,
      chapter: 1,
      chapterTitle: "K",
      question: "Q",
      answer: "A",
      sourceRef: "it",
      taskType,
      payload: payload === null ? undefined : (payload as object),
    },
  });
}

describe.skipIf(!dbOk)("api/review/code-submit (Integration)", () => {
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
    const u = await createUser("u1");
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(null);
    const res = await POST(req({ questionId: "q", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(503);
  });

  test("400 bei Schema-Verletzung (zu großer Source-Code)", async () => {
    const u = await createUser("u2");
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    const { client } = stubClient();
    getJudge0ClientMock.mockReturnValue(client);
    const res = await POST(
      req({ questionId: "q", languageId: 54, sourceCode: "x".repeat(64_001) })
    );
    expect(res.status).toBe(400);
  });

  test("404 bei unbekannter Frage", async () => {
    const u = await createUser("u3");
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(stubClient().client);
    const res = await POST(req({ questionId: "gibts-nicht", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(404);
  });

  test("400 wenn Frage keine Code-Aufgabe ist", async () => {
    const u = await createUser("u4");
    await createCourse("c1", "published", null);
    await createQuestion("q-recall", "c1", "recall", null);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(stubClient().client);
    const res = await POST(req({ questionId: "q-recall", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(400);
  });

  test("400 bei nicht freigeschalteter Sprache", async () => {
    const u = await createUser("u5");
    await createCourse("c2", "published", null);
    await createQuestion("q-code", "c2", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(stubClient().client);
    const res = await POST(req({ questionId: "q-code", languageId: 9999, sourceCode: "x" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("freigeschaltet");
  });

  test("400 wenn die Aufgabe die Sprache nicht anbietet", async () => {
    const u = await createUser("u6");
    await createCourse("c3", "published", null);
    await createQuestion("q-code2", "c3", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(stubClient().client);
    // Python (71) ist global erlaubt, aber die Aufgabe bietet nur C++ (54).
    const res = await POST(req({ questionId: "q-code2", languageId: 71, sourceCode: "print(1)" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("nicht angeboten");
  });

  test("404 bei Draft-Kurs ohne Besitz", async () => {
    const owner = await createUser("owner");
    const u = await createUser("u7");
    await createCourse("c4", "draft", owner.id);
    await createQuestion("q-draft", "c4", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(stubClient().client);
    const res = await POST(req({ questionId: "q-draft", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(404);
  });

  test("Draft-Kurs: Besitzer darf einreichen", async () => {
    const owner = await createUser("owner2");
    await createCourse("c5", "draft", owner.id);
    await createQuestion("q-draft2", "c5", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({
      sub: owner.id,
      email: owner.email,
      name: owner.name,
      roles: ["editor"],
    });
    const { client, submissions } = stubClient();
    getJudge0ClientMock.mockReturnValue(client);
    const res = await POST(req({ questionId: "q-draft2", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(200);
    expect(submissions).toHaveLength(2);
  });

  test("Happy Path: alle Tests accepted → correct, SM-2 + ReviewEvent", async () => {
    const u = await createUser("u8");
    await createCourse("c6", "published", null);
    await createQuestion("q-ok", "c6", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    const { submissions, client } = (() => {
      const subs: Judge0Submission[] = [];
      return {
        submissions: subs,
        client: {
          submit: async (s: Judge0Submission) => {
            subs.push(s);
            // Antwort passend zum Testfall (t1: "42", t2: "25").
            return { status: { id: 3, description: "Accepted" }, stdout: s.stdin === "5" ? "25\n" : "42\n" };
          },
        },
      };
    })();
    getJudge0ClientMock.mockReturnValue(client);
    const res = await POST(
      req({ questionId: "q-ok", languageId: 54, sourceCode: "int main(){ return 0; }" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(true);
    expect(body.detail.perTest).toHaveLength(2);
    // stdin wird übergeben; expected_output nicht (Vergleich erfolgt
    // serverseitig via Comparator).
    expect(submissions[0]).toMatchObject({ language_id: 54, stdin: "" });
    expect(submissions[0]).not.toHaveProperty("expected_output");
    expect(submissions[1]).toMatchObject({ stdin: "5" });

    const review = await prisma.review.findUnique({
      where: { userId_questionId: { userId: u.id, questionId: "q-ok" } },
    });
    expect(review).not.toBeNull();
    const events = await prisma.reviewEvent.findMany({
      where: { userId: u.id, questionId: "q-ok" },
    });
    expect(events).toHaveLength(1);
    expect(events[0].correct).toBe(true);
  });

  test("Wrong Answer → correct=false, aber SM-2-Eintrag wird geschrieben", async () => {
    const u = await createUser("u9");
    await createCourse("c7", "published", null);
    await createQuestion("q-wa", "c7", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue(
      stubClient({ status: { id: 4, description: "Wrong Answer" }, stdout: "falsch\n" }).client
    );
    const res = await POST(req({ questionId: "q-wa", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(false);
    const events = await prisma.reviewEvent.findMany({ where: { userId: u.id } });
    expect(events).toHaveLength(1);
    expect(events[0].correct).toBe(false);
  });

  test("502 wenn Judge0-Client wirft (kein SM-2-Eintrag)", async () => {
    const u = await createUser("u10");
    await createCourse("c8", "published", null);
    await createQuestion("q-err", "c8", "code", CODE_PAYLOAD);
    getCurrentUserMock.mockResolvedValue({ sub: u.id, email: u.email, name: u.name, roles: [] });
    getJudge0ClientMock.mockReturnValue({
      submit: async () => {
        throw new Error("Judge0 nicht erreichbar");
      },
    });
    const res = await POST(req({ questionId: "q-err", languageId: 54, sourceCode: "x" }));
    expect(res.status).toBe(502);
    const events = await prisma.reviewEvent.findMany({ where: { userId: u.id } });
    expect(events).toHaveLength(0);
  });
});
