import { afterEach, describe, expect, it } from "vitest";
import {
  verifySessionToken,
  createSessionToken,
  getSessionCookieOptions,
  isSecureCookie,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/session";

const SECRET = "test-secret-do-not-use-in-production";

afterEach(() => {
  delete process.env.SESSION_COOKIE_SECURE;
  delete process.env.JWT_SECRET;
  delete process.env.NEXTAUTH_SECRET;
});

describe("session token (jose)", () => {
  it("round-trips a token and returns the payload", async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.NEXTAUTH_SECRET = SECRET;
    const token = await createSessionToken({
      sub: "user_1",
      email: "max@example.org",
      name: "Max",
    });
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user_1");
    expect(payload?.email).toBe("max@example.org");
    expect(payload?.name).toBe("Max");
  });

  it("returns null for a tampered token", async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.NEXTAUTH_SECRET = SECRET;
    const bad = (await createSessionToken({ sub: "x", email: "y", name: "z" })) + "tamper";
    expect(await verifySessionToken(bad)).toBeNull();
  });

  it("returns null when no secret is configured", async () => {
    delete process.env.JWT_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(await verifySessionToken("some.token.value")).toBeNull();
  });
});

describe("session cookie options (secure-flag regression)", () => {
  it("defaults to secure=false so HTTP deployments can log in", () => {
    delete process.env.SESSION_COOKIE_SECURE;
    expect(isSecureCookie()).toBe(false);
    const opts = getSessionCookieOptions("tok");
    expect(opts.secure).toBe(false);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.name).toBe(SESSION_COOKIE);
    expect(opts.value).toBe("tok");
    expect(opts.maxAge).toBe(SESSION_TTL_SECONDS);
  });

  it("opts into secure cookies only when SESSION_COOKIE_SECURE=true", () => {
    process.env.SESSION_COOKIE_SECURE = "true";
    expect(isSecureCookie()).toBe(true);
    expect(getSessionCookieOptions("tok").secure).toBe(true);
  });

  it("treats any non-'true' value as not secure", () => {
    process.env.SESSION_COOKIE_SECURE = "false";
    expect(isSecureCookie()).toBe(false);
    process.env.SESSION_COOKIE_SECURE = "1";
    expect(isSecureCookie()).toBe(false);
  });

  it("uses maxAge=0 for the clear-cookie options", () => {
    const opts = getSessionCookieOptions("", 0);
    expect(opts.maxAge).toBe(0);
    expect(opts.value).toBe("");
  });
});