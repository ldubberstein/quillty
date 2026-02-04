# Rate Limiting

Upstash Rate Limit protects API endpoints from abuse using a sliding window algorithm.

## Configuration

### Setup

```typescript
// apps/web/src/app/api/v1/_lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit tiers
const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
    analytics: true,
  }),
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),  // 20 req/min
    analytics: true,
  }),
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),   // 5 req/min
    analytics: true,
  }),
  social: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),  // 60 req/min
    analytics: true,
  }),
};
```

### Rate Limit Tiers

| Tier | Limit | Use Case |
|------|-------|----------|
| `api` | 100/min | General read operations |
| `create` | 20/min | Create blocks/patterns |
| `publish` | 5/min | Publish content |
| `social` | 60/min | Likes, saves, follows |

## Usage

### In API Routes

```typescript
import { checkRateLimit } from '../_lib/rate-limit';

export async function POST(request: NextRequest) {
  // Check rate limit first (fail fast)
  const rateLimit = await checkRateLimit(request, 'create');

  if (!rateLimit.success) {
    return rateLimited('Rate limit exceeded. Please try again later.');
  }

  // Continue with request handling...

  // Include rate limit headers in response
  return NextResponse.json(
    { data: result },
    { headers: rateLimit.headers }
  );
}
```

### Rate Limit Function

```typescript
export async function checkRateLimit(
  request: NextRequest,
  tier: 'api' | 'create' | 'publish' | 'social' = 'api'
) {
  const limiter = rateLimiters[tier];

  // Use user ID if authenticated, otherwise IP
  const identifier = await getIdentifier(request);

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      ...(result.success ? {} : { 'Retry-After': '60' }),
    },
  };
}
```

## Response Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706990400000
```

When rate limited:
```
Retry-After: 60
```

## Error Response

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please try again later."
  }
}
```

HTTP Status: `429 Too Many Requests`

## Identifier Strategy

Rate limits are tracked per-identifier:

```typescript
async function getIdentifier(request: NextRequest): Promise<string> {
  // Try to get user ID from auth
  try {
    const auth = await validateAuth(request);
    if (auth.user) {
      return `user:${auth.user.id}`;
    }
  } catch {
    // Not authenticated, fall through
  }

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || 'anonymous';

  return `ip:${ip}`;
}
```

**Benefits:**
- Authenticated users: Rate limit per user (fair per-account limits)
- Anonymous users: Rate limit per IP (prevents spam)

## Testing

### Mocking Rate Limiter

```typescript
vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
    headers: { 'X-RateLimit-Remaining': '99' },
  }),
}));
```

### Testing Rate Limit Rejection

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
      'X-RateLimit-Reset': String(Date.now() + 60000),
      'Retry-After': '60',
    },
  });

  const response = await POST(request);
  expect(response.status).toBe(429);
});
```

### Manual Testing

```bash
# Make many requests quickly
for i in {1..110}; do
  curl -s http://localhost:3000/api/v1/feed -o /dev/null -w "%{http_code}\n"
done

# Should see 200s then 429s after limit exceeded
```

## Monitoring

### Upstash Analytics

Enable `analytics: true` in Ratelimit config to see:
- Request counts per identifier
- Rejection rates
- Peak usage times

### Alerts

Set up alerts for:
- High rejection rates (may indicate attack or bug)
- Sudden drops in traffic (may indicate outage)
- Individual users hitting limits repeatedly

## Best Practices

1. **Check rate limit first**: Fail fast before expensive operations
2. **Use appropriate tiers**: Write operations get stricter limits
3. **Include headers in all responses**: Even successful ones
4. **Log rate limit events**: Track who's hitting limits
5. **Consider burst limits**: For APIs that need occasional spikes
