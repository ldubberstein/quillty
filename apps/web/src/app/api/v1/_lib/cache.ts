import { Redis } from '@upstash/redis';

// Initialize Redis client for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache key prefixes
export const CACHE_KEYS = {
  feed: {
    forYou: (cursor?: string) => `feed:forYou:${cursor || 'initial'}`,
    following: (userId: string, cursor?: string) =>
      `feed:following:${userId}:${cursor || 'initial'}`,
  },
  block: (id: string) => `block:${id}`,
  pattern: (id: string) => `pattern:${id}`,
  user: (username: string) => `user:${username}`,
  notifications: {
    unreadCount: (userId: string) => `notifications:unread:${userId}`,
  },
};

// Default TTLs in seconds
export const CACHE_TTL = {
  feed: {
    forYou: 60, // 1 minute
    following: 30, // 30 seconds
  },
  block: 300, // 5 minutes
  pattern: 300, // 5 minutes
  user: 300, // 5 minutes
  notifications: 60, // 1 minute
  search: 120, // 2 minutes
};

interface CacheOptions {
  ttl?: number; // TTL in seconds
}

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set a value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const ttl = options.ttl || 300; // Default 5 minutes
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Get or set cache value with a fetcher function
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Store in cache
  await cacheSet(key, fresh, options);

  return fresh;
}

/**
 * Invalidate block-related caches
 */
export async function invalidateBlockCache(blockId: string): Promise<void> {
  await Promise.all([
    cacheDelete(CACHE_KEYS.block(blockId)),
    cacheDeletePattern('feed:*'),
  ]);
}

/**
 * Invalidate pattern-related caches
 */
export async function invalidatePatternCache(patternId: string): Promise<void> {
  await Promise.all([
    cacheDelete(CACHE_KEYS.pattern(patternId)),
    cacheDeletePattern('feed:*'),
  ]);
}

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(username: string): Promise<void> {
  await cacheDelete(CACHE_KEYS.user(username));
}

/**
 * Invalidate caches after a social action on a block (like, save)
 * This only invalidates the block cache (for updated counts), not all feeds
 */
export async function invalidateBlockSocialCache(blockId: string): Promise<void> {
  await cacheDelete(CACHE_KEYS.block(blockId));
}

/**
 * Invalidate caches after a social action on a pattern (like, save)
 * This only invalidates the pattern cache (for updated counts), not all feeds
 */
export async function invalidatePatternSocialCache(patternId: string): Promise<void> {
  await cacheDelete(CACHE_KEYS.pattern(patternId));
}

/**
 * Invalidate caches after a follow action
 * Updates user caches for both follower and followed user
 */
export async function invalidateFollowCache(
  followerUsername: string,
  followedUsername: string
): Promise<void> {
  await Promise.all([
    cacheDelete(CACHE_KEYS.user(followerUsername)),
    cacheDelete(CACHE_KEYS.user(followedUsername)),
    // Also invalidate following feeds for the follower
    cacheDeletePattern(`feed:following:*`),
  ]);
}

/**
 * Invalidate notification cache for a user
 */
export async function invalidateNotificationCache(userId: string): Promise<void> {
  await cacheDelete(CACHE_KEYS.notifications.unreadCount(userId));
}
