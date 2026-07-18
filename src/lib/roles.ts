// Rollen-Konstanten und reine Prüf-Funktionen – frei von Server-Imports,
// damit sie auch in Client-Komponenten verwendet werden können.

export const ADMIN_ROLE = "admin";
export const EDITOR_ROLE = "editor";

export function isAdmin(user: { roles: string[] } | null | undefined): boolean {
  return !!user && user.roles.includes(ADMIN_ROLE);
}

// Ein Editor darf eigene Kurse anlegen und bearbeiten. Admins sind implizit
// auch Editoren.
export function isEditor(user: { roles: string[] } | null | undefined): boolean {
  return !!user && (user.roles.includes(EDITOR_ROLE) || isAdmin(user));
}
