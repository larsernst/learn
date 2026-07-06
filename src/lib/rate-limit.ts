interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
  limit: number;
}

function sweep(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return { ok: true, retryAfterSec: 0, remaining: limit, limit };
  }
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0, remaining: limit - 1, limit };
  }
  if (b.count < limit) {
    b.count += 1;
    return { ok: true, retryAfterSec: 0, remaining: limit - b.count, limit };
  }
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    remaining: 0,
    limit,
  };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitResponse(retryAfterSec: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
    },
  });
}

export const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
