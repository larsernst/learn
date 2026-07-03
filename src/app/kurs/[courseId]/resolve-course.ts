import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export interface ResolvedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
}

export async function resolveCourse(param: string): Promise<ResolvedCourse> {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: param }, { slug: param }],
      published: true,
    },
  });
  if (!course) notFound();
  return course;
}
