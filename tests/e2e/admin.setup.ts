import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const ADMIN_AUTH_FILE = "tests/e2e/.auth/admin.json";

const ADMIN_EMAIL = `admin+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;
const ADMIN_PASSWORD = "testpass1234";

// Diese Datei erzeugt ein eingeloggt-als-Admin Storage-State, das von den
// Admin-E2E-Tests geladen wird. Da die Admin-Förderung nur durch einen
// bestehenden Admin oder per DB-Zugriff möglich ist, nutzen wir hier den
// direkten Prisma-Zugriff (entspricht `npm run db:make-admin`).
setup("Admin-Nutzer anlegen und einloggen", async ({ page, request }) => {
  const reg = await request.post("/api/auth/register", {
    data: { name: "E2E Admin", email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(reg.ok()).toBeTruthy();

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL.toLowerCase() } });
    if (!user) throw new Error("E2E-Admin-Nutzer nicht nach Registrierung gefunden.");

    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role: "admin" } },
      create: { userId: user.id, role: "admin" },
      update: {},
    });
  } finally {
    await prisma.$disconnect();
  }

  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(ADMIN_EMAIL);
  await page.getByLabel(/^Passwort$/).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/lernen");

  const check = await page.request.get("/api/admin/users");
  await expect(check).toBeOK();
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
