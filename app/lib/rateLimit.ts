// Rate limiting utility
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blockedUntil?: number;
  };
}

const store: RateLimitStore = {};
const CLEANUP_INTERVAL = 60000; // 1 dakika

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    const entry = store[key];
    if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      delete store[key];
    }
  });
}, CLEANUP_INTERVAL);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Max attempts per window
  blockDurationMs?: number; // Block duration after max attempts (optional)
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  blockedUntil?: number;
}

export function rateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store[identifier];

  // If blocked, check if block period has expired
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil
    };
  }

  // Reset window if expired
  if (!entry || entry.resetTime <= now) {
    store[identifier] = {
      count: 1,
      resetTime: now + options.windowMs
    };
    
    return {
      allowed: true,
      remainingAttempts: options.maxAttempts - 1,
      resetTime: store[identifier].resetTime
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > options.maxAttempts) {
    // Set block period if specified
    if (options.blockDurationMs) {
      entry.blockedUntil = now + options.blockDurationMs;
    }
    
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil
    };
  }

  return {
    allowed: true,
    remainingAttempts: options.maxAttempts - entry.count,
    resetTime: entry.resetTime
  };
}

export function clearRateLimit(identifier: string): void {
  delete store[identifier];
}

// Helper function to get client IP from request
export function getClientIP(request: Request, headers?: Headers): string {
  const headersList = headers || new Headers();
  
  // Check various headers for real IP
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
