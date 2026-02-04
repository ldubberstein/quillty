import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from './route';

// Mock dependencies
vi.mock('../../../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));

vi.mock('../../../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
}));

vi.mock('../../../_lib/cache', () => ({
  invalidateBlockSocialCache: vi.fn().mockResolvedValue(undefined),
}));

const publishedBlock = {
  id: 'block-1',
  status: 'published',
  like_count: 10,
};

const draftBlock = {
  id: 'block-2',
  status: 'draft',
  like_count: 0,
};

// Use vi.hoisted for proper mock control
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      blockData: null as unknown,
      likeData: null as unknown,
      blockError: null as unknown,
      likeError: null as unknown,
      insertError: null as unknown,
      deleteError: null as unknown,
      updateError: null as unknown,
      reset: () => {
        mockSupabase.blockData = publishedBlock;
        mockSupabase.likeData = null;
        mockSupabase.blockError = null;
        mockSupabase.likeError = null;
        mockSupabase.insertError = null;
        mockSupabase.deleteError = null;
        mockSupabase.updateError = null;
      },
    },
  };
});

vi.mock('../../../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {};
      const methods = ['select', 'eq', 'insert', 'delete', 'update'];
      for (const method of methods) {
        chain[method] = vi.fn().mockReturnValue(chain);
      }

      if (table === 'blocks') {
        chain.single = vi.fn().mockResolvedValue({
          data: mockSupabase.blockData,
          error: mockSupabase.blockError,
        });
      } else if (table === 'likes') {
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: mockSupabase.likeData,
          error: mockSupabase.likeError,
        });
        // Make insert, delete thenable
        chain.then = (resolve: (value: { error: unknown }) => void) => {
          resolve({ error: mockSupabase.insertError || mockSupabase.deleteError });
          return chain;
        };
      }

      return chain;
    }),
  })),
}));

describe('POST /api/v1/blocks/[id]/like', () => {
  const params = { params: Promise.resolve({ id: 'block-1' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.reset();
  });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/blocks/block-1/like', {
      method: 'POST',
    });
  }

  it('should like a block', async () => {
    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.liked).toBe(true);
    expect(body.data.like_count).toBe(11);
  });

  it('should return 404 for non-existent block', async () => {
    mockSupabase.blockData = null;
    mockSupabase.blockError = { message: 'Not found' };

    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should reject liking draft block', async () => {
    mockSupabase.blockData = draftBlock;

    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('published');
  });

  it('should reject double like', async () => {
    mockSupabase.likeData = { id: 'existing-like' };

    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Already liked');
  });

  it('should invalidate cache after like', async () => {
    const { invalidateBlockSocialCache } = await import('../../../_lib/cache');

    const request = createRequest();
    await POST(request, params);

    expect(invalidateBlockSocialCache).toHaveBeenCalledWith('block-1');
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../../../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 429 when rate limited', async () => {
    const { checkRateLimit } = await import('../../../_lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
        'Retry-After': '60',
      },
    });

    const request = createRequest();
    const response = await POST(request, params);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('DELETE /api/v1/blocks/[id]/like', () => {
  const params = { params: Promise.resolve({ id: 'block-1' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.reset();
    mockSupabase.likeData = { id: 'existing-like' };
  });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/blocks/block-1/like', {
      method: 'DELETE',
    });
  }

  it('should unlike a block', async () => {
    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.liked).toBe(false);
    expect(body.data.like_count).toBe(9);
  });

  it('should return 404 for non-existent block', async () => {
    mockSupabase.blockData = null;
    mockSupabase.blockError = { message: 'Not found' };

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should reject unliking if not liked', async () => {
    mockSupabase.likeData = null;

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Not liked');
  });

  it('should invalidate cache after unlike', async () => {
    const { invalidateBlockSocialCache } = await import('../../../_lib/cache');

    const request = createRequest();
    await DELETE(request, params);

    expect(invalidateBlockSocialCache).toHaveBeenCalledWith('block-1');
  });

  it('should not go below 0 for like count', async () => {
    mockSupabase.blockData = { ...publishedBlock, like_count: 0 };

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.like_count).toBe(0);
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../../../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest();
    const response = await DELETE(request, params);
    const body = await response.json();

    expect(response.status).toBe(401);
  });
});
