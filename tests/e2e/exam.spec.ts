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

test.describe("Pruefungssimulation", () => {
  test("10-Fragen-Pruefung durchlaufen und Ergebnis sehen", async ({ page, request }) => {
    const email = unique("exam");
    await request.post("/api/auth/register", {
      data: { name: "Exam", email, password: "testpass1234" },
    });
    await login(page, email);

    await page.goto("/pruefung");
    await expect(page.getByRole("heading", { name: "Prüfung proben" })).toBeVisible();
    await page.getByRole("button", { name: "10 Fragen" }).click();

    // Fragebogen durchlaufen: pro Frage entweder MCQ oder Freie Erinnerung.
    let guard = 0;
    while (guard++ < 30) {
      const resultHeading = page.getByRole("heading", { name: "Einzelne Fragen" });
      if (await resultHeading.isVisible().catch(() => false)) break;

      // MCQ-Frage? Der Submit-Button heisst erst nach Auswahl einer Option
      // "Bestätigen & nächste" – daher zuerst die Optionen prüfen.
      const mcqOptions = page.locator(".mcq-option input");
      if ((await mcqOptions.count()) > 0) {
        await mcqOptions.first().check();
        await page.getByRole("button", { name: "Bestätigen & nächste" }).click();
        await page.waitForTimeout(150);
        continue;
      }

      const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
      if (await reveal.isVisible().catch(() => false)) {
        await reveal.click();
        await page.getByRole("button", { name: "Richtig" }).click();
        await page.waitForTimeout(150);
        continue;
      }
      await page.waitForTimeout(300);
    }

    await expect(page.locator(".card--brand .eyebrow", { hasText: "Ergebnis" })).toBeVisible();
    await expect(page.locator(".card--brand", { hasText: /\d+ \/ \d+/ })).toBeVisible();

    // Optional ins SM-2 uebernehmen
    const saveBtn = page.getByRole("button", { name: "Ins SM-2 übernehmen" });
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await expect(page.getByText("Übernommen")).toBeVisible();
    }
  });

  test("Pruefung ohne Login leitet auf /login um", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/pruefung");
    await page.waitForURL("**/login");
  });
});

test.describe("Katalog-Vorschau (Cram)", () => {
  test("Klick auf eine Frage oeffnet die Vorschau mit Musterantwort", async ({ page, request }) => {
    const email = unique("cram");
    await request.post("/api/auth/register", {
      data: { name: "Cram", email, password: "testpass1234" },
    });
    await login(page, email);

    await page.goto("/katalog");
    await page.locator(".katalog-item__main").first().click();
    await expect(page).toHaveURL(/\/katalog\/[^/]+$/);
    await expect(page.getByText("Musterantwort").first()).toBeVisible();
    await expect(page.getByText(/Diese Ansicht beeinflusst nicht deinen SM-2-Fortschritt/)).toBeVisible();
  });
});