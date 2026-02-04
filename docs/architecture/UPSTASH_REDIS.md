# Upstash Redis

Upstash provides serverless Redis for caching and rate limiting in Quillty.

## Purpose

1. **Response Caching**: Cache API responses to reduce database load
2. **Rate Limiting**: Protect endpoints from abuse
3. **Session Data**: Store temporary user state (future)

## Configuration

### Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Client Setup

```typescript
// apps/web/src/app/api/v1/_lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

## Caching API

### Basic Operations

```typescript
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from './_lib/cache';

// Get cached value
const data = await cacheGet<MyType>('key');

// Set with TTL (default: 5 minutes)
await cacheSet('key', data, { ttl: 60 }); // 60 seconds

// Delete single key
await cacheDelete('key');

// Delete by pattern (e.g., invalidate all feeds)
await cacheDeletePattern('feed:*');
```

### Get-or-Set Pattern

```typescript
import { cacheGetOrSet } from './_lib/cache';

// Returns cached value or calls fetcher
const data = await cacheGetOrSet(
  'feed:forYou:0',
  async () => fetchFromDatabase(),
  { ttl: 60 }
);
```

## Cache Keys

### Key Patterns

```typescript
// apps/web/src/app/api/v1/_lib/cache.ts
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
```

### TTL Values

```typescript
export const CACHE_TTL = {
  feed: {
    forYou: 60,      // 1 minute (frequently changing)
    following: 30,   // 30 seconds (user-specific)
  },
  block: 300,        // 5 minutes
  pattern: 300,      // 5 minutes
  user: 300,         // 5 minutes
  notifications: 60, // 1 minute
  search: 120,       // 2 minutes
};
```

## Cache Invalidation

### Invalidation Functions

```typescript
// Block published → invalidate block + all feeds
await invalidateBlockCache(blockId);

// Social action (like/save) → invalidate block only
await invalidateBlockSocialCache(blockId);

// User follows someone → invalidate both users + following feeds
await invalidateFollowCache(followerUsername, followedUsername);

// Notifications read → invalidate count cache
await invalidateNotificationCache(userId);
```

### When to Invalidate

| Action | Caches Invalidated |
|--------|-------------------|
| Block created/published | Block + all feeds |
| Block liked/saved | Block only |
| Pattern created/published | Pattern + all feeds |
| User profile updated | User only |
| User followed/unfollowed | Both users + following feeds |
| Notifications read | Notification count |

## Response Headers

API responses include cache status:

```typescript
// Cache HIT
{ 'X-Cache': 'HIT' }

// Cache MISS
{ 'X-Cache': 'MISS' }
```

Response body also includes `cached: boolean` for JSON responses.

## Testing

### Unit Tests

```typescript
// apps/web/src/app/api/v1/_lib/cache.test.ts

// Mock Redis
const { mockGet, mockSet, mockDel, mockKeys } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockKeys: vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    keys: mockKeys,
  })),
}));

// Test cache operations
it('should return cached value', async () => {
  mockGet.mockResolvedValueOnce({ data: 'cached' });
  const result = await cacheGet('test-key');
  expect(result).toEqual({ data: 'cached' });
});
```

### Integration Testing

```bash
# Test cache behavior with curl
# First request - MISS
curl -s http://localhost:3000/api/v1/feed | jq '.cached'
# Output: false

# Second request within TTL - HIT
curl -s http://localhost:3000/api/v1/feed | jq '.cached'
# Output: true

# Check headers
curl -si http://localhost:3000/api/v1/feed | grep X-Cache
# First:  X-Cache: MISS
# Second: X-Cache: HIT
```

### Upstash Console

1. Go to [console.upstash.com](https://console.upstash.com/)
2. Select your Redis database
3. Use **Data Browser** to:
   - View all cached keys
   - Check TTLs
   - Manually delete keys for testing
   - Monitor commands in real-time

## Error Handling

The cache layer is designed to be resilient:

```typescript
// Errors don't propagate - cache failures are logged, not thrown
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null; // Return null on error, don't throw
  }
}
```

**Behavior on Redis failure:**
- `cacheGet` returns `null` (triggers fresh fetch)
- `cacheSet` silently fails (data still returned to user)
- `cacheDelete` silently fails (may cause stale data briefly)

## Best Practices

1. **Use short TTLs**: Start with short TTLs and increase based on data
2. **Invalidate proactively**: Invalidate on writes, don't rely on TTL expiry
3. **Log cache errors**: Track error rates to detect Redis issues
4. **Test invalidation**: Ensure cache invalidation works in all write paths
5. **Monitor hit rates**: Use Upstash analytics to track cache effectiveness

## Monitoring

### Upstash Dashboard Metrics

- **Commands/sec**: Overall Redis usage
- **Cache Hit Rate**: % of GET requests that find data
- **Memory Usage**: Monitor for growth
- **Latency**: p50/p95/p99 response times

### Key Metrics to Watch

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| Cache hit rate | > 80% | Review TTLs, invalidation |
| Latency p99 | < 50ms | Check network, key sizes |
| Error rate | < 0.1% | Check connection, quotas |
