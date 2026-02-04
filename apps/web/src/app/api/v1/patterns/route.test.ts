import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock dependencies
vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));

vi.mock('../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
}));

const mockPatterns = [
  {
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
    like_count: 10,
    save_count: 5,
    comment_count: 2,
    view_count: 100,
    published_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    creator: {
      id: 'user-1',
      username: 'quilter1',
      display_name: 'Jane Quilter',
      avatar_url: null,
    },
  },
];

const mockCreatedPattern = {
  id: 'new-pattern-1',
  creator_id: 'user-123',
  title: 'New Pattern',
  description: 'My new pattern',
  thumbnail_url: null,
  status: 'draft',
  price_cents: null,
  difficulty: 'beginner',
  category: null,
  size: null,
  design_data: {},
  like_count: 0,
  save_count: 0,
  comment_count: 0,
  view_count: 0,
  published_at: null,
  created_at: '2024-01-03T00:00:00Z',
};

// Use vi.hoisted for proper mock control
const { mockSupabase } = vi.hoisted(() => {
  // Create a chainable mock that can be awaited
  const createChainableQuery = (finalData: unknown, error: unknown = null) => {
    const chain: Record<string, unknown> = {};

    // All methods return the same chain (for chaining)
    const methods = ['select', 'in', 'eq', 'order', 'range', 'insert'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }

    // Make the chain thenable (so await works)
    chain.then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
      resolve({ data: finalData, error });
      return chain;
    };

    // For .single() calls
    chain.single = vi.fn().mockResolvedValue({ data: finalData, error });

    return chain;
  };

  return {
    mockSupabase: {
      createChainableQuery,
      currentData: [] as unknown,
      currentError: null as unknown,
      setChain: (data: unknown, error: unknown = null) => {
        mockSupabase.currentData = data;
        mockSupabase.currentError = error;
      },
      getChain: () => createChainableQuery(mockSupabase.currentData, mockSupabase.currentError),
    },
  };
});

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabase.getChain()),
  })),
}));

describe('GET /api/v1/patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.setChain(mockPatterns);
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/patterns');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  it('should return patterns list', async () => {
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('should reject invalid cursor', async () => {
    const request = createRequest({ cursor: '-1' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Invalid cursor');
  });

  it('should accept category filter', async () => {
    const request = createRequest({ category: 'modern' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should accept difficulty filter', async () => {
    const request = createRequest({ difficulty: 'beginner' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should ignore invalid difficulty', async () => {
    const request = createRequest({ difficulty: 'invalid' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should return nextCursor when full page', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => ({
      ...mockPatterns[0],
      id: `pattern-${i}`,
    }));
    mockSupabase.setChain(fullPage);

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(body.nextCursor).toBe(1);
  });

  it('should return null nextCursor when partial page', async () => {
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(body.nextCursor).toBeNull();
  });

  it('should include rate limit headers', async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
  });
});

describe('GET /api/v1/patterns - rate limiting', () => {
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

    const url = new URL('http://localhost:3000/api/v1/patterns');
    const request = new NextRequest(url);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('POST /api/v1/patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.setChain(mockCreatedPattern);
  });

  function createRequest(body: unknown): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/patterns');
    return new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  it('should create a pattern', async () => {
    const request = createRequest({
      title: 'New Pattern',
      description: 'My new pattern',
      designData: { blocks: [] },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toBeDefined();
  });

  it('should require title', async () => {
    const request = createRequest({
      description: 'No title here',
      designData: {},
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject title longer than 200 chars', async () => {
    const request = createRequest({
      title: 'a'.repeat(201),
      designData: {},
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid difficulty', async () => {
    const request = createRequest({
      title: 'Test Pattern',
      difficulty: 'impossible',
      designData: {},
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should require designData', async () => {
    const request = createRequest({
      title: 'Test Pattern',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid JSON body', async () => {
    const url = new URL('http://localhost:3000/api/v1/patterns');
    const request = new NextRequest(url, {
      method: 'POST',
      body: 'not json',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Invalid JSON');
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest({
      title: 'Test Pattern',
      designData: {},
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
