import { test, expect } from "@playwright/test";

// Diese Tests laufen als authentifizierter Admin (Storage-State aus
// admin.setup.ts). Sie prüfen den positiven Admin-Pfad sowie die
// Self-Protection-Guards.

test.describe("Admin-Bereich (authentifiziert)", () => {
  test("Admin-Seite lädt und Nutzerliste ist sichtbar", async ({ page, request }) => {
    const res = await request.get("/api/admin/users");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.users)).toBeTruthy();

    await page.goto("/admin/nutzer");
    await expect(page.getByRole("heading", { name: /Nutzer/ })).toBeVisible();
    await expect(page.getByLabel("Suche")).toBeVisible();
  });

  test("Admin kann Nutzerliste durchsuchen", async ({ page }) => {
    await page.goto("/admin/nutzer");
    // Warten, bis die Nutzerliste geladen ist (Anzahl-Span erscheint).
    await expect(page.locator("span.muted", { hasText: /\d+ Nutzer/ })).toBeVisible({
      timeout: 15000,
    });

    await page.getByLabel("Suche").fill("gibt-es-nicht-xyz");
    await expect(page.getByText("Keine Nutzer gefunden.")).toBeVisible({ timeout: 20000 });
  });

  test("Self-Protection: Admin kann sich nicht selbst die Admin-Rolle entziehen", async ({ request }) => {
    const me = await request.get("/api/auth/me");
    const meBody = await me.json();
    const myId = meBody.user.sub;

    const res = await request.patch(`/api/admin/users/${myId}`, {
      data: { removeRoles: ["admin"] },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Admin-Rolle entziehen/);
  });

  test("Self-Protection: Admin kann sich nicht selbst löschen", async ({ request }) => {
    const me = await request.get("/api/auth/me");
    const meBody = await me.json();
    const myId = meBody.user.sub;

    const res = await request.delete(`/api/admin/users/${myId}`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/selbst löschen/);
  });

  test("Admin kann einen fremden Nutzer bearbeiten", async ({ request }) => {
    const list = await request.get("/api/admin/users");
    const { users } = await list.json();
    const target = users.find(
      (u: { id: string; email: string; roles: string[] }) =>
        u.email.endsWith("@e2e.test") && !u.roles.includes("admin")
    );

    if (!target) {
      test.skip(true, "Kein passender Fremd-Nutzer vorhanden.");
      return;
    }

    const newName = `Bearbeitet ${Date.now()}`;
    const res = await request.patch(`/api/admin/users/${target.id}`, {
      data: { name: newName },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.name).toBe(newName);
  });
});
