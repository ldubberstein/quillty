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

vi.mock('../_lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  CACHE_TTL: {
    search: 120,
  },
}));

const mockBlocks = [
  {
    id: 'block-1',
    name: 'Star Block',
    description: 'A star pattern block',
    thumbnail_url: 'https://example.com/star.png',
    like_count: 15,
    published_at: '2024-01-01T00:00:00Z',
    creator: {
      id: 'user-1',
      username: 'quilter1',
      display_name: 'Jane Quilter',
      avatar_url: null,
    },
  },
];

const mockPatterns = [
  {
    id: 'pattern-1',
    title: 'Star Quilt',
    description: 'A beautiful star quilt pattern',
    thumbnail_url: 'https://example.com/quilt.png',
    status: 'published_free',
    price_cents: null,
    like_count: 25,
    published_at: '2024-01-02T00:00:00Z',
    creator: {
      id: 'user-1',
      username: 'quilter1',
      display_name: 'Jane Quilter',
      avatar_url: null,
    },
  },
];

const mockUsers = [
  {
    id: 'user-1',
    username: 'starmaker',
    display_name: 'Star Maker',
    avatar_url: null,
    bio: 'I make star quilts',
    follower_count: 100,
  },
];

// Create chainable mock functions
const createChainMock = (finalData: unknown) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: finalData, error: null }),
  };
  return chain;
};

let blocksChain = createChainMock(mockBlocks);
let patternsChain = createChainMock(mockPatterns);
let usersChain = createChainMock(mockUsers);

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'blocks') return blocksChain;
      if (table === 'quilt_patterns') return patternsChain;
      if (table === 'users') return usersChain;
      return createChainMock([]);
    }),
  })),
}));

describe('GET /api/v1/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blocksChain = createChainMock(mockBlocks);
    patternsChain = createChainMock(mockPatterns);
    usersChain = createChainMock(mockUsers);
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/search');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  describe('validation', () => {
    it('should reject empty query', async () => {
      const request = createRequest({});
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('at least 2 characters');
    });

    it('should reject single character query', async () => {
      const request = createRequest({ q: 'a' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('at least 2 characters');
    });

    it('should reject query longer than 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      const request = createRequest({ q: longQuery });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('too long');
    });

    it('should reject invalid search type', async () => {
      const request = createRequest({ q: 'star', type: 'invalid' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('Invalid search type');
    });

    it('should reject negative cursor', async () => {
      const request = createRequest({ q: 'star', cursor: '-1' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('Invalid cursor');
    });

    it('should reject non-numeric cursor', async () => {
      const request = createRequest({ q: 'star', cursor: 'abc' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('Invalid cursor');
    });
  });

  describe('successful searches', () => {
    it('should search all types by default', async () => {
      const request = createRequest({ q: 'star' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.blocks).toBeDefined();
      expect(body.data.patterns).toBeDefined();
      expect(body.data.users).toBeDefined();
    });

    it('should search only blocks when type=blocks', async () => {
      const request = createRequest({ q: 'star', type: 'blocks' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.blocks).toBeDefined();
      expect(body.data.patterns).toBeUndefined();
      expect(body.data.users).toBeUndefined();
    });

    it('should search only patterns when type=patterns', async () => {
      const request = createRequest({ q: 'star', type: 'patterns' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.blocks).toBeUndefined();
      expect(body.data.patterns).toBeDefined();
      expect(body.data.users).toBeUndefined();
    });

    it('should search only users when type=users', async () => {
      const request = createRequest({ q: 'star', type: 'users' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.blocks).toBeUndefined();
      expect(body.data.patterns).toBeUndefined();
      expect(body.data.users).toBeDefined();
    });

    it('should accept valid cursor', async () => {
      const request = createRequest({ q: 'star', cursor: '2' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
    });

    it('should trim whitespace from query', async () => {
      const request = createRequest({ q: '  star  ' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
    });
  });

  describe('response format', () => {
    it('should include cache header MISS on fresh data', async () => {
      const request = createRequest({ q: 'star' });
      const response = await GET(request);

      expect(response.headers.get('X-Cache')).toBe('MISS');
    });

    it('should include rate limit headers', async () => {
      const request = createRequest({ q: 'star' });
      const response = await GET(request);

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    });

    it('should return null nextCursor when fewer than page size results', async () => {
      const request = createRequest({ q: 'star' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.nextCursor).toBeNull();
    });

    it('should return nextCursor when page size results', async () => {
      // Create 20 items to simulate full page
      const fullPageBlocks = Array.from({ length: 20 }, (_, i) => ({
        ...mockBlocks[0],
        id: `block-${i}`,
      }));
      blocksChain = createChainMock(fullPageBlocks);

      const request = createRequest({ q: 'star', type: 'blocks' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.nextCursor).toBe(1);
    });
  });

  describe('cache behavior', () => {
    it('should return cached data when available', async () => {
      const { cacheGet } = await import('../_lib/cache');
      const cachedData = {
        blocks: [{ id: 'cached-block', name: 'Cached Star' }],
        patterns: [],
        users: [],
      };
      vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

      const request = createRequest({ q: 'star' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(cachedData);
      expect(response.headers.get('X-Cache')).toBe('HIT');
    });

    it('should cache results after fetching', async () => {
      const { cacheSet } = await import('../_lib/cache');

      const request = createRequest({ q: 'star' });
      await GET(request);

      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
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

      const request = createRequest({ q: 'star' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      blocksChain.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createRequest({ q: 'star', type: 'blocks' });
      const response = await GET(request);
      const body = await response.json();

      // Should still return 200 with empty/partial results
      expect(response.status).toBe(200);
      expect(body.data.blocks).toBeUndefined();
    });
  });
});
