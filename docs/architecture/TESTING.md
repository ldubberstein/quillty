# Testing Guide

This document covers testing strategies and patterns for the Quillty API layer.

## Testing Stack

- **Test Runner**: Vitest
- **Assertions**: Vitest built-in (expect)
- **Mocking**: vi.mock, vi.fn, vi.hoisted
- **React Testing**: @testing-library/react

## Test File Structure

```
apps/web/src/app/api/v1/
├── _lib/
│   ├── cache.ts
│   ├── cache.test.ts        # Unit tests for cache utilities
│   ├── errors.ts
│   └── errors.test.ts       # Unit tests for error helpers
├── blocks/
│   ├── route.ts
│   ├── route.test.ts        # Tests for POST /blocks
│   ├── [id]/
│   │   ├── route.ts
│   │   └── route.test.ts    # Tests for GET/PATCH/DELETE /blocks/[id]
│   └── schemas.ts
│   └── schemas.test.ts      # Tests for validation schemas
├── feed/
│   ├── route.ts
│   └── route.test.ts        # Tests for GET /feed (with cache tests)
```

## Test Patterns

### 1. API Route Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from './route';

// Mock dependencies
vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));

vi.mock('../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-123' }),
}));

// Mock Supabase with hoisted pattern
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    data: null as unknown,
    error: null as unknown,
  },
}));

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockSupabase.data,
        error: mockSupabase.error,
      }),
    })),
  })),
}));

describe('POST /api/v1/resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.data = { id: '1', name: 'Test' };
    mockSupabase.error = null;
  });

  // Tests go here
});
```

### 2. vi.hoisted Pattern

Use `vi.hoisted` for mocks that need to be configured per-test:

```typescript
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      data: null as unknown,
      error: null as unknown,
      reset: () => {
        mockSupabase.data = defaultData;
        mockSupabase.error = null;
      },
    },
  };
});
```

### 3. Chainable Supabase Mock

For complex queries with chaining:

```typescript
const createChainableQuery = (finalData: unknown, error: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'in', 'order', 'range', 'insert', 'update', 'delete'];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Make thenable for await
  chain.then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
    resolve({ data: finalData, error });
    return chain;
  };

  chain.single = vi.fn().mockResolvedValue({ data: finalData, error });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error });

  return chain;
};
```

### 4. Request Helper

```typescript
function createRequest(
  params: Record<string, string> = {},
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/v1/resource');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (options.body) {
    return new NextRequest(url, {
      method: options.method || 'POST',
      body: JSON.stringify(options.body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new NextRequest(url, { method: options.method || 'GET' });
}
```

## Common Test Cases

### Authentication

```typescript
it('should return 401 when not authenticated', async () => {
  const { requireAuth } = await import('../_lib/auth');
  const authError = new Error('Authentication required');
  authError.name = 'AuthError';
  vi.mocked(requireAuth).mockRejectedValueOnce(authError);

  const response = await POST(createRequest({}, { body: validInput }));
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body.error.code).toBe('UNAUTHORIZED');
});
```

### Rate Limiting

```typescript
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
      'Retry-After': '60',
    },
  });

  const response = await POST(createRequest());
  expect(response.status).toBe(429);
});
```

### Validation Errors

```typescript
it('should return 422 for invalid input', async () => {
  const response = await POST(createRequest({}, {
    body: { invalid: 'data' },
  }));
  const body = await response.json();

  expect(response.status).toBe(422);
  expect(body.error.code).toBe('VALIDATION_ERROR');
});
```

### Not Found

```typescript
it('should return 404 for non-existent resource', async () => {
  mockSupabase.data = null;
  mockSupabase.error = { message: 'Not found' };

  const response = await GET(createRequest(), params);
  expect(response.status).toBe(404);
});
```

### Cache Tests

```typescript
it('should return X-Cache: HIT when cached', async () => {
  const { cacheGet } = await import('../_lib/cache');
  vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

  const response = await GET(createRequest());
  expect(response.headers.get('X-Cache')).toBe('HIT');
});

it('should return X-Cache: MISS when not cached', async () => {
  const { cacheGet } = await import('../_lib/cache');
  vi.mocked(cacheGet).mockResolvedValueOnce(null);

  const response = await GET(createRequest());
  expect(response.headers.get('X-Cache')).toBe('MISS');
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific file
pnpm test src/app/api/v1/blocks/route.test.ts

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

## Test Coverage

### Current Coverage

| Area | Tests | Coverage |
|------|-------|----------|
| Cache utilities | 31 | Full |
| Feed endpoint | 20 | Full |
| Blocks CRUD | 22 | Full |
| Blocks like | 13 | Full |
| Patterns | 33 | Full |
| Search | 20 | Full |
| Notifications | 16 | Full |
| Users | 15 | Full |

### Coverage Goals

- **Unit tests**: 100% for utility functions
- **API routes**: All endpoints have tests for:
  - Success cases
  - Authentication failures
  - Rate limiting
  - Validation errors
  - Not found
  - Database errors

## Best Practices

1. **Use vi.hoisted for configurable mocks**: Allows per-test configuration
2. **Clear mocks in beforeEach**: Prevent test pollution
3. **Test error paths**: Not just happy paths
4. **Test headers**: Cache headers, rate limit headers
5. **Use meaningful test names**: Describe what's being tested
6. **One assertion focus per test**: Test one thing at a time
