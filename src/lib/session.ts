import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "bs_lernapp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET / NEXTAUTH_SECRET ist nicht gesetzt (.env?)");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
}

export interface SessionCookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  maxAge: number;
}

export function isSecureCookie(): boolean {
  return process.env.SESSION_COOKIE_SECURE === "true";
}

export function getSessionCookieOptions(value: string, maxAge: number = SESSION_TTL_SECONDS): SessionCookieOptions {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge,
  };
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const { name, value, ...rest } = getSessionCookieOptions(token);
  cookies().set(name, value, rest);
}

export function clearSessionCookie(): void {
  const { name, value, ...rest } = getSessionCookieOptions("", 0);
  cookies().set(name, value, rest);
}

export function readSessionCookie(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = readSessionCookie();
  if (!token) return null;
  return await verifySessionToken(token);
}