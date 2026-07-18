import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi, isAdmin } from "@/lib/auth";
import { courseCreateSchema } from "@/lib/validation";
import type { CourseStatus } from "@/lib/course-access";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "kurs";
  let suffix = 1;
  while (await prisma.course.findUnique({ where: { slug }, select: { id: true } })) {
    suffix++;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function GET() {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const where = isAdmin(guard.user) ? {} : { ownerId: guard.user.sub };
  const courses = await prisma.course.findMany({
    where,
    orderBy: [{ order: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { questions: true } },
    },
  });
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const parsed = courseCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const slugBase = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  const slug = await uniqueSlug(slugBase);
  const status: CourseStatus = parsed.data.status ?? "draft";
  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });

  const course = await prisma.course.create({
    data: {
      id: `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      slug,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      order: (maxOrder._max.order ?? 0) + 1,
      ownerId: guard.user.sub,
      status,
      published: status === "published",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
      status: true,
      ownerId: true,
    },
  });
  return NextResponse.json({ course });
}
