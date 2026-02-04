import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { POST } from './read/route';
import { GET as getCount } from './count/route';

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

vi.mock('../_lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  invalidateNotificationCache: vi.fn().mockResolvedValue(undefined),
  CACHE_KEYS: {
    notifications: {
      unreadCount: (userId: string) => `notifications:unread:${userId}`,
    },
  },
  CACHE_TTL: {
    notifications: 60,
  },
}));

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'like',
    read: false,
    created_at: '2024-01-02T00:00:00Z',
    actor: {
      id: 'user-2',
      username: 'otheruser',
      display_name: 'Other User',
      avatar_url: null,
    },
    pattern: null,
    block: {
      id: 'block-1',
      name: 'Star Block',
      thumbnail_url: null,
    },
  },
  {
    id: 'notif-2',
    type: 'follow',
    read: true,
    created_at: '2024-01-01T00:00:00Z',
    actor: {
      id: 'user-3',
      username: 'follower',
      display_name: 'New Follower',
      avatar_url: null,
    },
    pattern: null,
    block: null,
  },
];

// Use vi.hoisted for proper mock control
const { mockSupabase } = vi.hoisted(() => {
  const createChainableQuery = (finalData: unknown, error: unknown = null) => {
    const chain: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'in', 'order', 'range', 'update'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (value: { data: unknown; error: unknown; count?: number }) => void) => {
      resolve({ data: finalData, error, count: Array.isArray(finalData) ? finalData.length : 0 });
      return chain;
    };
    chain.single = vi.fn().mockResolvedValue({ data: finalData, error });
    return chain;
  };

  return {
    mockSupabase: {
      currentData: [] as unknown,
      currentError: null as unknown,
      currentCount: 0,
      setChain: (data: unknown, error: unknown = null, count = 0) => {
        mockSupabase.currentData = data;
        mockSupabase.currentError = error;
        mockSupabase.currentCount = count;
      },
      getChain: () => {
        const chain = createChainableQuery(mockSupabase.currentData, mockSupabase.currentError);
        // Override then for count queries
        (chain as Record<string, unknown>).then = (
          resolve: (value: { data: unknown; error: unknown; count?: number }) => void
        ) => {
          resolve({
            data: mockSupabase.currentData,
            error: mockSupabase.currentError,
            count: mockSupabase.currentCount,
          });
          return chain;
        };
        return chain;
      },
    },
  };
});

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabase.getChain()),
  })),
}));

describe('GET /api/v1/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.setChain(mockNotifications);
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/v1/notifications');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  it('should return notifications list', async () => {
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(2);
  });

  it('should support cursor pagination', async () => {
    const request = createRequest({ cursor: '1' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should filter unread only', async () => {
    const request = createRequest({ unread: 'true' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('should return null nextCursor when partial page', async () => {
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(body.nextCursor).toBeNull();
  });

  it('should return nextCursor when full page', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => ({
      ...mockNotifications[0],
      id: `notif-${i}`,
    }));
    mockSupabase.setChain(fullPage);

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(body.nextCursor).toBe(1);
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

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

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('POST /api/v1/notifications/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.setChain(null);
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/notifications/read', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('should mark specific notifications as read', async () => {
    // Use valid UUIDs
    const request = createRequest({
      notificationIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.success).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const request = createRequest({ all: true });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.success).toBe(true);
  });

  it('should require notificationIds or all flag', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject empty notificationIds array', async () => {
    const request = createRequest({ notificationIds: [] });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest({
      notificationIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/notifications/count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.setChain(null, null, 5);
  });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/notifications/count');
  }

  it('should return unread count', async () => {
    const request = createRequest();
    const response = await getCount(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.count).toBeDefined();
  });

  it('should return cached count when available', async () => {
    const { cacheGet } = await import('../_lib/cache');
    vi.mocked(cacheGet).mockResolvedValueOnce(10);

    const request = createRequest();
    const response = await getCount(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.count).toBe(10);
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });

  it('should cache the count', async () => {
    const { cacheSet } = await import('../_lib/cache');

    const request = createRequest();
    await getCount(request);

    expect(cacheSet).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    const { requireAuth } = await import('../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest();
    const response = await getCount(request);
    const body = await response.json();

    expect(response.status).toBe(401);
  });
});
