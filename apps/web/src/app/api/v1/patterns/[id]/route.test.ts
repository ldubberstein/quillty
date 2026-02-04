import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock dependencies
vi.mock('../../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));

vi.mock('../../_lib/auth', () => ({
  validateAuth: vi.fn().mockResolvedValue({ user: null }),
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
}));

vi.mock('../../_lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  invalidatePatternCache: vi.fn().mockResolvedValue(undefined),
  CACHE_KEYS: {
    pattern: (id: string) => `pattern:${id}`,
  },
  CACHE_TTL: {
    pattern: 300,
  },
}));

const publishedPattern = {
  id: 'pattern-1',
  creator_id: 'user-1',
  title: 'Star Quilt',
  description: 'A beautiful star quilt',
  thumbnail_url: 'https://example.com/thumb.png',
  status: 'published_free',
  price_cents: null,
  difficulty: 'beginner',
  category: 'modern',
  size: '60x80',
  design_data: { blocks: [] },
  like_count: 10,
  save_count: 5,
  comment_count: 2,
  view_count: 100,
  published_at: '2024-01-02T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  creator: {
    id: 'user-1',
    username: 'quilter1',
    display_name: 'Jane Quilter',
    avatar_url: null,
  },
};

const draftPattern = {
  ...publishedPattern,
  id: 'draft-1',
  status: 'draft',
  published_at: null,
  creator_id: 'user-123',
};

// Create chainable mock
const createChain = (finalData: unknown, error: unknown = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: finalData, error }),
});

let patternsChain = createChain(publishedPattern);

vi.mock('../../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => patternsChain),
  })),
}));

describe('GET /api/v1/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patternsChain = createChain(publishedPattern);
  });

  const params = { params: Promise.resolve({ id: 'pattern-1' }) };

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/patterns/pattern-1');
  }

  it('should return published pattern', async () => {
    const request = createRequest();
    const response = await GET(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBe('pattern-1');
  });

  it('should return 404 for non-existent pattern', async () => {
    patternsChain = createChain(null, { message: 'Not found' });

    const request = createRequest();
    const response = await GET(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 for draft pattern when not owner', async () => {
    patternsChain = createChain(draftPattern);

    const request = createRequest();
    const response = await GET(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return draft pattern when owner', async () => {
    patternsChain = createChain(draftPattern);
    const { validateAuth } = await import('../../_lib/auth');
    vi.mocked(validateAuth).mockResolvedValueOnce({ user: { id: 'user-123', email: 'test@example.com' } });

    const request = createRequest();
    const response = await GET(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('draft');
    expect(response.headers.get('X-Cache')).toBe('SKIP');
  });

  it('should return cached data when available', async () => {
    const { cacheGet } = await import('../../_lib/cache');
    vi.mocked(cacheGet).mockResolvedValueOnce(publishedPattern);

    const request = createRequest();
    const response = await GET(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });

  it('should cache published patterns', async () => {
    const { cacheSet } = await import('../../_lib/cache');

    const request = createRequest();
    await GET(request, params);

    expect(cacheSet).toHaveBeenCalled();
  });
});

describe('PATCH /api/v1/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patternsChain = createChain({ ...draftPattern, title: 'Updated Title' });
  });

  const params = { params: Promise.resolve({ id: 'draft-1' }) };

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/patterns/draft-1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  it('should update pattern', async () => {
    const request = createRequest({ title: 'Updated Title' });
    const response = await PATCH(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should return 404 for non-existent pattern', async () => {
    patternsChain.single.mockResolvedValueOnce({ data: null, error: null });

    const request = createRequest({ title: 'Updated Title' });
    const response = await PATCH(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return 403 when not owner', async () => {
    patternsChain.single.mockResolvedValueOnce({
      data: { id: 'draft-1', creator_id: 'other-user', status: 'draft' },
      error: null,
    });

    const request = createRequest({ title: 'Updated Title' });
    const response = await PATCH(request, params);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('should reject invalid title length', async () => {
    const request = createRequest({ title: 'a'.repeat(201) });
    const response = await PATCH(request, params);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should invalidate cache after update', async () => {
    const { invalidatePatternCache } = await import('../../_lib/cache');

    const request = createRequest({ title: 'Updated Title' });
    await PATCH(request, params);

    expect(invalidatePatternCache).toHaveBeenCalledWith('draft-1');
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest({ title: 'Updated Title' });
    const response = await PATCH(request, params);
    const body = await response.json();

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/v1/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patternsChain = createChain(null);
    patternsChain.single.mockResolvedValue({
      data: { id: 'draft-1', creator_id: 'user-123', status: 'draft' },
      error: null,
    });
  });

  const params = { params: Promise.resolve({ id: 'draft-1' }) };

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/patterns/draft-1', {
      method: 'DELETE',
    });
  }

  it('should delete draft pattern', async () => {
    const request = createRequest();
    const response = await DELETE(request, params);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent pattern', async () => {
    patternsChain.single.mockResolvedValueOnce({ data: null, error: null });

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return 403 when not owner', async () => {
    patternsChain.single.mockResolvedValueOnce({
      data: { id: 'draft-1', creator_id: 'other-user', status: 'draft' },
      error: null,
    });

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(403);
  });

  it('should reject deleting published pattern', async () => {
    patternsChain.single.mockResolvedValueOnce({
      data: { id: 'pattern-1', creator_id: 'user-123', status: 'published_free' },
      error: null,
    });

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Published patterns cannot be deleted');
  });

  it('should invalidate cache after delete', async () => {
    const { invalidatePatternCache } = await import('../../_lib/cache');

    const request = createRequest();
    await DELETE(request, params);

    expect(invalidatePatternCache).toHaveBeenCalledWith('draft-1');
  });
});
