import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

// Zugriffsschutz für den Editor-Bereich (läuft ohne Storage-State im
// Standard-Projekt "chromium").
test.describe("Editor-Zugriffsschutz", () => {
  test("Anonym: /editor leitet auf /login um", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/editor");
    await page.waitForURL("**/login");
  });

  test("Normaler Nutzer ohne Editor-Rolle landet auf der Übersicht", async ({ page, request }) => {
    const email = unique("noeditor");
    await request.post("/api/auth/register", {
      data: { name: "NoEditor", email, password: "testpass1234" },
    });
    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    await page.goto("/editor");
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: /Hallo/ })).toBeVisible();
  });

  test("Alter Pfad /admin/kurse leitet auf /editor um", async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.goto("/admin/kurse");
    // Redirect-Kette endet anonym auf /login (via /editor).
    await page.waitForURL("**/login");
    expect(response?.status()).toBe(200);
  });
});
