import { test, expect, type Page } from "@playwright/test";

// Kapitel-Zeilen in der Sidebar zuverlässig aktivieren: Query + Click
// atomar im Browser (React kann die Knoten nicht zwischendurch ersetzen).
async function clickChapter(page: Page, label: string) {
  await page.evaluate((l) => {
    for (const row of document.querySelectorAll("div[draggable='true']")) {
      if (row.textContent?.includes(l)) {
        (row as HTMLElement).click();
        return;
      }
    }
    throw new Error(`Kapitel nicht gefunden: ${l}`);
  }, label);
}

// Bulk-Checkbox einer Fragen-Zeile (Index) atomar klicken.
async function clickBulkCheckbox(page: Page, index: number) {
  await page.evaluate((i) => {
    const boxes = document.querySelectorAll("input[title='Für Bulk-Aktion auswählen']");
    (boxes[i] as HTMLInputElement)?.click();
  }, index);
}


// E5-Extras: Bulk-Aktionen, Suche/Filter im Curriculum, Qualitäts-Hinweise
// auf dem Dashboard. Läuft im Projekt "editor-chromium".

async function createCourseWithChapter(page: Page, title: string) {
  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  await page.getByPlaceholder("Neues Kapitel …").fill("Kapitel Eins");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1. Kapitel Eins")).toBeVisible();
  return page.url().split("/editor/kurs/")[1];
}

async function addQuestion(page: Page, text: string) {
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder(/Welche Aufgaben hat ein Betriebssystem/).fill(text);
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Antwort.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("e5.md");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
}

test("Bulk-Aktionen: auswählen, gemeinsam verschieben, gemeinsam löschen", async ({ page }) => {
  await createCourseWithChapter(page, `E5-Bulk ${Date.now()}`);
  await addQuestion(page, "Bulk-Frage Alpha?");
  await addQuestion(page, "Bulk-Frage Beta?");

  // Zweites Kapitel (Row-Render abwarten, dann zurück in Kapitel Eins)
  await page.getByPlaceholder("Neues Kapitel …").fill("Kapitel Zwei");
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.locator("div[draggable='true']", { hasText: "2. Kapitel Zwei" })).toBeVisible();
  await clickChapter(page, "1. Kapitel Eins");
  await expect(page.getByText("Bulk-Frage Alpha?")).toBeVisible();

  // Beide Fragen auswählen
  await clickBulkCheckbox(page, 0);
  await expect(page.getByText("1 ausgewählt")).toBeVisible();
  await clickBulkCheckbox(page, 1);
  await expect(page.getByText("2 ausgewählt")).toBeVisible();

  // Gemeinsam nach Kapitel Zwei verschieben
  await page.locator("select", { hasText: "Verschieben nach …" }).selectOption({ label: "2. Kapitel Zwei" });
  await expect(page.getByText("2 Frage(n) verschoben.")).toBeVisible();
  await expect(page.getByText("Bulk-Frage Alpha?")).toHaveCount(0);

  // In Kapitel Zwei: beide da; auswählen und löschen
  await clickChapter(page, "2. Kapitel Zwei");
  await expect(page.getByText("Bulk-Frage Alpha?")).toBeVisible();
  await expect(page.getByText("Bulk-Frage Beta?")).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await clickBulkCheckbox(page, 0);
  await expect(page.getByText("1 ausgewählt")).toBeVisible();
  await clickBulkCheckbox(page, 1);
  await expect(page.getByText("2 ausgewählt")).toBeVisible();
  await page.locator("div.card", { hasText: "2 ausgewählt" }).getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("2 Frage(n) gelöscht.")).toBeVisible();
  await expect(page.getByText("Bulk-Frage Alpha?")).toHaveCount(0);
});

test("Suche und Typ-Filter im Curriculum", async ({ page }) => {
  await createCourseWithChapter(page, `E5-Filter ${Date.now()}`);
  await addQuestion(page, "Was ist ein Scheduler?");
  await addQuestion(page, "Was ist eine Seitentabelle?");

  // Textsuche
  await page.getByPlaceholder("Suche im Kapitel …").fill("scheduler");
  await expect(page.getByText("Was ist ein Scheduler?")).toBeVisible();
  await expect(page.getByText("Was ist eine Seitentabelle?")).toHaveCount(0);

  // Suche ohne Treffer
  await page.getByPlaceholder("Suche im Kapitel …").fill("gibtsnicht");
  await expect(page.getByText("Was ist ein Scheduler?")).toHaveCount(0);

  // Filter zurücksetzen
  await page.getByPlaceholder("Suche im Kapitel …").fill("");
  await expect(page.getByText("Was ist ein Scheduler?")).toBeVisible();
  await expect(page.getByText("Was ist eine Seitentabelle?")).toBeVisible();

  // Typ-Filter (nur Freie Erinnerung vorhanden)
  await page.locator("select", { hasText: "Alle Typen" }).selectOption({ label: "Multiple-Choice" });
  await expect(page.getByText("Was ist ein Scheduler?")).toHaveCount(0);
  await page.locator("select", { hasText: "Alle Typen" }).selectOption({ label: "Freie Erinnerung" });
  await expect(page.getByText("Was ist ein Scheduler?")).toBeVisible();
});

test("Dashboard zeigt Qualitäts-Hinweise", async ({ page }) => {
  const courseId = await createCourseWithChapter(page, `E5-Quality ${Date.now()}`);

  // Schema-valide, aber fachlich unvollständige MCQ via API anlegen
  // (keine richtige Option -> Qualitäts-Hinweis auf dem Dashboard).
  const chapters = await (await page.request.get(`/api/courses/${courseId}/chapters`)).json();
  await page.request.post("/api/admin/questions", {
    data: {
      questions: [
        {
          id: `e5-mcq-broken-${Date.now()}`,
          courseId,
          chapterId: chapters.chapters[0].id,
          chapter: 1,
          chapterTitle: "Kapitel Eins",
          question: "MCQ ohne richtige Option?",
          answer: "Alle falsch.",
          sourceRef: "e5.md",
          taskType: "mcq",
          payload: {
            options: [
              { id: "o1", text: "A", correct: false },
              { id: "o2", text: "B", correct: false },
            ],
          },
        },
      ],
    },
  });

  await page.goto("/editor");
  const card = page.locator(".card", { hasText: /E5-Quality/ }).first();
  await expect(card.getByText(/⚠ \d+ Hinweis\(e\)/)).toBeVisible();
  await expect(card.getByText(/MCQ: 1/)).toBeVisible();
});
