import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { SettingsPatch } from "@/lib/types";

const schema = z.object({
  mcqEnabled: z.boolean().optional(),
  simpleGrading: z.boolean().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true, simpleGrading: true },
  });
  return NextResponse.json({
    mcqEnabled: me?.mcqEnabled ?? true,
    simpleGrading: me?.simpleGrading ?? false,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const data: SettingsPatch = {};
  if (parsed.data.mcqEnabled !== undefined) data.mcqEnabled = parsed.data.mcqEnabled;
  if (parsed.data.simpleGrading !== undefined) data.simpleGrading = parsed.data.simpleGrading;
  const me = await prisma.user.update({
    where: { id: user.sub },
    data,
    select: { mcqEnabled: true, simpleGrading: true },
  });
  return NextResponse.json({ mcqEnabled: me.mcqEnabled, simpleGrading: me.simpleGrading });
}
