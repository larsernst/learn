import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel(/^Passwort$/).fill("testpass1234");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/lernen");
}

// Negativ-Pfad: ein normaler (nicht-Admin-)Nutzer bekommt keinen Zugriff.
// Diese Tests laufen ohne Admin-Storage-State im regulären chromium-Projekt.

test.describe("Admin-Rollen-Auth (Negativ)", () => {
  test("normaler Nutzer bekommt keinen Admin-API-Zugriff (401/403)", async ({ request }) => {
    const email = unique("nonadmin");
    await request.post("/api/auth/register", {
      data: { name: "Non Admin", email, password: "testpass1234" },
    });

    const res = await request.get("/api/admin/users");
    expect([401, 403]).toContain(res.status());
  });

  test("Nicht-Admin wird von /admin weggeleitet", async ({ page, request }) => {
    const email = unique("nonadmin-page");
    await request.post("/api/auth/register", {
      data: { name: "Non Admin Page", email, password: "testpass1234" },
    });

    await login(page, email);

    await page.goto("/admin");
    await page.waitForURL("**/");
    expect(page.url()).not.toMatch(/\/admin/);
  });
});
