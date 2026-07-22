import { describe, expect, it } from "vitest";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

let n = 0;
const key = () => `test:${n++}`; // eindeutiger Schlüssel pro Test -> keine Kontamination

describe("rateLimit (fixed window)", () => {
  it("allows requests up to the limit within the window", () => {
    const k = key();
    const now = 1_000_000;
    const r1 = rateLimit(k, 3, 60_000, now);
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(k, 3, 60_000, now + 1_000);
    expect(r2.ok).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(k, 3, 60_000, now + 2_000);
    expect(r3.ok).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests beyond the limit and reports retry-after", () => {
    const k = key();
    const now = 2_000_000;
    rateLimit(k, 2, 60_000, now);
    rateLimit(k, 2, 60_000, now + 1);
    const blocked = rateLimit(k, 2, 60_000, now + 2);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("resets after the window elapses", () => {
    const k = key();
    const now = 3_000_000;
    rateLimit(k, 1, 1_000, now);
    const blocked = rateLimit(k, 1, 1_000, now + 1);
    expect(blocked.ok).toBe(false);
    const after = rateLimit(k, 1, 1_000, now + 2_000);
    expect(after.ok).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    const now = 4_000_000;
    const a1 = rateLimit("indep:a", 1, 60_000, now);
    const b1 = rateLimit("indep:b", 1, 60_000, now);
    expect(a1.ok).toBe(true);
    expect(b1.ok).toBe(true);
    const a2 = rateLimit("indep:a", 1, 60_000, now + 1);
    expect(a2.ok).toBe(false);
  });
});

describe("getClientIp", () => {
  const original = process.env.TRUST_PROXY;

  it("ignoriert x-forwarded-for ohne TRUST_PROXY", () => {
    delete process.env.TRUST_PROXY;
    const req = new Request("https://x/", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("unknown");
  });

  it("reads the first IP from x-forwarded-for when TRUST_PROXY=true", () => {
    process.env.TRUST_PROXY = "true";
    const req = new Request("https://x/", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when TRUST_PROXY=true", () => {
    process.env.TRUST_PROXY = "true";
    const req = new Request("https://x/", {
      headers: { "x-real-ip": "198.51.100.9" },
    });
    expect(getClientIp(req)).toBe("198.51.100.9");
  });

  it("returns 'unknown' when no IP header is present", () => {
    delete process.env.TRUST_PROXY;
    const req = new Request("https://x/");
    expect(getClientIp(req)).toBe("unknown");
  });

  afterAll(() => {
    if (original === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original;
  });
});