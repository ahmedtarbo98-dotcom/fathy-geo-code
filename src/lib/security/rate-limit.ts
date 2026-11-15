/**
 * Dual-layer Rate Limiter for FATHY GEO CODE platform
 * 1. Primary: Upstash Redis REST API (zero extra package required, works on Vercel Edge & Serverless)
 * 2. Fallback: In-memory sliding window cache (for local dev, staging, or before Upstash keys are added)
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

// In-memory fallback cache
const memoryCache = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale memory entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    memoryCache.forEach((value, key) => {
      if (value.resetAt < now) {
        memoryCache.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check rate limit for a given key
 * @param identifier Unique key (e.g., `login:${ip}`, `register:${ip}`)
 * @param limit Maximum allowed requests in window
 * @param windowSeconds Window length in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. If Upstash Redis credentials exist, use Redis REST API
  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      // Execute INCR and EXPIRE in a single pipeline
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds, "NX"],
          ["TTL", key],
        ]),
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        // data looks like: [{ result: 1 }, { result: 1 }, { result: 59 }]
        const count = Number(data[0]?.result || 1);
        const ttl = Number(data[2]?.result || windowSeconds);
        const reset = Math.floor(Date.now() / 1000) + Math.max(ttl, 1);

        return {
          success: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          reset,
        };
      }
    } catch (redisErr) {
      console.warn("Upstash rate limit fallback to memory cache:", redisErr);
    }
  }

  // 2. In-Memory fallback rate limiter
  const now = Date.now();
  const entry = memoryCache.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryCache.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
    };
  }

  entry.count += 1;
  const success = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return {
    success,
    limit,
    remaining,
    reset: Math.floor(entry.resetAt / 1000),
  };
}

/**
 * Helper to extract client IP safely across Vercel / Cloudflare / local headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}
