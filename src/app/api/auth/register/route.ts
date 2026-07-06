import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { AUTH_RATE_LIMIT, getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Zu viele Registrierungsversuche. Bitte später erneut.");
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Diese E-Mail ist bereits registriert." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash },
  });

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    roles: [],
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}