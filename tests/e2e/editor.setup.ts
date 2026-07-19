import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const EDITOR_AUTH_FILE = "tests/e2e/.auth/editor.json";

const EDITOR_EMAIL = `editor+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;
const EDITOR_PASSWORD = "testpass1234";

// Erzeugt ein eingeloggt-als-Editor Storage-State (Rolle "editor" – im
// Gegensatz zum Admin-Setup kann dieser Nutzer nur eigene Kurse bearbeiten).
setup("Editor-Nutzer anlegen und einloggen", async ({ page, request }) => {
  const reg = await request.post("/api/auth/register", {
    data: { name: "E2E Editor", email: EDITOR_EMAIL, password: EDITOR_PASSWORD },
  });
  expect(reg.ok()).toBeTruthy();

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: EDITOR_EMAIL.toLowerCase() } });
    if (!user) throw new Error("E2E-Editor-Nutzer nicht nach Registrierung gefunden.");

    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role: "editor" } },
      create: { userId: user.id, role: "editor" },
      update: {},
    });
  } finally {
    await prisma.$disconnect();
  }

  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(EDITOR_EMAIL);
  await page.getByLabel(/^Passwort$/).fill(EDITOR_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/lernen");

  const check = await page.request.get("/api/courses");
  await expect(check).toBeOK();
  await page.context().storageState({ path: EDITOR_AUTH_FILE });
});
