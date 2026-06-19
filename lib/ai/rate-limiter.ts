/**
 * Simple in-memory rate limiter with TTL.
 * For production, use Redis-backed rate limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
const userLimits = new Map<string, RateLimitEntry>();

const IP_LIMIT_PER_HOUR = 20; // Max 20 generations per hour per IP
const USER_LIMIT_PER_HOUR = 10; // Max 10 generations per hour per user
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export function checkRateLimit(
  ip: string,
  userId?: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Check IP-level limit
  const ipEntry = ipLimits.get(ip);
  if (ipEntry && ipEntry.resetAt > now) {
    if (ipEntry.count >= IP_LIMIT_PER_HOUR) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((ipEntry.resetAt - now) / 1000),
      };
    }
    ipEntry.count++;
  } else {
    ipLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  // Check user-level limit if authenticated
  if (userId) {
    const userEntry = userLimits.get(userId);
    if (userEntry && userEntry.resetAt > now) {
      if (userEntry.count >= USER_LIMIT_PER_HOUR) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: Math.ceil((userEntry.resetAt - now) / 1000),
        };
      }
      userEntry.count++;
    } else {
      userLimits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    }
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, entry] of ipLimits.entries()) {
      if (entry.resetAt <= now) ipLimits.delete(key);
    }
    for (const [key, entry] of userLimits.entries()) {
      if (entry.resetAt <= now) userLimits.delete(key);
    }
  }

  const ipRemaining = IP_LIMIT_PER_HOUR - (ipLimits.get(ip)?.count || 0);
  const userRemaining = userId
    ? USER_LIMIT_PER_HOUR - (userLimits.get(userId)?.count || 0)
    : IP_LIMIT_PER_HOUR;

  return {
    allowed: true,
    remaining: Math.min(ipRemaining, userRemaining),
    resetIn: 0,
  };
}

export function resetUserLimit(userId: string): void {
  userLimits.delete(userId);
}
