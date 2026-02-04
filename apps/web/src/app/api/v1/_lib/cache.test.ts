import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockGet, mockSet, mockDel, mockKeys } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockKeys: vi.fn(),
}));

// Mock Redis before importing cache module
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    keys: mockKeys,
  })),
}));

import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheGetOrSet,
  invalidateBlockCache,
  invalidatePatternCache,
  invalidateUserCache,
  invalidateBlockSocialCache,
  invalidatePatternSocialCache,
  invalidateFollowCache,
  invalidateNotificationCache,
  CACHE_KEYS,
  CACHE_TTL,
} from './cache';

describe('Cache Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cacheGet', () => {
    it('should return cached value', async () => {
      mockGet.mockResolvedValueOnce({ data: 'cached' });

      const result = await cacheGet<{ data: string }>('test-key');

      expect(mockGet).toHaveBeenCalledWith('test-key');
      expect(result).toEqual({ data: 'cached' });
    });

    it('should return null on cache miss', async () => {
      mockGet.mockResolvedValueOnce(null);

      const result = await cacheGet('test-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheGet('test-key');

      expect(result).toBeNull();
    });
  });

  describe('cacheSet', () => {
    it('should set value with default TTL', async () => {
      mockSet.mockResolvedValueOnce('OK');

      await cacheSet('test-key', { data: 'value' });

      expect(mockSet).toHaveBeenCalledWith('test-key', { data: 'value' }, { ex: 300 });
    });

    it('should set value with custom TTL', async () => {
      mockSet.mockResolvedValueOnce('OK');

      await cacheSet('test-key', { data: 'value' }, { ttl: 60 });

      expect(mockSet).toHaveBeenCalledWith('test-key', { data: 'value' }, { ex: 60 });
    });

    it('should handle errors gracefully', async () => {
      mockSet.mockRejectedValueOnce(new Error('Redis error'));

      // Should not throw
      await cacheSet('test-key', { data: 'value' });
    });
  });

  describe('cacheDelete', () => {
    it('should delete key', async () => {
      mockDel.mockResolvedValueOnce(1);

      await cacheDelete('test-key');

      expect(mockDel).toHaveBeenCalledWith('test-key');
    });
  });

  describe('cacheDeletePattern', () => {
    it('should delete all matching keys', async () => {
      mockKeys.mockResolvedValueOnce(['feed:1', 'feed:2', 'feed:3']);
      mockDel.mockResolvedValueOnce(3);

      await cacheDeletePattern('feed:*');

      expect(mockKeys).toHaveBeenCalledWith('feed:*');
      expect(mockDel).toHaveBeenCalledWith('feed:1', 'feed:2', 'feed:3');
    });

    it('should not call del if no keys match', async () => {
      mockKeys.mockResolvedValueOnce([]);

      await cacheDeletePattern('nonexistent:*');

      expect(mockDel).not.toHaveBeenCalled();
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value if exists', async () => {
      mockGet.mockResolvedValueOnce({ data: 'cached' });

      const fetcher = vi.fn().mockResolvedValue({ data: 'fresh' });
      const result = await cacheGetOrSet('test-key', fetcher);

      expect(result).toEqual({ data: 'cached' });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not cached', async () => {
      mockGet.mockResolvedValueOnce(null);
      mockSet.mockResolvedValueOnce('OK');

      const fetcher = vi.fn().mockResolvedValue({ data: 'fresh' });
      const result = await cacheGetOrSet('test-key', fetcher);

      expect(result).toEqual({ data: 'fresh' });
      expect(fetcher).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith('test-key', { data: 'fresh' }, { ex: 300 });
    });
  });
});

describe('Cache Invalidation Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invalidateBlockCache', () => {
    it('should invalidate block and all feeds', async () => {
      mockDel.mockResolvedValue(1);
      mockKeys.mockResolvedValueOnce(['feed:forYou:0', 'feed:following:user1:0']);

      await invalidateBlockCache('block-123');

      expect(mockDel).toHaveBeenCalledWith('block:block-123');
      expect(mockKeys).toHaveBeenCalledWith('feed:*');
    });
  });

  describe('invalidatePatternCache', () => {
    it('should invalidate pattern and all feeds', async () => {
      mockDel.mockResolvedValue(1);
      mockKeys.mockResolvedValueOnce(['feed:forYou:0']);

      await invalidatePatternCache('pattern-123');

      expect(mockDel).toHaveBeenCalledWith('pattern:pattern-123');
      expect(mockKeys).toHaveBeenCalledWith('feed:*');
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate user cache', async () => {
      mockDel.mockResolvedValue(1);

      await invalidateUserCache('testuser');

      expect(mockDel).toHaveBeenCalledWith('user:testuser');
    });
  });

  describe('invalidateBlockSocialCache', () => {
    it('should only invalidate block cache', async () => {
      mockDel.mockResolvedValue(1);

      await invalidateBlockSocialCache('block-123');

      expect(mockDel).toHaveBeenCalledWith('block:block-123');
      expect(mockDel).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidatePatternSocialCache', () => {
    it('should only invalidate pattern cache', async () => {
      mockDel.mockResolvedValue(1);

      await invalidatePatternSocialCache('pattern-123');

      expect(mockDel).toHaveBeenCalledWith('pattern:pattern-123');
      expect(mockDel).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateFollowCache', () => {
    it('should invalidate both users and following feeds', async () => {
      mockDel.mockResolvedValue(1);
      mockKeys.mockResolvedValueOnce(['feed:following:user1:0']);

      await invalidateFollowCache('follower', 'followed');

      expect(mockDel).toHaveBeenCalledWith('user:follower');
      expect(mockDel).toHaveBeenCalledWith('user:followed');
      expect(mockKeys).toHaveBeenCalledWith('feed:following:*');
    });
  });

  describe('invalidateNotificationCache', () => {
    it('should invalidate notification cache', async () => {
      mockDel.mockResolvedValue(1);

      await invalidateNotificationCache('user-123');

      expect(mockDel).toHaveBeenCalledWith('notifications:unread:user-123');
    });
  });
});

describe('CACHE_KEYS', () => {
  it('should generate correct feed keys', () => {
    expect(CACHE_KEYS.feed.forYou('0')).toBe('feed:forYou:0');
    expect(CACHE_KEYS.feed.forYou()).toBe('feed:forYou:initial');
    expect(CACHE_KEYS.feed.following('user-1', '2')).toBe('feed:following:user-1:2');
  });

  it('should generate correct entity keys', () => {
    expect(CACHE_KEYS.block('block-123')).toBe('block:block-123');
    expect(CACHE_KEYS.pattern('pattern-123')).toBe('pattern:pattern-123');
    expect(CACHE_KEYS.user('testuser')).toBe('user:testuser');
  });

  it('should generate correct notification keys', () => {
    expect(CACHE_KEYS.notifications.unreadCount('user-1')).toBe('notifications:unread:user-1');
  });
});

describe('CACHE_TTL', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.feed.forYou).toBe(60);
    expect(CACHE_TTL.feed.following).toBe(30);
    expect(CACHE_TTL.block).toBe(300);
    expect(CACHE_TTL.pattern).toBe(300);
    expect(CACHE_TTL.user).toBe(300);
    expect(CACHE_TTL.notifications).toBe(60);
    expect(CACHE_TTL.search).toBe(120);
  });
});

describe('Cache Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache HIT/MISS Flow', () => {
    it('should demonstrate MISS then HIT pattern', async () => {
      const freshData = { items: [1, 2, 3], timestamp: Date.now() };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      // First call: Cache MISS - fetch and store
      mockGet.mockResolvedValueOnce(null);
      mockSet.mockResolvedValueOnce('OK');

      const result1 = await cacheGetOrSet('feed:forYou:0', fetcher, { ttl: 60 });

      expect(result1).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('feed:forYou:0');
      expect(mockSet).toHaveBeenCalledWith('feed:forYou:0', freshData, { ex: 60 });

      // Second call: Cache HIT - return cached, skip fetcher
      mockGet.mockResolvedValueOnce(freshData);

      const result2 = await cacheGetOrSet('feed:forYou:0', fetcher, { ttl: 60 });

      expect(result2).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(mockSet).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('Cache Invalidation on Write Operations', () => {
    it('should invalidate block cache when liked', async () => {
      // Setup: Block is cached
      const cachedBlock = { id: 'block-1', like_count: 5 };
      mockGet.mockResolvedValueOnce(cachedBlock);

      const block1 = await cacheGet<typeof cachedBlock>('block:block-1');
      expect(block1).toEqual(cachedBlock);

      // Action: User likes the block
      mockDel.mockResolvedValueOnce(1);
      await invalidateBlockSocialCache('block-1');

      // Verify: Only block cache invalidated (not feeds for social actions)
      expect(mockDel).toHaveBeenCalledWith('block:block-1');
      expect(mockDel).toHaveBeenCalledTimes(1);

      // Next fetch should be a cache MISS
      mockGet.mockResolvedValueOnce(null);
      const block2 = await cacheGet<typeof cachedBlock>('block:block-1');
      expect(block2).toBeNull();
    });

    it('should invalidate all feed caches when new block published', async () => {
      // Setup: Multiple feed pages are cached
      mockKeys.mockResolvedValueOnce([
        'feed:forYou:0',
        'feed:forYou:1',
        'feed:forYou:2',
        'feed:following:user-1:0',
        'feed:following:user-2:0',
      ]);
      mockDel.mockResolvedValue(1);

      // Action: New block is published
      await invalidateBlockCache('new-block-123');

      // Verify: Block cache deleted
      expect(mockDel).toHaveBeenCalledWith('block:new-block-123');

      // Verify: All feed caches found and deleted
      expect(mockKeys).toHaveBeenCalledWith('feed:*');
      expect(mockDel).toHaveBeenCalledWith(
        'feed:forYou:0',
        'feed:forYou:1',
        'feed:forYou:2',
        'feed:following:user-1:0',
        'feed:following:user-2:0'
      );
    });

    it('should invalidate following feeds when user follows someone', async () => {
      mockDel.mockResolvedValue(1);
      mockKeys.mockResolvedValueOnce([
        'feed:following:follower:0',
        'feed:following:follower:1',
      ]);

      // Action: User follows another user
      await invalidateFollowCache('follower', 'followed');

      // Verify: Both user caches invalidated
      expect(mockDel).toHaveBeenCalledWith('user:follower');
      expect(mockDel).toHaveBeenCalledWith('user:followed');

      // Verify: Following feeds invalidated (pattern-based)
      expect(mockKeys).toHaveBeenCalledWith('feed:following:*');
    });
  });

  describe('Cache Key Uniqueness', () => {
    it('should generate unique keys for different cursors', () => {
      expect(CACHE_KEYS.feed.forYou('0')).toBe('feed:forYou:0');
      expect(CACHE_KEYS.feed.forYou('1')).toBe('feed:forYou:1');
      expect(CACHE_KEYS.feed.forYou('10')).toBe('feed:forYou:10');

      // All should be unique
      const keys = new Set([
        CACHE_KEYS.feed.forYou('0'),
        CACHE_KEYS.feed.forYou('1'),
        CACHE_KEYS.feed.forYou('10'),
      ]);
      expect(keys.size).toBe(3);
    });

    it('should generate unique keys for different users following feed', () => {
      expect(CACHE_KEYS.feed.following('user-1', '0')).toBe('feed:following:user-1:0');
      expect(CACHE_KEYS.feed.following('user-2', '0')).toBe('feed:following:user-2:0');
      expect(CACHE_KEYS.feed.following('user-1', '1')).toBe('feed:following:user-1:1');

      // All should be unique
      const keys = new Set([
        CACHE_KEYS.feed.following('user-1', '0'),
        CACHE_KEYS.feed.following('user-2', '0'),
        CACHE_KEYS.feed.following('user-1', '1'),
      ]);
      expect(keys.size).toBe(3);
    });
  });

  describe('Error Resilience', () => {
    it('should not throw when Redis is unavailable on get', async () => {
      mockGet.mockRejectedValueOnce(new Error('Connection refused'));

      // Should return null, not throw
      const result = await cacheGet('test-key');
      expect(result).toBeNull();
    });

    it('should not throw when Redis is unavailable on set', async () => {
      mockSet.mockRejectedValueOnce(new Error('Connection refused'));

      // Should complete without throwing
      await expect(cacheSet('test-key', 'value')).resolves.toBeUndefined();
    });

    it('should fetch fresh data when cache fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Redis error'));
      mockSet.mockResolvedValueOnce('OK');

      const freshData = { status: 'fresh' };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      // cacheGetOrSet should catch the error and proceed with fetcher
      // Note: Current implementation would return null on get error
      // Let's test that the fetcher still works
      mockGet.mockResolvedValueOnce(null); // Reset for clean test
      const result = await cacheGetOrSet('test-key', fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
    });
  });
});
