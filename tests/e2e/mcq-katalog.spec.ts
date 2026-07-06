import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;
const PASSWORD = "testpass1234";

test.describe("Multiple-Choice (Nennen-Fragen)", () => {
  test("MCQ-Auswertung ueber die API: richtig und falsch", async ({ request }) => {
    const email = unique("mcq");
    const reg = await request.post("/api/auth/register", {
      data: { name: "MCQ", email, password: PASSWORD },
    });
    expect(reg.ok()).toBeTruthy();

    // 6-drei-malware-arten: korrekt sind Virus(1), Wurm(2), Trojaner(3).
    const correctRes = await request.post("/api/review/submit", {
      data: {
        questionId: "6-drei-malware-arten",
        selectedOptionIds: ["6-drei-malware-opt-1", "6-drei-malware-opt-2", "6-drei-malware-opt-3"],
      },
    });
    expect(correctRes.ok()).toBeTruthy();
    const correctBody = await correctRes.json();
    expect(correctBody.mode).toBe("mcq");
    expect(correctBody.mcqCorrect).toBe(true);
    expect(correctBody.correctOptionIds).toHaveLength(3);

    // Falsch: eine Distraktor (Firewall) statt Trojaner.
    const wrongRes = await request.post("/api/review/submit", {
      data: {
        questionId: "6-drei-malware-arten",
        selectedOptionIds: ["6-drei-malware-opt-1", "6-drei-malware-opt-4"],
      },
    });
    const wrongBody = await wrongRes.json();
    expect(wrongBody.mcqCorrect).toBe(false);
  });

  test("MCQ-Karte erscheint in der Lern-Sitzung und ist auswertbar", async ({ page, request }) => {
    const email = unique("mcqui");
    await request.post("/api/auth/register", {
      data: { name: "MCQUI", email, password: PASSWORD },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill(PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Freie-Erinnerungs-Karten mit "Easy" verwerfen, bis eine MCQ-Karte kommt.
    let attempts = 0;
    while (attempts < 40) {
      const mcqOptions = page.locator(".mcq-option input[type=checkbox]");
      const mcqVisible = (await mcqOptions.count()) > 0;
      if (mcqVisible) {
        // MCQ-Karte erreicht. Hinweis prüfen, Option ankreuzen, auswerten.
        await expect(page.getByText(/Mehrere Antworten sind richtig|Eine Antwort ist richtig/)).toBeVisible();
        await mcqOptions.first().check();
        // Nach dem Ankreuzen heisst der Button "Auswerten".
        const auswerten = page.getByRole("button", { name: "Auswerten" });
        await auswerten.click();
        await expect(page.getByText(/Richtig!|Falsch/)).toBeVisible({ timeout: 5000 });
        await expect(page.locator(".mcq-option--correct").first()).toBeVisible();
        return;
      }
      const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
      if (await reveal.isVisible().catch(() => false)) {
        await reveal.click();
        await page.getByRole("button", { name: "Easy" }).click();
        await page.waitForTimeout(1100);
        attempts++;
        continue;
      }
      // Weder MCQ noch Aufdecken (z. B. "erledigt"-Screen)
      await page.goto("/lernen");
      await page.waitForLoadState("networkidle");
      attempts++;
    }
    // Wenn wir hier landen, kam keine MCQ-Karte – Test dann fail.
    expect(false, "keine MCQ-Karte innerhalb von 40 Karten erreicht").toBeTruthy();
  });
});

test.describe("Katalog-Uebersicht", () => {
  test("zeigt alle Fragen, Kapitel und Statistik", async ({ page, request }) => {
    const email = unique("kat");
    await request.post("/api/auth/register", {
      data: { name: "Kat", email, password: PASSWORD },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill(PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    await page.goto("/katalog");
    await expect(page.getByRole("heading", { name: "Alle Fragen" })).toBeVisible();
    await expect(page.getByText("Fragen gesamt")).toBeVisible();
    await expect(page.getByText(/Kap\. 1/)).toBeVisible();
    await expect(page.locator(".katalog-item").first()).toBeVisible();
    // In der Liste taucht mindestens eine Multiple-Choice-Frage auf.
    await expect(page.getByText("Multiple-Choice").first()).toBeVisible();
  });

  test("leitet ohne Login auf /login um", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/katalog");
    await page.waitForURL("**/login");
  });
});

test.describe("MCQ-Toggle (Einstellungen)", () => {
  test("Ausschalten von MCQ liefert nur Freie-Erinnerungs-Fragen", async ({ page, request }) => {
    const email = unique("mcoff");
    await request.post("/api/auth/register", {
      data: { name: "MCOff", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Eine Bewertung vornehmen, damit die erste Karte durch ist.
    // Dann MCQ ausschalten -> naechste Karte (falls MCQ-Frage) sollte als Recall erscheinen.
    const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
    const mcqOpts = page.locator(".mcq-option input[type=checkbox]");
    if (await reveal.isVisible().catch(() => false)) {
      await reveal.click();
      await page.getByRole("button", { name: "Good" }).click();
      await page.waitForTimeout(1100);
    } else if ((await mcqOpts.count()) > 0) {
      // MCQ-Karte: Option ankreuzen, dann wird der Button zu "Auswerten".
      await mcqOpts.first().check();
      await page.getByRole("button", { name: "Auswerten" }).click();
      await page.waitForTimeout(1700);
    }

    // MCQ ausschalten
    await page.goto("/einstellungen");
    await expect(page.getByText("Multiple-Choice-Aufgaben")).toBeVisible();
    await page.locator(".switch input").uncheck();
    await expect(page.getByText("Gespeichert")).toBeVisible();

    // Wieder auf /lernen – die naechste Frage sollte NIE ein "Auswerten"-Button zeigen
    await page.goto("/lernen");
    const auswertenAfter = page.getByRole("button", { name: "Auswerten" });
    const revealAfter = page.getByRole("button", { name: "Musterantwort zeigen" });
    // Mindestens eine Karte laedt – es darf kein Auswerten-Button da sein
    await expect(async () => {
      const a = await auswertenAfter.isVisible().catch(() => false);
      const r = await revealAfter.isVisible().catch(() => false);
      const done = await page.getByRole("heading", { name: /erledigt/ }).isVisible().catch(() => false);
      expect(a || r || done).toBeTruthy();
      expect(a).toBe(false);
    }).toPass();
  });
});