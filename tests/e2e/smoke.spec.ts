import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

test("Smoke: Homepage -> Registrierung -> Lern-Sitzung -> Fortschritt", async ({ page }) => {
  const email = unique("smoke");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Mehrere Kurse|Betriebssysteme/ })).toBeVisible();

  await page.goto("/registrieren");
  await page.getByLabel("Name").fill("Smoke Tester");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort (min. 8 Zeichen)").fill("testpass1234");
  await page.getByRole("button", { name: "Konto erstellen" }).click();

  await page.waitForURL("**/lernen");
  // Es erscheint entweder eine Freie-Erinnerungs- oder eine MCQ-Karte.
  await expect(
    page.getByRole("button", { name: "Musterantwort zeigen" }).or(page.getByRole("button", { name: "Auswerten" }))
  ).toBeVisible();

  await page.goto("/fortschritt");
  await expect(page.getByRole("heading", { name: "Dein Stand" })).toBeVisible();

  await page.goto("/katalog");
  await expect(page.getByRole("heading", { name: "Alle Fragen" })).toBeVisible();
});

test("Smoke: Login-Seite ist erreichbar und zeigt das Formular", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
  await expect(page.getByLabel("E-Mail")).toBeVisible();
  await expect(page.getByLabel(/^Passwort$/)).toBeVisible();
});