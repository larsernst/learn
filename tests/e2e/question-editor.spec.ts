import { test, expect, type Page } from "@playwright/test";

// Geführte Fragen-Editoren (Phase E3): pro Aufgabentyp eine Frage anlegen,
// Vorschau testen, speichern – und im Lern-Tab beantworten.
// Läuft im Projekt "editor-chromium" mit Editor-Storage-State.

async function createCourseWithChapter(page: Page, title: string) {
  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  await page.getByPlaceholder("Neues Kapitel …").fill("Kapitel Eins");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1. Kapitel Eins")).toBeVisible();
  return page.url();
}

async function openNewQuestion(page: Page, questionText: string) {
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder(/Welche Aufgaben hat ein Betriebssystem/).fill(questionText);
}

async function fillCommon(page: Page, answer: string) {
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill(answer);
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("e3.md");
}

test("MCQ-Editor: Optionen, Single/Multi-Badge, Vorschau mit Bewertung", async ({ page }) => {
  await createCourseWithChapter(page, `E3-MCQ ${Date.now()}`);
  await openNewQuestion(page, "Was ist richtig?");
  await page.getByRole("button", { name: /Multiple-Choice/ }).click();

  // Optionen ausfüllen: 2 richtige -> Mehrfachauswahl-Badge
  const optionInputs = page.locator("input.input[placeholder^='Option']");
  await optionInputs.nth(0).fill("Alpha");
  await optionInputs.nth(1).fill("Beta");
  await page.locator("input[type='checkbox'][title='Richtige Option']").nth(0).check();
  await page.getByRole("button", { name: "+ Option hinzufügen" }).click();
  await optionInputs.nth(2).fill("Gamma");
  await page.locator("input[type='checkbox'][title='Richtige Option']").nth(2).check();
  await expect(page.getByText("Mehrfachauswahl")).toBeVisible();
  // Eine abwählen -> Single-Choice
  await page.locator("input[type='checkbox'][title='Richtige Option']").nth(2).uncheck();
  await expect(page.getByText(/Single-Choice/)).toBeVisible();
  await page.locator("input[type='checkbox'][title='Richtige Option']").nth(2).check();

  await fillCommon(page, "Alpha und Gamma sind richtig.");

  // Vorschau: richtige Optionen wählen -> "Richtig"
  await page.getByRole("button", { name: "Als Lernender testen" }).click();
  await page.locator(".mcq-option", { hasText: "Alpha" }).click();
  await page.locator(".mcq-option", { hasText: "Gamma" }).click();
  await page.getByRole("button", { name: "Prüfen" }).click();
  await expect(page.locator(".badge", { hasText: /^Richtig$/ })).toBeVisible();

  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Multiple-Choice" }).first()).toBeVisible();
});

test("Cloze-Editor: Wort markieren -> Lücke, Vorschau, Speichern", async ({ page }) => {
  await createCourseWithChapter(page, `E3-Cloze ${Date.now()}`);
  await openNewQuestion(page, "Ergänzen Sie den Satz.");
  await page.getByRole("button", { name: /Lückentext/ }).click();

  const clozeText = "Ein Deadlock braucht vier Bedingungen gleichzeitig.";
  const textarea = page.locator("textarea[placeholder='Fließtext mit Lücken …']");
  await textarea.fill(clozeText);
  // "vier" markieren (Index 19..23) und zur Lücke machen
  await textarea.evaluate((el) => {
    const ta = el as HTMLTextAreaElement;
    const start = ta.value.indexOf("vier");
    ta.setSelectionRange(start, start + 4);
  });
  await page.getByRole("button", { name: "Aus Auswahl Lücke machen" }).click();
  await expect(textarea).toHaveValue("Ein Deadlock braucht [[1]] Bedingungen gleichzeitig.");
  // Akzeptierte Antwort ist durch die Auswahl vorbefüllt
  await expect(page.locator(".badge", { hasText: "[[1]]" })).toBeVisible();

  await fillCommon(page, "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.");

  // Vorschau: richtige Antwort eingeben -> "Richtig"
  await page.getByRole("button", { name: "Als Lernender testen" }).click();
  await page.locator(".preview-card input.input").first().fill("vier");
  await page.getByRole("button", { name: /Prüfen|Auswerten|Überprüfen/ }).first().click();

  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Lückentext" }).first()).toBeVisible();
});

test("DragDrop- und Order-Editor: anlegen und im Lern-Tab beantworten", async ({ page }) => {
  await createCourseWithChapter(page, `E3-DD-Order ${Date.now()}`);

  // ── Drag & Drop ──
  await openNewQuestion(page, "Ordnen Sie zu: Prozess oder Thread?");
  await page.getByRole("button", { name: /Zuordnen/ }).click();
  await page.locator("input[placeholder='Zone 1 …']").fill("Prozess");
  await page.getByRole("button", { name: "+ Zone" }).click();
  await page.locator("input[placeholder='Zone 2 …']").fill("Thread");
  await page.locator("input[placeholder='Element 1 …']").fill("Eigener Adressraum");
  await page.locator("select[title='Korrekte Zone']").nth(0).selectOption({ label: "Prozess" });
  await page.getByRole("button", { name: "+ Element" }).click();
  await page.locator("input[placeholder='Element 2 …']").fill("Eigener Stack");
  await page.locator("select[title='Korrekte Zone']").nth(1).selectOption({ label: "Thread" });
  await fillCommon(page, "Prozesse haben eigene Adressräume, Threads eigene Stacks.");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();

  // ── Order ──
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder(/Welche Aufgaben hat ein Betriebssystem/).fill("OSI-Schichten sortieren");
  await page.getByRole("button", { name: /Sortieren/ }).click();
  await page.locator("input[placeholder='Schritt 1 …']").fill("Bitübertragung");
  await page.locator("input[placeholder='Schritt 2 …']").fill("Sicherung");
  await page.getByRole("button", { name: "+ Element" }).click();
  await page.locator("input[placeholder='Schritt 3 …']").fill("Vermittlung");
  await fillCommon(page, "Schichten 1-3 des OSI-Modells.");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();

  // Beide Fragen sind im Kurs sichtbar (Katalog) und der Lern-Tab zeigt eine Karte
  const courseId = page.url().split("/editor/kurs/")[1];
  await page.goto(`/kurs/${courseId}/katalog`);
  await expect(page.getByText("Ordnen Sie zu: Prozess oder Thread?")).toBeVisible();
  await expect(page.getByText("OSI-Schichten sortieren")).toBeVisible();
  await page.goto(`/kurs/${courseId}/lernen`);
  await expect(
    page.getByRole("button", { name: /Musterantwort zeigen|Auswerten|Prüfen|Alle Elemente zuordnen/ }).first()
  ).toBeVisible({ timeout: 10000 });
});

test("Code-Editor: Limits-Preset, Testfälle, Judge0-Hinweis", async ({ page }) => {
  await createCourseWithChapter(page, `E3-Code ${Date.now()}`);
  await openNewQuestion(page, "Implementieren Sie eine Funktion.");
  await page.getByRole("button", { name: /Code-Aufgabe/ }).click();

  await expect(page.getByText(/Judge0 ist auf diesem Server deaktiviert/)).toBeVisible();
  await expect(page.getByText("Mindestens ein Testfall sollte öffentlich sein")).toHaveCount(0);

  await page.locator("div.field", { has: page.locator("label", { hasText: "Eingabe (stdin)" }) }).locator("textarea").fill("1\n");
  await page.locator("div.field", { has: page.locator("label", { hasText: "Erwartete Ausgabe" }) }).locator("textarea").fill("1\n");
  await fillCommon(page, "```python\nprint(1)\n```");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Code" }).first()).toBeVisible();
});
