import { getCurrentUser, type SessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Re-export der rollen-spezifischen Konstanten/Checks aus roles.ts (server-
// und client-tauglich). Server-Konsumenten importieren weiter aus auth.ts;
// Client-Komponenten importieren direkt aus roles.ts.
export { ADMIN_ROLE, EDITOR_ROLE, isAdmin, isEditor } from "@/lib/roles";
import { isAdmin, isEditor } from "@/lib/roles";

// Liefert den aktuellen Nutzer mit frisch aus der DB geladenen Rollen.
// Rollen werden pro Request aus der DB gelesen (nicht nur dem JWT vertraut),
// damit ein entzogener Admin sofort gesperrt ist.
export async function getCurrentUserWithRoles(): Promise<SessionPayload | null> {
  const base = await getCurrentUser();
  if (!base) return null;

  const roleRows = await prisma.userRole.findMany({
    where: { userId: base.sub },
    select: { role: true },
  });
  return { ...base, roles: roleRows.map((r) => r.role) };
}

export type GuardResult =
  | { ok: true; user: SessionPayload }
  | { ok: false; response: NextResponse };

// Schuetzt API-Routen: 401 wenn nicht eingeloggt, 403 wenn kein Admin.
export async function requireAdminApi(): Promise<GuardResult> {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (!isAdmin(user)) {
    return { ok: false, response: NextResponse.json({ error: "Keine Admin-Berechtigung." }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Schuetzt Server-Component-Seiten: leitet Nicht-Angemeldete zu /login,
// angemeldete Nicht-Admins zu / weiter. Gibt bei Admins den User zurueck.
export async function requireAdminPage(): Promise<SessionPayload> {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");
  return user;
}

// Schuetzt API-Routen für Editoren: 401 wenn nicht eingeloggt, 403 wenn weder
// Editor noch Admin.
export async function requireEditorApi(): Promise<GuardResult> {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (!isEditor(user)) {
    return { ok: false, response: NextResponse.json({ error: "Keine Editor-Berechtigung." }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Schuetzt Server-Component-Seiten für Editoren: leitet Nicht-Angemeldete zu
// /login, angemeldete ohne Editor-Recht zu / weiter.
export async function requireEditorPage(): Promise<SessionPayload> {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  if (!isEditor(user)) redirect("/");
  return user;
}
