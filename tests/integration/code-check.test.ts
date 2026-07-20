// Integrations-Tests für POST /api/courses/[id]/questions/code-check
// (Autoren-Werkzeug: Musterlösung gegen alle Tests laufen lassen).
// Echte DB; Judge0-Client gemockt.

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

// requireEditorApi → getCurrentUserWithRoles → getCurrentUser (session) +
// Rollen aus der echten DB (UserRole-Tabelle wird mitgeführt).
const getCurrentUserMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

const getJudge0ClientMock = vi.fn();
vi.mock("@/lib/judge0/config", () => ({
  getJudge0Client: () => getJudge0ClientMock(),
}));

const { POST } = await import("@/app/api/courses/[id]/questions/code-check/route");

function req(body: unknown) {
  return new Request("http://localhost/api/courses/c1/questions/code-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PAYLOAD = {
  languages: [{ languageId: 54, label: "C++ (G++)", starterCode: "" }],
  testCases: [
    { id: "t1", input: "", expectedOutput: "42", hidden: false },
    { id: "t2", input: "5", args: "--v", expectedOutput: "25", hidden: true },
  ],
  comparison: { mode: "trim" },
  referenceSolution: "int main() { /* Lösung */ }",
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
};

function editorSession(id = "ed") {
  return { sub: id, email: `${id}@it.test`, name: "Ed", roles: ["editor"] };
}

async function createEditor(id: string) {
  await prisma.user.create({
    data: { id, name: id, email: `${id}@it.test`, passwordHash: "x" },
  });
  await prisma.userRole.create({ data: { userId: id, role: "editor" } });
}

describe.skipIf(!dbOk)("api/courses/[id]/questions/code-check (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    getCurrentUserMock.mockReset();
    getJudge0ClientMock.mockReset();
    await createEditor("ed");
    await prisma.course.create({
      data: { id: "c1", slug: "c1", title: "c1", description: "", order: 1, status: "draft", ownerId: "ed" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("401 ohne Login / 403 ohne Editor-Rolle / 403 fremder Kurs", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    expect((await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } })).status).toBe(401);

    await prisma.user.create({
      data: { id: "x", name: "X", email: "x@it.test", passwordHash: "x" },
    });
    getCurrentUserMock.mockResolvedValue({ sub: "x", email: "x@it.test", name: "X", roles: [] });
    expect((await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } })).status).toBe(403);

    // Editor, aber fremder Kurs (ownerId: "ed").
    await createEditor("fremd");
    getCurrentUserMock.mockResolvedValue({ sub: "fremd", email: "fremd@it.test", name: "fremd", roles: ["editor"] });
    expect((await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } })).status).toBe(403);
  });

  test("404 bei unbekanntem Kurs", async () => {
    getCurrentUserMock.mockResolvedValue(editorSession());
    const res = await POST(req({ payload: PAYLOAD }), { params: { id: "gibts-nicht" } });
    expect(res.status).toBe(404);
  });

  test("503 wenn Judge0 deaktiviert", async () => {
    getCurrentUserMock.mockResolvedValue(editorSession());
    getJudge0ClientMock.mockReturnValue(null);
    const res = await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } });
    expect(res.status).toBe(503);
  });

  test("400 ohne Musterlösung", async () => {
    getCurrentUserMock.mockResolvedValue(editorSession());
    getJudge0ClientMock.mockReturnValue({ submit: async () => ({ status: { id: 3, description: "Accepted" } }) });
    const { referenceSolution: _omit, ...ohne } = PAYLOAD;
    const res = await POST(req({ payload: ohne }), { params: { id: "c1" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Musterlösung");
  });

  test("Happy Path: alle Tests (auch versteckte) laufen, args fließt", async () => {
    getCurrentUserMock.mockResolvedValue(editorSession());
    const submissions: Judge0Submission[] = [];
    getJudge0ClientMock.mockReturnValue({
      submit: async (s: Judge0Submission) => {
        submissions.push(s);
        const r: Judge0Result = {
          status: { id: 3, description: "Accepted" },
          stdout: s.stdin === "5" ? "25" : "42",
        };
        return r;
      },
    });
    const res = await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(true);
    expect(body.detail.perTest).toHaveLength(2);
    // Beide Tests inkl. verstecktem wurden ausgeführt; argv wurde durchgereicht.
    expect(submissions).toHaveLength(2);
    expect(submissions[0].source_code).toContain("Lösung");
    expect(submissions[1].command_line_arguments).toBe("--v");
  });

  test("scheiternde Musterlösung → correct=false mit Test-Details", async () => {
    getCurrentUserMock.mockResolvedValue(editorSession());
    getJudge0ClientMock.mockReturnValue({
      submit: async () => ({ status: { id: 3, description: "Accepted" }, stdout: "falsch" }),
    });
    const res = await POST(req({ payload: PAYLOAD }), { params: { id: "c1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(false);
    expect(body.detail.perTest.every((t: { passed: boolean }) => !t.passed)).toBe(true);
  });
});
