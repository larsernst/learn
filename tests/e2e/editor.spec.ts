import { test, expect } from "@playwright/test";

// Editor-Flüsse laufen im Projekt "editor-chromium" mit dem Storage-State
// aus editor.setup.ts (eingeloggter Nutzer mit Rolle "editor").

test("Dashboard zeigt eigene Kurse und Kurs-Anlage-Weg", async ({ page }) => {
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Meine Kurse" })).toBeVisible();
  await expect(page.getByText("Neuen Kurs anlegen").first()).toBeVisible();
});

test("Kurs anlegen -> Curriculum -> Frage anlegen -> Einstellungen", async ({ page }) => {
  const title = `E2E-Kurs ${Date.now()}`;

  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByPlaceholder("Worum geht es in diesem Kurs?").fill("Kurs aus dem E2E-Test.");
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();

  // Direkt im Curriculum des neuen Kurses.
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Lege links dein erstes Kapitel an")).toBeVisible();

  // Erst Kapitel anlegen (Sidebar) …
  await page.getByPlaceholder("Neues Kapitel …").fill("Grundlagen");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1. Grundlagen")).toBeVisible();

  // … dann Frage anlegen (Freie Erinnerung).
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder("z. B. Welche Aufgaben hat ein Betriebssystem?").fill("Was ist ein Scheduler?");
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Die Komponente, die Prozessen CPU-Zeit zuteilt.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("e2e.md");
  await page.getByRole("button", { name: "Frage speichern" }).click();

  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
  await expect(page.getByText("Was ist ein Scheduler?")).toBeVisible();
  await expect(page.getByText("Kapitel 1 · Grundlagen")).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Freie Erinnerung" }).first()).toBeVisible();

  // Einstellungen: Titel ändern.
  await page.getByRole("link", { name: "Einstellungen" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+\/einstellungen$/);
  const newTitle = `${title} (umbenannt)`;
  await page.locator("div.field", { has: page.locator("label", { hasText: /^Titel$/ }) }).locator("input").fill(newTitle);
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Kurs aktualisiert.")).toBeVisible();

  // Zurück zum Curriculum: neuer Titel sichtbar, Frage noch da.
  await page.getByRole("link", { name: newTitle }).click();
  await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
  await expect(page.getByText("Was ist ein Scheduler?")).toBeVisible();
});

test("Editor sieht nur eigene Kurse (Seed-Kurse nicht bearbeitbar)", async ({ page }) => {
  await page.goto("/editor");
  // Der Editor besitzt die Seed-Kurse nicht – sie dürfen auf seinem
  // Dashboard nicht auftauchen.
  await expect(page.getByRole("link", { name: "Betriebssysteme" })).toHaveCount(0);
});
