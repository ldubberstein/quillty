# Quillty Architecture Overview

## Design Principles

### 1. API-First Architecture

All data access goes through the API layer (`/api/v1/*`), never directly from client to database:

```
Client → API Route → Supabase (Service Role)
         ↓
      Validation → Auth → Rate Limit → Business Logic → Database
```

**Benefits:**
- Security: Service role key stays server-side
- Consistency: All business logic in one place
- Caching: Redis layer between API and database
- Monitoring: Centralized logging and error handling

### 2. Defense in Depth

Multiple layers of security:

```
Layer 1: Cloudflare (WAF, DDoS)
Layer 2: Vercel (Edge, middleware)
Layer 3: API Routes (Rate limiting, auth, validation)
Layer 4: Database (RLS policies as backup)
```

### 3. Cache Everything (Intelligently)

Redis caching strategy:
- **Read-heavy data** (feeds, profiles): Cache with short TTL
- **User-specific data**: Cache per-user with invalidation
- **Write operations**: Invalidate related caches

## Request Flow

### Typical API Request

```typescript
// 1. Rate limiting (first - reject early)
const rateLimit = await checkRateLimit(request, 'api');
if (!rateLimit.success) return rateLimited();

// 2. Authentication (if required)
const user = await requireAuth(request);

// 3. Input validation (Zod schemas)
const parseResult = Schema.safeParse(body);
if (!parseResult.success) return validationError();

// 4. Cache check (for reads)
const cached = await cacheGet(key);
if (cached) return respond(cached, { 'X-Cache': 'HIT' });

// 5. Database operation (service role)
const supabase = createServiceClient();
const { data, error } = await supabase.from('table')...

// 6. Cache update (for writes)
await invalidateRelatedCaches();

// 7. Response with headers
return NextResponse.json({ data }, { headers: rateLimit.headers });
```

## Key Design Decisions

### Why Next.js API Routes (Not Separate Backend)

| Factor | Next.js API Routes | Separate Service |
|--------|-------------------|------------------|
| Deployment | Single Vercel deploy | Multiple services |
| Type safety | Shared types | Requires codegen |
| Complexity | Low | Higher |
| Scale ceiling | ~100K req/min | Higher |

**Decision:** Next.js API Routes provide sufficient scale for our target (50K+ users) while maintaining development velocity for a small team.

### Why Upstash Redis (Not Vercel KV)

- Better SDK and documentation
- Built-in rate limiting primitives
- No vendor lock-in
- Analytics dashboard
- Cost-effective at scale

### Why Zod (Not TypeScript-only)

- Runtime validation (not just compile-time)
- Schema inference for types
- Clear error messages
- Composable schemas

## File Structure

```
apps/web/src/app/api/v1/
├── _lib/                    # Shared utilities
│   ├── auth.ts             # JWT validation
│   ├── cache.ts            # Redis caching
│   ├── errors.ts           # Standard error responses
│   ├── rate-limit.ts       # Upstash rate limiter
│   └── supabase.ts         # Service client
├── blocks/
│   ├── route.ts            # POST (create)
│   ├── [id]/
│   │   ├── route.ts        # GET, PATCH, DELETE
│   │   ├── like/route.ts   # POST, DELETE
│   │   └── publish/route.ts
├── patterns/
│   └── ... (similar structure)
├── feed/route.ts           # GET (with caching)
├── search/route.ts         # GET (with caching)
└── notifications/
    ├── route.ts            # GET
    ├── count/route.ts      # GET (cached)
    └── read/route.ts       # POST
```

## Error Handling

Standardized error responses:

```typescript
// apps/web/src/app/api/v1/_lib/errors.ts

export function badRequest(message: string) {
  return NextResponse.json(
    { error: { code: 'BAD_REQUEST', message } },
    { status: 400 }
  );
}

export function notFound(message: string) {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message } },
    { status: 404 }
  );
}

// All errors follow: { error: { code: string, message: string, details?: object } }
```

## Performance Optimizations

1. **Parallel Queries**: Fetch patterns and blocks simultaneously for feeds
2. **Edge Caching**: Cloudflare caches static assets
3. **Redis Caching**: API responses cached with appropriate TTLs
4. **Database Indexes**: Full-text search indexes on name/title/description
5. **Connection Pooling**: Supabase handles connection pooling

## Monitoring & Observability

- **Sentry**: Error tracking with source maps
- **Vercel Analytics**: Performance monitoring
- **Redis Insights**: Cache hit rates, rate limit triggers
- **Console Logging**: Structured logs for debugging

## Future Considerations

### Scaling Beyond Current Architecture

If we outgrow Next.js API Routes (~100K req/min):

1. Extract high-traffic endpoints to edge functions
2. Add read replicas for database
3. Implement queue-based processing for heavy operations
4. Consider separate microservices for specific domains

### Feature Additions

- **Real-time**: Already using Supabase Realtime for notifications
- **Search**: Can upgrade to Algolia/Meilisearch if PostgreSQL FTS insufficient
- **Background Jobs**: Can add Inngest or similar for async processing
