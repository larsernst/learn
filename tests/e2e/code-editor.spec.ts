import { test, expect, type Page } from "@playwright/test";

// Editor-E2E für Code-Aufgaben (Phase 7): nachgewiesen, dass die zwei
// Referenz-Aufgabenformen (stdin/stdout mit trim-Vergleich bzw. argv +
// float-Vergleich + Musterlösung) vollständig über den Editor angelegt,
// gespeichert und wieder geöffnet werden können.
// Läuft im Projekt "editor-chromium" (Editor-Storage-State, Judge0 aus).

async function createCourseWithChapter(page: Page, title: string) {
  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  await page.getByPlaceholder("Neues Kapitel …").fill("Exceptions");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1. Exceptions")).toBeVisible();
}

async function openNewCodeQuestion(page: Page, questionText: string) {
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder(/Welche Aufgaben hat ein Betriebssystem/).fill(questionText);
  await page.getByRole("button", { name: /Code-Aufgabe/ }).click();
}

async function fillCommon(page: Page) {
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Hinweise zur Lösung.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("e2e.md");
}

function testCaseCard(page: Page, index: number) {
  // Testfall-Karten im Code-Editor (Reihenfolge = Anzeigereihenfolge).
  return page.locator("div.card", {
    has: page.locator("label", { hasText: "Eingabe (stdin)" }),
  }).nth(index);
}

test("Code-Aufgabe (C++, trim, public+hidden) anlegen, speichern, wieder öffnen", async ({ page }) => {
  await createCourseWithChapter(page, `E7-Bruch ${Date.now()}`);
  await openNewCodeQuestion(
    page,
    "Implementieren Sie einen Bruch-Taschenrechner: Eingabe von Brüchen und Operatoren bis `=`, Ausgabe `Ergebnis: z/n` und `Als Kommazahl: x`."
  );

  // Sprache C++ wählen
  await page
    .locator("div.field", { has: page.locator("label", { hasText: "Programmiersprache" }) })
    .locator("select")
    .selectOption({ label: "C++ (G++)" });

  // Vergleichsmodus trim
  await page
    .locator("div.field", { has: page.locator("label", { hasText: "Vergleichsmodus" }) })
    .locator("select")
    .selectOption({ label: "Whitespace-tolerant (Zeilenenden)" });
  await expect(page.getByText(/Leerzeichen\/-zeilen am Zeilenende/)).toBeVisible();

  // Starter-Code
  await page
    .locator("div.field", { has: page.locator("label", { hasText: "Starter-Code" }) })
    .locator("textarea")
    .fill("#include <iostream>\n// TODO: Bruch-Klasse implementieren\n");

  // Testfall 1 (öffentlich)
  await testCaseCard(page, 0).locator("textarea").nth(0).fill("1/2 + 3/4 =\n");
  await testCaseCard(page, 0).locator("textarea").nth(1).fill("Ergebnis: 5/4\nAls Kommazahl: 1.25\n");

  // Testfall 2 (versteckt)
  await page.getByRole("button", { name: "+ Testfall" }).click();
  await testCaseCard(page, 1).locator("textarea").nth(0).fill("2/4 * 3/9 =\n");
  await testCaseCard(page, 1).locator("textarea").nth(1).fill("Ergebnis: 1/6\nAls Kommazahl: 0.166667\n");
  await testCaseCard(page, 1).getByLabel("Versteckt").check();

  await fillCommon(page);
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Code" }).first()).toBeVisible();

  // Wieder öffnen: alle Felder müssen persistiert sein.
  await page.getByRole("button", { name: "Bearbeiten" }).first().click();
  await expect(page.getByText("Frage bearbeiten")).toBeVisible();
  const langSelect = page
    .locator("div.field", { has: page.locator("label", { hasText: "Programmiersprache" }) })
    .locator("select");
  await expect(langSelect).toHaveValue("54");
  const modeSelect = page
    .locator("div.field", { has: page.locator("label", { hasText: "Vergleichsmodus" }) })
    .locator("select");
  await expect(modeSelect).toHaveValue("trim");
  // Public-Test unverändert, hidden-Test samt Versteckt-Flag vorhanden.
  await expect(testCaseCard(page, 0).locator("textarea").nth(0)).toHaveValue("1/2 + 3/4 =\n");
  await expect(testCaseCard(page, 0).locator("textarea").nth(1)).toHaveValue(
    "Ergebnis: 5/4\nAls Kommazahl: 1.25\n"
  );
  await expect(testCaseCard(page, 1).getByLabel("Versteckt")).toBeChecked();
});

test("Code-Aufgabe (float + argv + Musterlösung) anlegen; Check-Button meldet Judge0-Status", async ({
  page,
}) => {
  await createCourseWithChapter(page, `E7-Mittelwert ${Date.now()}`);
  await openNewCodeQuestion(
    page,
    "Berechnen Sie zeilenweise Mittelwerte. Gruppen beginnen mit `#Name`, Ende ist eine Leerzeile. Ausgabe: `Name: Mittelwert x`."
  );

  // Float-Modus + Toleranz
  await page
    .locator("div.field", { has: page.locator("label", { hasText: "Vergleichsmodus" }) })
    .locator("select")
    .selectOption({ label: "Float-tolerant (Zahlen mit Toleranz)" });
  const tolerance = page.locator("div.field", {
    has: page.locator("label", { hasText: "Float-Toleranz" }),
  });
  await expect(tolerance).toBeVisible();
  await tolerance.locator("input").fill("0.001");

  // Testfall mit argv
  await testCaseCard(page, 0).locator("textarea").nth(0).fill("#Gruppe A\n1.5\n2.5\n42\n\n");
  await testCaseCard(page, 0).locator("input[placeholder^='argv']").fill("unused");
  await testCaseCard(page, 0).locator("textarea").nth(1).fill("Gruppe A: Mittelwert 15.3333\n");

  // Musterlösung + Check-Button: bei deaktiviertem Judge0 ist der Button
  // deaktiviert und weist auf die Voraussetzung hin (Server-seitige 503 ist
  // per Integrations-Test abgedeckt).
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /Musterlösung/ }) })
    .locator("textarea")
    .fill("int main() { /* Referenz */ }");
  await expect(page.getByRole("button", { name: "Musterlösung gegen Tests prüfen" })).toBeDisabled();
  await expect(page.getByText("benötigt aktives Judge0")).toBeVisible();

  await fillCommon(page);
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();

  // Wieder öffnen: float-Modus, Toleranz, argv und Musterlösung persistiert.
  await page.getByRole("button", { name: "Bearbeiten" }).first().click();
  const modeSelect = page
    .locator("div.field", { has: page.locator("label", { hasText: "Vergleichsmodus" }) })
    .locator("select");
  await expect(modeSelect).toHaveValue("float");
  await expect(
    page.locator("div.field", { has: page.locator("label", { hasText: "Float-Toleranz" }) }).locator("input")
  ).toHaveValue("0.001");
  await expect(testCaseCard(page, 0).locator("input[placeholder^='argv']")).toHaveValue("unused");
  await expect(
    page.locator("div.field", { has: page.locator("label", { hasText: /Musterlösung/ }) }).locator("textarea")
  ).toHaveValue("int main() { /* Referenz */ }");
});
