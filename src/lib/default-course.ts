import { prisma } from "@/lib/prisma";

export type CourseSection =
  | "lernen"
  | "pruefung"
  | "fortschritt"
  | "statistik"
  | "katalog";

// Ziel der alten Top-Level-Routen: der erste veröffentlichte Kurs
// (per order). Ohne veröffentlichte Kurse Fallback auf die Übersicht.
export async function getDefaultCoursePath(
  section: CourseSection
): Promise<string> {
  const course = await prisma.course.findFirst({
    where: { status: "published" },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  return course ? `/kurs/${course.id}/${section}` : "/";
}

// Hängt übergebene Query-Parameter (z. B. ?deck=difficult) an einen Pfad an,
// damit Legacy-Redirects sie nicht verschlucken.
export function withQuery(
  path: string,
  searchParams: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
