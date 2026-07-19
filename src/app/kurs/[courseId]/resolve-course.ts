import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { canViewCourse } from "@/lib/course-access";
import type { SessionPayload } from "@/lib/session";

export interface ResolvedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  status: string;
  ownerId: string | null;
}

interface ResolveOptions {
  viewer?: Pick<SessionPayload, "sub" | "roles"> | null;
}

// Löst einen Kurs anhand id ODER slug auf. Ohne viewer wird nur nach
// veröffentlichten Kursen gesucht (abwärtskompatibel zum bisherigen Verhalten).
// Mit viewer darf dieser auch eigene (oder als Admin beliebige) Draft-Kurse
// erreichen – sonst nichtFound().
export async function resolveCourse(
  param: string,
  opts: ResolveOptions = {}
): Promise<ResolvedCourse> {
  const viewer = opts.viewer;
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: param }, { slug: param }],
      ...(viewer ? {} : { status: "published" }),
    },
  });
  if (!course) notFound();
  if (viewer && !canViewCourse(viewer, course)) notFound();
  return course;
}
