// Lightweight in-memory sliding-window rate limiter.
// Runs inside the server function / server route handler. Per-instance state —
// good enough to blunt casual abuse and small DDoS bursts against paid AI
// endpoints. For serious volumetric attacks the edge/CDN layer should also
// throttle upstream.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Housekeeping so the map cannot grow forever.
const MAX_KEYS = 5000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetInSec: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  const ok = b.count <= limit;
  const remaining = Math.max(0, limit - b.count);
  const resetInSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));

  if (buckets.size > MAX_KEYS) {
    // Drop expired entries lazily.
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
      if (buckets.size <= MAX_KEYS) break;
    }
  }

  return { ok, remaining, resetInSec };
}

// Extract a stable-ish client identifier from a Request. Prefers the first
// entry in X-Forwarded-For (edge-set), falls back to CF-Connecting-IP, then
// the socket address if present.
export function clientKey(req: Request, extra = ""): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for") ?? "";
  const ip =
    xff.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    "anon";
  return `${ip}::${extra}`;
}

export function tooManyResponse(resetInSec: number) {
  return new Response(
    JSON.stringify({
      error:
        "You're doing that a bit too often. Please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(resetInSec),
      },
    },
  );
}
