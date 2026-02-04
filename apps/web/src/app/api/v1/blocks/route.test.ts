import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '19',
      'X-RateLimit-Reset': String(Date.now() + 60000),
    },
  }),
}));

vi.mock('../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
}));

const mockCreatedBlock = {
  id: 'block-new',
  creator_id: 'user-123',
  name: 'Test Block',
  description: 'A test block',
  grid_size: 3,
  design_data: { shapes: [], palette: {} },
  difficulty: 'beginner',
  piece_count: 0,
  thumbnail_url: null,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

// Use vi.hoisted for proper mock control
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      data: null as unknown,
      error: null as unknown,
      reset: () => {
        mockSupabase.data = mockCreatedBlock;
        mockSupabase.error = null;
      },
    },
  };
});

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockSupabase.data,
        error: mockSupabase.error,
      }),
    })),
  })),
}));

describe('POST /api/v1/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.reset();
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/blocks', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validBlockInput = {
    name: 'Test Block',
    description: 'A test block',
    gridSize: 3,
    designData: {
      shapes: [],
      previewPalette: {
        roles: [
          { id: 'fabric-1', name: 'Background', color: '#ffffff' },
        ],
      },
    },
    difficulty: 'beginner',
  };

  it('should create a block successfully', async () => {
    const request = createRequest(validBlockInput);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe('Test Block');
  });

  it('should require authentication', async () => {
    const { requireAuth } = await import('../_lib/auth');
    const authError = new Error('Authentication required');
    authError.name = 'AuthError';
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const request = createRequest(validBlockInput);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should validate required name field', async () => {
    const request = createRequest({
      description: 'Missing name',
      gridSize: 3,
      designData: {
        shapes: [],
        previewPalette: {
          roles: [{ id: 'fabric-1', name: 'Background', color: '#ffffff' }],
        },
      },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate gridSize', async () => {
    const request = createRequest({
      ...validBlockInput,
      gridSize: 10, // Invalid - must be 2, 3, or 4
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate difficulty', async () => {
    const request = createRequest({
      ...validBlockInput,
      difficulty: 'impossible', // Invalid
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/blocks', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('should return 429 when rate limited', async () => {
    const { checkRateLimit } = await import('../_lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
        'Retry-After': '60',
      },
    });

    const request = createRequest(validBlockInput);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('should handle database errors', async () => {
    mockSupabase.data = null;
    mockSupabase.error = { message: 'Database error' };

    const request = createRequest(validBlockInput);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('should include rate limit headers in response', async () => {
    const request = createRequest(validBlockInput);
    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
  });
});
