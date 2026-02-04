import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit tiers
export const rateLimiters = {
  // General API calls: 100/minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:api',
  }),

  // Create operations: 20/minute
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:create',
  }),

  // Publish: 5/minute
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:publish',
  }),

  // Social actions (like, follow): 60/minute
  social: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:social',
  }),

  // Comments: 10/minute
  comments: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:comments',
  }),

  // Search: 30/minute
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: '@quillty/ratelimit:search',
  }),
};

export type RateLimitTier = keyof typeof rateLimiters;

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

/**
 * Check rate limit for a request.
 * @param request - The Next.js request object
 * @param tier - The rate limit tier to use
 * @param identifier - Optional custom identifier (defaults to IP or user ID)
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier,
  identifier?: string
): Promise<RateLimitResult> {
  // Use provided identifier, or fall back to IP address
  const id =
    identifier ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  const limiter = rateLimiters[tier];
  const result = await limiter.limit(id);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = Math.ceil(
      (result.reset - Date.now()) / 1000
    ).toString();
  }

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    headers,
  };
}
