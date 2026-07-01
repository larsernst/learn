import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

test.describe("Lern-Sitzung mit SM-2", () => {
  test("Registrierung -> Frage beantworten -> Fortschritt sichtbar", async ({ page }) => {
    const email = unique("max");

    await page.goto("/registrieren");
    await page.getByLabel("Name").fill("Max Mustermann");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel("Passwort (min. 8 Zeichen)").fill("testpass1234");
    await page.getByRole("button", { name: "Konto erstellen" }).click();

    await page.waitForURL("**/lernen");
    await expect(page.getByText("Musterantwort zeigen")).toBeVisible();
    await expect(page.getByText(/Kapitel \d/).first()).toBeVisible();

    await page.getByRole("button", { name: "Musterantwort zeigen" }).click();
    await expect(page.getByText("Musterantwort").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Good" })).toBeVisible();

    await page.getByRole("button", { name: "Good" }).click();
    await expect(page.getByText(/Nächste Wiederholung|heute erneut/)).toBeVisible({ timeout: 5000 });

    await expect(async () => {
      const showBtn = page.getByRole("button", { name: "Musterantwort zeigen" });
      const doneHeading = page.getByRole("heading", { name: /erledigt/ });
      const showVisible = await showBtn.isVisible().catch(() => false);
      const doneVisible = await doneHeading.isVisible().catch(() => false);
      expect(showVisible || doneVisible).toBeTruthy();
    }).toPass();

    await page.goto("/fortschritt");
    await expect(page.getByRole("heading", { name: "Dein Stand" })).toBeVisible();
    await expect(page.locator("text=\\d+%").first()).toBeVisible();
  });
});

test.describe("Authentifizierung", () => {
  test("Falsches Passwort wird abgewiesen", async ({ page, request }) => {
    const email = unique("wrongpw");
    const reg = await request.post("/api/auth/register", {
      data: { name: "Falsch", email, password: "testpass1234" },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("ganz-falsches-pw");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page.getByText(/E-Mail oder Passwort falsch/)).toBeVisible();
    // Nicht eingeloggt -> keine Weiterleitung nach /lernen
    await expect(page).toHaveURL(/\/login/);
  });

  test("Doppelte E-Mail-Registrierung wird abgewiesen", async ({ page, request }) => {
    const email = unique("dup");
    const reg = await request.post("/api/auth/register", {
      data: { name: "Dup", email, password: "testpass1234" },
    });
    expect(reg.ok()).toBeTruthy();

    const dup = await request.post("/api/auth/register", {
      data: { name: "Dup2", email, password: "testpass1234" },
    });
    expect(dup.ok()).toBeFalsy();
    expect(dup.status()).toBe(409);

    // Auch ueber die UI erscheint die Fehlermeldung
    await page.goto("/registrieren");
    await page.getByLabel("Name").fill("Dup2");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel("Passwort (min. 8 Zeichen)").fill("testpass1234");
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    await expect(page.getByText(/bereits registriert/)).toBeVisible();
  });

  test("Anmeldung klappt fuer ein vorhandenes Konto", async ({ page, request }) => {
    const email = unique("anja");
    const reg = await request.post("/api/auth/register", {
      data: { name: "Anja", email, password: "testpass1234" },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");
    await expect(page.getByRole("heading", { name: /Heute wiederholen/ })).toBeVisible();
  });

  test("Geschuetzte Route /lernen leitet ohne Login auf /login um", async ({ page }) => {
    // Frischer Kontext ohne Session-Cookie.
    await page.context().clearCookies();
    await page.goto("/lernen");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
  });

  test("Abmelden loescht die Session und schuetzt /lernen wieder", async ({ page, request }) => {
    const email = unique("out");
    await request.post("/api/auth/register", {
      data: { name: "Out", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Abmelden ueber das Topnav-Formular (native POST -> Redirect auf "/")
    await page.getByRole("button", { name: /Abmelden/ }).click();
    await page.waitForURL("**/");
    // Nach dem Logout muss /lernen wieder auf /login umleiten.
    await page.goto("/lernen");
    await page.waitForURL("**/login");
  });
});