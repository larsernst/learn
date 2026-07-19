import { test, expect } from "@playwright/test";

// Curriculum-Builder-Flüsse (Kapitel + Fragen-Organisation). Läuft im
// Projekt "editor-chromium" mit Editor-Storage-State.
test("Kapitel- und Fragen-Organisation im Curriculum", async ({ page }) => {
  const title = `Curriculum-Kurs ${Date.now()}`;

  // Kurs anlegen
  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  const courseUrl = page.url();

  // Zwei Kapitel anlegen
  await page.getByPlaceholder("Neues Kapitel …").fill("Alpha");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1. Alpha")).toBeVisible();
  await page.getByPlaceholder("Neues Kapitel …").fill("Beta");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("2. Beta")).toBeVisible();

  // Kapitel Beta nach oben sortieren (Beta wird 1.)
  await page
    .locator("div[draggable='true']", { hasText: "2. Beta" })
    .getByTitle("Nach oben")
    .click();
  await expect(page.getByText("1. Beta")).toBeVisible();
  await expect(page.getByText("2. Alpha")).toBeVisible();

  // Kapitel Alpha umbenennen in "Gamma"
  await page
    .locator("div[draggable='true']", { hasText: "2. Alpha" })
    .getByTitle("Umbenennen")
    .click();
  await page.locator("input[value='Alpha']").fill("Gamma");
  await page.getByRole("button", { name: "✓" }).click();
  await expect(page.getByText("2. Gamma")).toBeVisible();

  // In Kapitel Beta (aktiv = 1.) eine Frage anlegen
  await page.locator("div[draggable='true'] span", { hasText: "1. Beta" }).first().click();
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder("z. B. Welche Aufgaben hat ein Betriebssystem?").fill("Frage Eins?");
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Antwort Eins.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("cur.md");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();

  // Zweite Frage im selben Kapitel
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder("z. B. Welche Aufgaben hat ein Betriebssystem?").fill("Frage Zwei?");
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Antwort Zwei.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("cur.md");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();

  // Fragen-Reihenfolge: "Frage Zwei" nach oben
  const rowZwei = page.locator(".card", { hasText: "Frage Zwei?" }).first();
  await rowZwei.getByTitle("Nach oben").click();

  // Frage Eins nach Kapitel Gamma verschieben (Select in der Fragen-Zeile)
  const rowEins = page.locator(".card", { hasText: "Frage Eins?" }).first();
  await rowEins.locator("select").selectOption({ label: "2. Gamma" });
  await expect(page.getByText(/verschoben/)).toBeVisible();
  await expect(page.getByText("Frage Eins?")).toHaveCount(0);

  // In Gamma steht jetzt Frage Eins
  await page.locator("div[draggable='true'] span", { hasText: "2. Gamma" }).first().click();
  await expect(page.getByText("Frage Eins?")).toBeVisible();

  // Kapitel Gamma löschen -> Frage landet in "Nicht zugeordnet"
  page.on("dialog", (d) => d.accept());
  await page
    .locator("div[draggable='true']", { hasText: "2. Gamma" })
    .getByTitle("Löschen")
    .click();
  await expect(page.locator("span.muted", { hasText: "Nicht zugeordnet" })).toBeVisible();
  await expect(page.getByText("Frage Eins?")).toBeVisible();

  // Persistenz nach Reload: Kapitel-Sortierung, Verschiebung, Löschung
  await page.goto(courseUrl);
  await expect(page.locator("div[draggable='true'] span", { hasText: "1. Beta" }).first()).toBeVisible();
  await expect(page.getByText("2. Gamma")).toHaveCount(0);
  await page.locator("span.muted", { hasText: "Nicht zugeordnet" }).click();
  await expect(page.getByText("Frage Eins?")).toBeVisible();
  await page.locator("div[draggable='true'] span", { hasText: "1. Beta" }).first().click();
  const firstCardText = await page.locator(".card", { hasText: /Frage (Eins|Zwei)\?/ }).first().innerText();
  expect(firstCardText).toContain("Frage Zwei?");
});
