import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Use vi.hoisted to define mocks
const { mockCacheGet, mockCacheSet, mockInvalidateBlockCache } = vi.hoisted(() => ({
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockInvalidateBlockCache: vi.fn(),
}));

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
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123' }),
}));

vi.mock('../../_lib/cache', () => ({
  cacheGet: mockCacheGet,
  cacheSet: mockCacheSet,
  invalidateBlockCache: mockInvalidateBlockCache,
  CACHE_KEYS: {
    block: (id: string) => `block:${id}`,
  },
  CACHE_TTL: {
    block: 300,
  },
}));

const mockBlock = {
  id: 'block-123',
  creator_id: 'user-123',
  name: 'Test Block',
  description: 'A test block',
  thumbnail_url: null,
  is_platform_block: false,
  grid_size: 3,
  design_data: { version: 1, shapes: [], previewPalette: { roles: [] } },
  difficulty: 'beginner',
  piece_count: 0,
  like_count: 5,
  save_count: 3,
  comment_count: 1,
  usage_count: 0,
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  published_at: '2024-01-02T00:00:00Z',
  creator: {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null,
  },
};

const mockDraftBlock = {
  ...mockBlock,
  status: 'draft',
  published_at: null,
};

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: mockBlock, error: null }),
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBlock, error: null }),
          }),
        }),
      }),
      delete: mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })),
  })),
}));

describe('GET /api/v1/blocks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockResolvedValue(null);
  });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/blocks/block-123');
  }

  it('should return block data', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('block-123');
    expect(body.data.name).toBe('Test Block');
  });

  it('should return cached block when available', async () => {
    mockCacheGet.mockResolvedValueOnce(mockBlock);

    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('block-123');
    expect(response.headers.get('X-Cache')).toBe('HIT');
    expect(mockCacheGet).toHaveBeenCalledWith('block:block-123');
  });

  it('should cache published blocks on miss', async () => {
    mockCacheGet.mockResolvedValueOnce(null);

    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('MISS');
    expect(mockCacheSet).toHaveBeenCalledWith(
      'block:block-123',
      expect.objectContaining({ id: 'block-123' }),
      { ttl: 300 }
    );
  });

  it('should not cache draft blocks', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockDraftBlock, error: null });
    const { validateAuth } = await import('../../_lib/auth');
    vi.mocked(validateAuth).mockResolvedValueOnce({ user: { id: 'user-123', email: 'test@example.com' } });

    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('SKIP');
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it('should return 404 for draft blocks when not owner', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockDraftBlock, error: null });

    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should include rate limit headers', async () => {
    const request = createRequest();
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
  });
});

describe('GET /api/v1/blocks/[id] - rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    const request = new NextRequest('http://localhost:3000/api/v1/blocks/block-123');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'block-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});
