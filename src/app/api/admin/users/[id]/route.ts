import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, ADMIN_ROLE } from "@/lib/auth";
import { adminUserPatchSchema as patchSchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, roles: { select: { role: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.mcqEnabled !== undefined) data.mcqEnabled = parsed.data.mcqEnabled;
  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase();
    const conflict = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (conflict && conflict.id !== params.id) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse wird bereits verwendet." },
        { status: 409 }
      );
    }
    data.email = email;
  }

  // Rollen-Änderungen: Self-Protection – ein Admin darf sich selbst die
  // Admin-Rolle nicht entziehen (verhindert das versehentliche Aussperren
  // des letzten Admins durch sich selbst).
  const currentRoles = new Set(existing.roles.map((r) => r.role));
  const toAdd = parsed.data.addRoles ?? [];
  const toRemove = parsed.data.removeRoles ?? [];
  if (toRemove.includes(ADMIN_ROLE) && params.id === guard.user.sub) {
    return NextResponse.json(
      { error: "Du kannst dir nicht selbst die Admin-Rolle entziehen." },
      { status: 400 }
    );
  }

  if (toAdd.length > 0) {
    data.roles = {
      ...(data.roles ?? {}),
      create: toAdd
        .filter((role) => !currentRoles.has(role))
        .map((role) => ({ role })),
    };
  }
  if (toRemove.length > 0) {
    data.roles = {
      ...(data.roles ?? {}),
      delete: toRemove
        .filter((role) => currentRoles.has(role))
        .map((role) => ({ userId_role: { userId: params.id, role } })),
    };
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      mcqEnabled: true,
      createdAt: true,
      roles: { select: { role: true } },
    },
  });
  return NextResponse.json({
    user: { ...updated, roles: updated.roles.map((r) => r.role) },
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  // Self-Protection: Admin darf sich nicht selbst löschen.
  if (params.id === guard.user.sub) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst löschen." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
