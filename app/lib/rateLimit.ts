// Rate limiting utility - Upstash Redis backed (serverless-safe)
// Eski in-memory versiyonu Vercel cold start'ta state kaybediyordu;
// bu wrapper mevcut API'yi koruyarak tüm çağrıları Upstash'a yönlendiriyor.
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './queue/qstash';

export interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number; // ignored by Upstash sliding window (kept for API compat)
  skipSuccessfulRequests?: boolean; // not implemented
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  blockedUntil?: number;
}

// Cache limiter instances per (windowMs, maxAttempts) combo so repeated calls reuse
// the same Redis-backed sliding window.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(windowMs: number, maxAttempts: number): Ratelimit {
  const key = `${windowMs}:${maxAttempts}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;

  const seconds = Math.max(1, Math.round(windowMs / 1000));
  const window = `${seconds} s` as const;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxAttempts, window),
    analytics: true,
    prefix: `ratelimit:generic:${seconds}:${maxAttempts}`,
  });

  limiterCache.set(key, limiter);
  return limiter;
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const limiter = getLimiter(options.windowMs, options.maxAttempts);
    const { success, remaining, reset } = await limiter.limit(identifier);

    return {
      allowed: success,
      remainingAttempts: remaining,
      resetTime: reset,
      blockedUntil: success ? undefined : reset,
    };
  } catch (err) {
    // Redis erişilemezse fail-open (kullanıcıyı bloklamaktan iyidir); logla.
    console.error('[rateLimit] Upstash error, failing open:', err);
    return {
      allowed: true,
      remainingAttempts: options.maxAttempts,
      resetTime: Date.now() + options.windowMs,
    };
  }
}

export async function clearRateLimit(_identifier: string): Promise<void> {
  // No-op: sliding window otomatik süresi dolunca sıfırlanır.
  // (Upstash Ratelimit API'si manuel reset sunmuyor.)
}

// Helper function to get client IP from request
export function getClientIP(request: Request, headers?: Headers): string {
  const headersList = headers || new Headers();

  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');

  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  if (xRealIP) {
    return xRealIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}
