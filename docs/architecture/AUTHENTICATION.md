# Authentication

Supabase Auth provides JWT-based authentication for Quillty.

## Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  Supabase    │────▶│   API Route  │
│  (Browser)   │     │    Auth      │     │  (Validate)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. Login/Signup   │                    │
       │───────────────────▶│                    │
       │                    │                    │
       │  2. JWT Token      │                    │
       │◀───────────────────│                    │
       │                    │                    │
       │  3. API Request + Token                 │
       │────────────────────────────────────────▶│
       │                    │                    │
       │                    │  4. Validate JWT   │
       │                    │◀───────────────────│
       │                    │                    │
       │  5. Response                            │
       │◀────────────────────────────────────────│
```

## Auth Middleware

### Location

```
apps/web/src/app/api/v1/_lib/auth.ts
```

### Functions

```typescript
// Require authentication (throws on failure)
export async function requireAuth(request: NextRequest): Promise<User>

// Optional authentication (returns null if not authenticated)
export async function validateAuth(request: NextRequest): Promise<AuthResult>
```

## Usage Patterns

### Protected Endpoints

```typescript
export async function POST(request: NextRequest) {
  try {
    // This throws if not authenticated
    const user = await requireAuth(request);

    // User is guaranteed to be authenticated here
    const { data, error } = await supabase
      .from('blocks')
      .insert({ creator_id: user.id, ... });

    return NextResponse.json({ data });
  } catch (error) {
    // Handle AuthError
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }
    throw error;
  }
}
```

### Optional Authentication

```typescript
export async function GET(request: NextRequest) {
  // Get user if authenticated, null otherwise
  const auth = await validateAuth(request);

  if (auth.user) {
    // Show personalized content
    return getPersonalizedFeed(auth.user.id);
  }

  // Show public content
  return getPublicFeed();
}
```

## Token Extraction

Tokens are extracted in order of preference:

```typescript
function extractToken(request: NextRequest): string | null {
  // 1. Authorization header (preferred for API clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Cookie (for browser clients)
  const accessToken = request.cookies.get('sb-access-token')?.value;
  return accessToken || null;
}
```

### Client-Side Token Handling

```typescript
// For API calls from browser
const response = await fetch('/api/v1/blocks', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

// Or rely on cookies (automatic with Supabase client)
const { data } = await supabase.from('blocks').select();
```

## JWT Validation

```typescript
export async function requireAuth(request: NextRequest): Promise<User> {
  const token = extractToken(request);

  if (!token) {
    throw new AuthError('Authentication required');
  }

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError('Invalid or expired token');
  }

  return user;
}
```

## AuthError Class

```typescript
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

Using `error.name === 'AuthError'` allows proper error handling:

```typescript
catch (error) {
  if (error instanceof Error && error.name === 'AuthError') {
    return unauthorized(error.message);
  }
  // Re-throw other errors
  throw error;
}
```

## Testing

### Mocking Authentication

```typescript
// Mock successful auth
vi.mock('../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
  }),
}));

// Mock optional auth (authenticated)
vi.mock('../_lib/auth', () => ({
  validateAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

// Mock optional auth (not authenticated)
vi.mock('../_lib/auth', () => ({
  validateAuth: vi.fn().mockResolvedValue({ user: null }),
}));
```

### Testing Auth Failure

```typescript
it('should return 401 when not authenticated', async () => {
  const { requireAuth } = await import('../_lib/auth');
  const authError = new Error('Authentication required');
  authError.name = 'AuthError';
  vi.mocked(requireAuth).mockRejectedValueOnce(authError);

  const response = await POST(request);
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body.error.code).toBe('UNAUTHORIZED');
});
```

## Security Considerations

### Token Security

- **HTTPS only**: Tokens should only be sent over HTTPS
- **Short expiry**: Access tokens expire after 1 hour
- **Refresh tokens**: Stored in HTTP-only cookies
- **No local storage**: Avoid storing tokens in localStorage

### API Route Security

- **Validate every request**: Don't trust client-side validation
- **Use service role server-side**: Bypass RLS only on server
- **Check ownership**: Verify user owns the resource they're modifying

```typescript
// Example: Verify block ownership
const { data: block } = await supabase
  .from('blocks')
  .select('creator_id')
  .eq('id', blockId)
  .single();

if (block?.creator_id !== user.id) {
  return forbidden('Not authorized to modify this block');
}
```

## Error Responses

| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Authentication required |
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 403 | `FORBIDDEN` | Not authorized to perform this action |

## Best Practices

1. **Check auth early**: After rate limiting, before business logic
2. **Use requireAuth for protected routes**: Throws on failure
3. **Use validateAuth for optional auth**: Returns null if not authenticated
4. **Don't expose internal errors**: Return generic messages to clients
5. **Log auth failures**: Track suspicious activity
