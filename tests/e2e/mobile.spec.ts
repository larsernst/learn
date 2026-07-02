import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

test.describe("Mobile (iPhone 12 – 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Hamburger oeffnet und navigiert zu /lernen", async ({ page }) => {
    const email = unique("mobile");
    await page.request.post("/api/auth/register", {
      data: { name: "Mobile", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Auf Desktop-Seite angekommen; Hamburger sollte sichtbar sein.
    await expect(page.locator(".mobile-nav-toggle")).toBeVisible();
    // Topnav-Links sollten versteckt sein.
    await expect(page.locator(".topnav__links")).toBeHidden();

    // Hamburger oeffnen
    await page.locator(".mobile-nav-toggle").click();
    await expect(page.locator(".mobile-nav-panel")).toBeVisible();

    // Ueber Menue zu /katalog navigieren
    await page.locator(".mobile-nav-link", { hasText: "Katalog" }).click();
    await page.waitForURL("**/katalog");
    await expect(page.getByRole("heading", { name: "Alle Fragen" })).toBeVisible();
    // Panel ist nach Klick geschlossen
    await expect(page.locator(".mobile-nav-panel")).toBeHidden();
  });

  test("Lern-Sitzung ist auf Mobile nutzbar (kein horizontaler Overflow)", async ({ page }) => {
    const email = unique("mobsess");
    await page.request.post("/api/auth/register", {
      data: { name: "MobSess", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Pruefe auf horizontalen Overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // Eine Karte anzeigen lassen
    const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
    const auswerten = page.getByRole("button", { name: "Auswerten" });
    const showVisible = await reveal.isVisible().catch(() => false);
    const evalVisible = await auswerten.isVisible().catch(() => false);
    expect(showVisible || evalVisible).toBeTruthy();
  });

  test("Homepage ohne horizontalen Overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("Registrierungsseite ohne horizontalen Overflow", async ({ page }) => {
    await page.goto("/registrieren");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});