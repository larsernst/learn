import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

export type CourseStatus = "draft" | "published";

export interface CourseWithOwnership {
  id: string;
  status: string;
  ownerId: string | null;
}

// Rein (keine DB): darf ein Nutzer den Kurs sehen?
// true für veröffentlichte Kurse (jeder); Drafts nur für Admins, Besitzer
// und (später, Phase 2) Editoren mit Kurszuweisung.
export function canViewCourse(
  user: Pick<SessionPayload, "sub" | "roles"> | null | undefined,
  course: Pick<CourseWithOwnership, "status" | "ownerId">
): boolean {
  if (course.status === "published") return true;
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (course.ownerId !== null && course.ownerId === user.sub) return true;
  return false;
}

// Darf ein Nutzer den Kurs bearbeiten? Admins immer; sonst nur der Besitzer.
// (Phase 2 erweitert das um eine Editor-Rolle mit Kurszuweisung.)
export function canEditCourse(
  user: Pick<SessionPayload, "sub" | "roles"> | null | undefined,
  course: Pick<CourseWithOwnership, "ownerId">
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return course.ownerId !== null && course.ownerId === user.sub;
}

// Liefert die Kapitel eines Kurses in Anzeigereihenfolge.
export async function getChaptersForCourse(courseId: string) {
  return prisma.chapter.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
    },
  });
}
