import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { AUTH_RATE_LIMIT, getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Zu viele Anmeldeversuche. Bitte später erneut.");
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { roles: { select: { role: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "E-Mail oder Passwort falsch." }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "E-Mail oder Passwort falsch." }, { status: 401 });
  }

  const roles = user.roles.map((r) => r.role);
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    roles,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}