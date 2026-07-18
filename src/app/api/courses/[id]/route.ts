import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { coursePatchSchema } from "@/lib/validation";
import type { CourseStatus } from "@/lib/course-access";

type Params = { params: { id: string } };

async function loadCourseForEdit(id: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true, description: true, order: true, status: true, ownerId: true },
  });
  if (!course) return null;
  return course;
}

export async function GET(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await loadCourseForEdit(params.id, guard.user.sub);
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({ course });
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await loadCourseForEdit(params.id, guard.user.sub);
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const parsed = coursePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data: {
    title?: string;
    description?: string;
    slug?: string;
    status?: string;
    order?: number;
    published?: boolean;
  } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.slug !== undefined) {
    // Slug-Eindeutigkeit prüfen (außer diesem Kurs).
    const conflict = await prisma.course.findFirst({
      where: { slug: parsed.data.slug, NOT: { id: params.id } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "Slug wird bereits verwendet." }, { status: 409 });
    }
    data.slug = parsed.data.slug;
  }
  if (parsed.data.status !== undefined) {
    const status: CourseStatus = parsed.data.status;
    data.status = status;
    data.published = status === "published";
  }
  if (parsed.data.order !== undefined) data.order = parsed.data.order;

  const updated = await prisma.course.update({
    where: { id: params.id },
    data,
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
  return NextResponse.json({ course: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await loadCourseForEdit(params.id, guard.user.sub);
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  // Kaskadierendes Löschen: Chapter + Questions + Reviews werden über die
  // Prisma-Relationen (onDelete: Cascade / SetNull) automatisch entfernt.
  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
