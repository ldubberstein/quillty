import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock dependencies
vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));

vi.mock('../_lib/auth', () => ({
  validateAuth: vi.fn().mockResolvedValue({ user: null }),
}));

vi.mock('../_lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  CACHE_KEYS: {
    feed: {
      forYou: (cursor: string) => `feed:forYou:${cursor}`,
      following: (userId: string, cursor: string) => `feed:following:${userId}:${cursor}`,
    },
  },
  CACHE_TTL: {
    feed: {
      forYou: 60,
      following: 30,
    },
  },
}));

const mockPatterns = [
  {
    id: 'pattern-1',
    creator_id: 'user-1',
    title: 'Test Pattern',
    description: 'A test pattern',
    thumbnail_url: 'https://example.com/thumb.png',
    status: 'published_free',
    price_cents: 0,
    difficulty: 'beginner',
    like_count: 10,
    save_count: 5,
    comment_count: 2,
    published_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    creator: {
      id: 'user-1',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
    },
  },
];

const mockBlocks = [
  {
    id: 'block-1',
    creator_id: 'user-1',
    name: 'Test Block',
    description: 'A test block',
    thumbnail_url: null,
    grid_size: 3,
    difficulty: 'beginner',
    piece_count: 9,
    like_count: 5,
    save_count: 3,
    comment_count: 1,
    published_at: '2024-01-03T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    creator: {
      id: 'user-1',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
    },
  },
];

// Mock Supabase
const mockSelect = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockEq = vi.fn();

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'quilt_patterns') {
        return {
          select: mockSelect.mockReturnValue({
            in: mockIn.mockReturnValue({
              order: mockOrder.mockReturnValue({
                range: mockRange.mockResolvedValue({
                  data: mockPatterns,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'blocks') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              order: mockOrder.mockReturnValue({
                range: mockRange.mockResolvedValue({
                  data: mockBlocks,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return { select: mockSelect };
    }),
  })),
}));

describe('GET /api/v1/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/feed');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  it('should return forYou feed by default', async () => {
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.cached).toBe(false);
    expect(body.nextCursor).toBeDefined();
  });

  it('should return forYou feed with type param', async () => {
    const request = createRequest({ type: 'forYou' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should require auth for following feed', async () => {
    const request = createRequest({ type: 'following' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('authentication');
  });

  it('should reject invalid feed type', async () => {
    const request = createRequest({ type: 'invalid' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('Invalid feed type');
  });

  it('should reject negative cursor', async () => {
    const request = createRequest({ cursor: '-1' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('cursor');
  });

  it('should reject non-numeric cursor', async () => {
    const request = createRequest({ cursor: 'abc' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('should accept valid cursor', async () => {
    const request = createRequest({ cursor: '2' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should include cache headers', async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.headers.get('X-Cache')).toBe('MISS');
  });

  it('should include rate limit headers', async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
  });
});

describe('GET /api/v1/feed - cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data when available', async () => {
    const { cacheGet } = await import('../_lib/cache');
    const cachedData = [
      { type: 'block', data: { id: 'cached-block' } },
    ];
    vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

    const url = new URL('http://localhost:3000/api/v1/feed');
    const request = new NextRequest(url);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(body.data).toEqual(cachedData);
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });
});

describe('GET /api/v1/feed - rate limiting', () => {
  it('should return 429 when rate limited', async () => {
    const { checkRateLimit } = await import('../_lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
        'Retry-After': '60',
      },
    });

    const url = new URL('http://localhost:3000/api/v1/feed');
    const request = new NextRequest(url);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('GET /api/v1/feed - comprehensive cache tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/feed');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  describe('Cache HIT/MISS Headers', () => {
    it('should return X-Cache: MISS and cached: false when cache is empty', async () => {
      const { cacheGet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce(null);

      const response = await GET(createRequest());
      const body = await response.json();

      expect(response.headers.get('X-Cache')).toBe('MISS');
      expect(body.cached).toBe(false);
    });

    it('should return X-Cache: HIT and cached: true when cache has data', async () => {
      const { cacheGet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce([
        { type: 'pattern', data: { id: 'p1', title: 'Cached' } },
      ]);

      const response = await GET(createRequest());
      const body = await response.json();

      expect(response.headers.get('X-Cache')).toBe('HIT');
      expect(body.cached).toBe(true);
    });
  });

  describe('Cache Key Verification', () => {
    it('should call cacheGet with correct key for page 0', async () => {
      const { cacheGet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce(null);

      await GET(createRequest({ cursor: '0' }));

      expect(cacheGet).toHaveBeenCalledWith('feed:forYou:0');
    });

    it('should call cacheGet with correct key for page 5', async () => {
      const { cacheGet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce(null);

      await GET(createRequest({ cursor: '5' }));

      expect(cacheGet).toHaveBeenCalledWith('feed:forYou:5');
    });

    it('should use different cache keys for different pages', async () => {
      const { cacheGet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValue(null);

      await GET(createRequest({ cursor: '0' }));
      await GET(createRequest({ cursor: '1' }));
      await GET(createRequest({ cursor: '2' }));

      expect(cacheGet).toHaveBeenNthCalledWith(1, 'feed:forYou:0');
      expect(cacheGet).toHaveBeenNthCalledWith(2, 'feed:forYou:1');
      expect(cacheGet).toHaveBeenNthCalledWith(3, 'feed:forYou:2');
    });
  });

  describe('Cache Storage Verification', () => {
    it('should call cacheSet with correct TTL for forYou feed', async () => {
      const { cacheGet, cacheSet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(cacheSet).mockResolvedValueOnce(undefined);

      await GET(createRequest({ type: 'forYou' }));

      expect(cacheSet).toHaveBeenCalled();
      const [, , options] = vi.mocked(cacheSet).mock.calls[0];
      expect(options).toEqual({ ttl: 60 }); // forYou TTL is 60 seconds
    });

    it('should NOT call cacheSet when returning cached data', async () => {
      const { cacheGet, cacheSet } = await import('../_lib/cache');
      vi.mocked(cacheGet).mockResolvedValueOnce([{ type: 'pattern', data: { id: 'cached' } }]);

      await GET(createRequest());

      expect(cacheSet).not.toHaveBeenCalled();
    });
  });

  describe('Cache Data Integrity', () => {
    it('should return exact cached data without modification', async () => {
      const { cacheGet } = await import('../_lib/cache');
      const cachedData = [
        { type: 'pattern', data: { id: 'p1', title: 'Pattern 1', like_count: 100 } },
        { type: 'block', data: { id: 'b1', name: 'Block 1', like_count: 50 } },
      ];
      vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

      const response = await GET(createRequest());
      const body = await response.json();

      expect(body.data).toEqual(cachedData);
    });

    it('should calculate nextCursor correctly from cached data', async () => {
      const { cacheGet } = await import('../_lib/cache');

      // Full page (20 items) should have nextCursor
      const fullPage = Array.from({ length: 20 }, (_, i) => ({
        type: 'pattern',
        data: { id: `p-${i}` },
      }));
      vi.mocked(cacheGet).mockResolvedValueOnce(fullPage);

      const response = await GET(createRequest({ cursor: '3' }));
      const body = await response.json();

      expect(body.nextCursor).toBe(4); // cursor 3 + 1

      // Partial page should have null nextCursor
      vi.mocked(cacheGet).mockResolvedValueOnce([{ type: 'pattern', data: { id: 'p-1' } }]);

      const response2 = await GET(createRequest({ cursor: '0' }));
      const body2 = await response2.json();

      expect(body2.nextCursor).toBeNull();
    });
  });
});
