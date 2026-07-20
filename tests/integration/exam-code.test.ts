// Integrations-Tests für den Code-Prüfungsfluss:
// POST /api/exam/code-grade stellt signierte Verdicts aus,
// POST /api/exam/submit wertet ausschließlich gültige Verdicts.
// Echte DB; Session und Judge0-Client gemockt.

import { beforeAll, beforeEach, afterAll, describe, expect, test, vi } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";
import { verifyCodeVerdict } from "@/lib/exam-verdict";
import type { Judge0Result, Judge0Submission } from "@/lib/judge0/client";

process.env.DISABLE_RATE_LIMIT = "true";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "it-secret-fuer-exam-verdicts-0123456789abcdef";

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

const { POST: codeGradePOST } = await import("@/app/api/exam/code-grade/route");
const { POST: examSubmitPOST } = await import("@/app/api/exam/submit/route");

function req(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const CODE_PAYLOAD = {
  languages: [{ languageId: 54, label: "C++ (G++)", starterCode: "int main(){}" }],
  testCases: [{ id: "t1", input: "", expectedOutput: "42\n", hidden: false }],
  comparison: { mode: "exact" },
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
};

function clientReturning(result: Judge0Result) {
  return { submit: async (_s: Judge0Submission) => result };
}

describe.skipIf(!dbOk)("exam code-flow (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    getCurrentUserMock.mockReset();
    getJudge0ClientMock.mockReset();

    await prisma.user.create({
      data: { id: "u", name: "Exam", email: "u@it.test", passwordHash: "x" },
    });
    await prisma.course.create({
      data: { id: "c", slug: "c", title: "c", description: "", order: 1, status: "published" },
    });
    await prisma.question.create({
      data: {
        id: "qc",
        courseId: "c",
        chapter: 1,
        chapterTitle: "K",
        question: "Q",
        answer: "A",
        sourceRef: "it",
        taskType: "code",
        payload: CODE_PAYLOAD,
      },
    });
    getCurrentUserMock.mockResolvedValue({ sub: "u", email: "u@it.test", name: "Exam", roles: [] });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("code-grade: 503 wenn Judge0 deaktiviert", async () => {
    getJudge0ClientMock.mockReturnValue(null);
    const res = await codeGradePOST(
      req("/api/exam/code-grade", { questionId: "qc", languageId: 54, sourceCode: "x" })
    );
    expect(res.status).toBe(503);
  });

  test("code-grade: stellt verifizierbares Verdict aus, kein SM-2", async () => {
    getJudge0ClientMock.mockReturnValue(
      clientReturning({ status: { id: 3, description: "Accepted" }, stdout: "42\n" })
    );
    const res = await codeGradePOST(
      req("/api/exam/code-grade", { questionId: "qc", languageId: 54, sourceCode: "int main(){}" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(true);
    expect(typeof body.verdict).toBe("string");
    // Das ausgestellte Verdict ist serverseitig verifizierbar …
    expect(verifyCodeVerdict(body.verdict, "qc")?.correct).toBe(true);
    // … und schreibt keinerlei SM-2-Daten.
    expect(await prisma.review.count()).toBe(0);
    expect(await prisma.reviewEvent.count()).toBe(0);
  });

  test("exam/submit: gültiges Verdict → richtig; saveToSm2 schreibt", async () => {
    getJudge0ClientMock.mockReturnValue(
      clientReturning({ status: { id: 3, description: "Accepted" }, stdout: "42\n" })
    );
    const gradeRes = await codeGradePOST(
      req("/api/exam/code-grade", { questionId: "qc", languageId: 54, sourceCode: "ok" })
    );
    const { verdict } = await gradeRes.json();

    const res = await examSubmitPOST(
      req("/api/exam/submit", {
        answers: [{ questionId: "qc", taskType: "code", verdict }],
        saveToSm2: true,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(1);
    expect(body.perQuestion[0]).toMatchObject({ questionId: "qc", correct: true });
    const review = await prisma.review.findUnique({
      where: { userId_questionId: { userId: "u", questionId: "qc" } },
    });
    expect(review).not.toBeNull();
  });

  test("exam/submit: selbstgebautes 'correct: true' ohne Verdict → falsch", async () => {
    // Früheres Format (plaines Flag) bzw. leeres Verdict wird nicht akzeptiert.
    const res = await examSubmitPOST(
      req("/api/exam/submit", {
        answers: [{ questionId: "qc", taskType: "code", verdict: "" }],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(0);
  });

  test("exam/submit: gefälschtes Verdict → falsch", async () => {
    const res = await examSubmitPOST(
      req("/api/exam/submit", {
        answers: [{ questionId: "qc", taskType: "code", verdict: "v1.Zm9v.JmZrZ2Vk" }],
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).score).toBe(0);
  });

  test("exam/submit: 400 bei ungültigem Body", async () => {
    const res = await examSubmitPOST(req("/api/exam/submit", { answers: [] }));
    expect(res.status).toBe(400);
  });
});
