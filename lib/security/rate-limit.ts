interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  blockMs?: number;
}

interface Bucket {
  attempts: number;
  windowStart: number;
  blockedUntil: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

type BucketStore = Map<string, Bucket>;

declare global {
  var securityRateLimitStore: BucketStore | undefined;
}

const store: BucketStore = global.securityRateLimitStore ?? new Map();
global.securityRateLimitStore = store;

let cleanupCounter = 0;

function cleanup(now: number): void {
  cleanupCounter += 1;
  if (cleanupCounter % 200 !== 0) return;

  for (const [key, bucket] of store.entries()) {
    const stale =
      bucket.blockedUntil < now && now - bucket.windowStart > 60 * 60 * 1000;
    if (stale) {
      store.delete(key);
    }
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = store.get(key) ?? {
    attempts: 0,
    windowStart: now,
    blockedUntil: 0,
  };

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  if (now - bucket.windowStart >= options.windowMs) {
    bucket.attempts = 0;
    bucket.windowStart = now;
    bucket.blockedUntil = 0;
  }

  bucket.attempts += 1;
  store.set(key, bucket);

  if (bucket.attempts > options.maxAttempts) {
    if (options.blockMs && options.blockMs > 0) {
      bucket.blockedUntil = now + options.blockMs;
      store.set(key, bucket);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(options.blockMs / 1000),
      };
    }

    const retryAfter = options.windowMs - (now - bucket.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfter / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
