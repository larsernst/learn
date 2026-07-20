import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

// Judge0 ist auf dem Test-Server deaktiviert (JUDGE0_ENABLED=false, Standard).
// Die API muss Code-Einreichungen dann sauber mit 503 ablehnen, statt zu
// crashen oder still zu akzeptieren.
test.describe("Code-Aufgaben (Judge0 deaktiviert)", () => {
  test("Code-Submit wird mit 503 abgelehnt", async ({ request }) => {
    const email = unique("code");
    await request.post("/api/auth/register", {
      data: { name: "Code", email, password: "testpass1234" },
    });

    const res = await request.post("/api/review/code-submit", {
      data: {
        questionId: "egal",
        languageId: 71,
        sourceCode: "print('hallo')",
      },
    });
    expect(res.status()).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("JUDGE0_ENABLED=false");
  });

  test("Code-Submit ohne Login wird mit 401 abgelehnt", async ({ request }) => {
    const res = await request.post("/api/review/code-submit", {
      data: { questionId: "egal", languageId: 71, sourceCode: "print(1)" },
    });
    expect(res.status()).toBe(401);
  });

  test("Code-Run (Probelauf) wird mit 503 abgelehnt", async ({ request }) => {
    const email = unique("coderun");
    await request.post("/api/auth/register", {
      data: { name: "CodeRun", email, password: "testpass1234" },
    });

    const res = await request.post("/api/review/code-run", {
      data: {
        questionId: "egal",
        languageId: 71,
        sourceCode: "print('hallo')",
      },
    });
    expect(res.status()).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("JUDGE0_ENABLED=false");
  });

  test("Code-Run ohne Login wird mit 401 abgelehnt", async ({ request }) => {
    const res = await request.post("/api/review/code-run", {
      data: { questionId: "egal", languageId: 71, sourceCode: "print(1)" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Code-Aufgaben im Prüfungsmodus (Judge0 deaktiviert)", () => {
  test("exam/code-grade wird mit 503 abgelehnt", async ({ request }) => {
    const email = unique("examcode");
    await request.post("/api/auth/register", {
      data: { name: "ExamCode", email, password: "testpass1234" },
    });

    const res = await request.post("/api/exam/code-grade", {
      data: { questionId: "egal", languageId: 54, sourceCode: "int main(){}" },
    });
    expect(res.status()).toBe(503);
  });

  test("exam/code-grade ohne Login wird mit 401 abgelehnt", async ({ request }) => {
    const res = await request.post("/api/exam/code-grade", {
      data: { questionId: "egal", languageId: 54, sourceCode: "x" },
    });
    expect(res.status()).toBe(401);
  });
});
