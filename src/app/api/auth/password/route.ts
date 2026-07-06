import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { AUTH_RATE_LIMIT, getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { passwordChangeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`password:${ip}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Zu viele Versuche. Bitte später erneut.");
  }

  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { passwordHash: true },
  });
  if (!me) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const ok = await verifyPassword(currentPassword, me.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Aktuelles Passwort falsch." }, { status: 401 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "Das neue Passwort muss sich vom aktuellen unterscheiden." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.sub },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
