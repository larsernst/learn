import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);

// Ziel-DB für Integrationstests: explizit via INTEGRATION_DATABASE_URL,
// sonst DATABASE_URL mit dem Suffix "_integration" abgeleitet. So kollidieren
// die Tests nicht mit einer laufenden Entwicklungs-Datenbank.
export function integrationDbUrl(): string | null {
  if (process.env.INTEGRATION_DATABASE_URL) {
    return process.env.INTEGRATION_DATABASE_URL;
  }
  const base = process.env.DATABASE_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.pathname = `${url.pathname.replace(/\/$/, "")}_integration`;
    return url.toString();
  } catch {
    return null;
  }
}

// Legt die Test-Datenbank an, falls sie fehlt (verbindet sich dazu auf die
// Maintenance-DB "postgres" desselben Servers). Rückgabe: false, wenn der
// Server nicht erreichbar ist – die Suites überspringen dann.
export async function ensureIntegrationDb(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const dbName = u.pathname.replace(/^\//, "");
    if (!dbName) return false;
    const adminUrl = new URL(u.toString());
    adminUrl.pathname = "/postgres";
    const admin = new PrismaClient({
      datasources: { db: { url: adminUrl.toString() } },
    });
    try {
      const rows = await admin.$queryRawUnsafe<{ datname: string }[]>(
        "SELECT datname FROM pg_database WHERE datname = $1",
        dbName
      );
      if (rows.length === 0) {
        await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
      }
    } finally {
      await admin.$disconnect();
    }
    return true;
  } catch {
    return false;
  }
}

// Führt ein Repo-Skript (prisma CLI oder tsx-Skript) gegen die Test-DB aus.
export async function runScript(
  args: string[],
  dbUrl: string
): Promise<{ code: number; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("npx", args, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      timeout: 90_000,
    });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (e) {
    const err = e as { code?: number; stdout?: string; stderr?: string };
    return {
      code: err.code ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

export function prismaFor(dbUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: dbUrl } } });
}

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "ReviewEvent", "Review", "Question", "Chapter", "Course", "UserRole", "User", "AppSetting" RESTART IDENTITY CASCADE'
  );
}
