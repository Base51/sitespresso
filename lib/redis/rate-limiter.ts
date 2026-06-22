import { getRedisClient } from '@/lib/redis/client';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds to wait before retry (if rate limited)
};

/**
 * Plan-based quota limits (generations per month)
 */
const PLAN_QUOTAS = {
  free: 3, // Free users: 3 generations/month
  starter: 50, // Starter: 50 generations/month
  pro: 500, // Pro: 500 generations/month
  agency: 5000, // Agency: 5000 generations/month
} as const;

/**
 * Rate limit a user or IP address with plan-based quotas
 * Uses Redis if available, falls back to in-memory Map
 */
export async function checkRateLimit(
  userId: string | null,
  userPlan: 'free' | 'starter' | 'pro' | 'agency' = 'free',
  ipAddress: string | null = null
): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  const now = Math.floor(Date.now() / 1000);
  const monthStart = getMonthStart(now);
  const monthEnd = monthStart + 30 * 24 * 60 * 60; // 30 days from month start

  // Determine the key and limit based on whether user is authenticated
  let key: string;
  let limit: number;

  if (userId) {
    // Authenticated user: use plan-based monthly quota
    key = `quota:user:${userId}:${monthStart}`;
    limit = PLAN_QUOTAS[userPlan];
  } else if (ipAddress) {
    // Anonymous user: use strict hourly IP-based limit
    const hourStart = Math.floor(now / 3600) * 3600;
    key = `ratelimit:ip:${ipAddress}:${hourStart}`;
    limit = 5; // 5 generations per hour for anonymous
  } else {
    // No user ID and no IP: reject
    return {
      allowed: false,
      remaining: 0,
      resetTime: monthEnd,
      retryAfter: 3600,
    };
  }

  if (redis) {
    try {
      // Use Redis for distributed rate limiting
      const current = await redis.incr(key);

      // Set expiration on first increment
      if (current === 1) {
        const ttl = userId ? monthEnd - now : 3600; // Month for users, 1 hour for IPs
        await redis.expire(key, ttl);
      }

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);

      return {
        allowed,
        remaining,
        resetTime: userId ? monthEnd : Math.floor(now / 3600) * 3600 + 3600,
        retryAfter: allowed ? undefined : 60,
      };
    } catch (err) {
      console.error('Redis rate limit error, falling back to in-memory:', err);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (not suitable for production)
  const inMemoryKey = `fallback:${key}`;
  const store = getRateLimitStore();
  const current = (store.get(inMemoryKey) ?? 0) + 1;
  store.set(inMemoryKey, current);

  // Clean up after 1 hour
  setTimeout(() => store.delete(inMemoryKey), userId ? 30 * 24 * 60 * 60 * 1000 : 3600000);

  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);

  return {
    allowed,
    remaining,
    resetTime: userId ? monthEnd : Math.floor(now / 3600) * 3600 + 3600,
    retryAfter: allowed ? undefined : 60,
  };
}

/**
 * Get the Unix timestamp (seconds) for the start of the current month
 */
function getMonthStart(unixSeconds: number): number {
  const date = new Date(unixSeconds * 1000);
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);
}

/**
 * In-memory fallback store for rate limiting when Redis is unavailable
 */
let inMemoryStore: Map<string, number> | null = null;

function getRateLimitStore(): Map<string, number> {
  if (!inMemoryStore) {
    inMemoryStore = new Map();
  }
  return inMemoryStore;
}
