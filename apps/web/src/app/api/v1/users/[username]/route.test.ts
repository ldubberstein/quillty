import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock dependencies
vi.mock('../../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': String(Date.now() + 60000),
    },
  }),
}));

vi.mock('../../_lib/auth', () => ({
  validateAuth: vi.fn().mockResolvedValue({ user: null }),
}));

vi.mock('../../_lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  CACHE_KEYS: {
    user: (username: string) => `user:${username}`,
  },
  CACHE_TTL: {
    user: 300,
  },
}));

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  bio: 'A test user bio',
  is_partner: false,
  follower_count: 10,
  following_count: 5,
  created_at: '2024-01-01T00:00:00Z',
};

// Mock Supabase
vi.mock('../../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'blocks' || table === 'quilt_patterns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
              in: vi.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          }),
        };
      }
      if (table === 'follows') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    }),
  })),
}));

describe('GET /api/v1/users/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users/testuser');
  }

  it('should return user profile', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.username).toBe('testuser');
    expect(body.data.display_name).toBe('Test User');
  });

  it('should include content counts', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const body = await response.json();

    expect(body.data.block_count).toBeDefined();
    expect(body.data.pattern_count).toBeDefined();
  });

  it('should include cache headers', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(response.headers.get('X-Cache')).toBe('MISS');
  });

  it('should include rate limit headers', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
  });
});

describe('GET /api/v1/users/[username] - cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data when available', async () => {
    const { cacheGet } = await import('../../_lib/cache');
    const cachedProfile = {
      id: 'user-123',
      username: 'cacheduser',
      display_name: 'Cached User',
      avatar_url: null,
      bio: null,
      is_partner: false,
      follower_count: 100,
      following_count: 50,
      created_at: '2024-01-01T00:00:00Z',
      block_count: 10,
      pattern_count: 5,
    };
    vi.mocked(cacheGet).mockResolvedValueOnce(cachedProfile);

    const request = new NextRequest('http://localhost:3000/api/v1/users/cacheduser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'cacheduser' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.username).toBe('cacheduser');
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });
});

describe('GET /api/v1/users/[username] - rate limiting', () => {
  it('should return 429 when rate limited', async () => {
    const { checkRateLimit } = await import('../../_lib/rate-limit');
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

    const request = new NextRequest('http://localhost:3000/api/v1/users/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});
