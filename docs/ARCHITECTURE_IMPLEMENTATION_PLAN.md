# Architecture Implementation Plan

**Priority:** Execute this plan BEFORE continuing with `IMPLEMENTATION_PLAN.md` (Block & Pattern Designer features)

**Author:** Staff Engineer Review
**Date:** 2026-02-03
**Status:** Approved

---

## Overview

This plan migrates Quillty from direct client-to-Supabase access to a proper API layer using Next.js API Routes, with Redis caching and rate limiting.

**Duration:** 8 weeks (4 phases)

**Key Infrastructure:**
- Next.js API Routes (`/api/v1/*`)
- Upstash Redis (caching, rate limiting)
- Sentry (error tracking)
- Supabase service role key (server-only)

---

## Prerequisites

Before starting:

1. **Create Upstash account** at https://upstash.com (free tier sufficient)
2. **Create Sentry account** at https://sentry.io (free tier)
3. **Get environment variables ready:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `SENTRY_DSN`
   - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)

---

## Phase 1: Foundation (Week 1-2)

**Goal:** Establish API layer without breaking existing functionality

### 1.1 Setup API Infrastructure

**Tasks:**
- [ ] Create API directory structure at `/apps/web/src/app/api/v1/`
- [ ] Install dependencies: `@upstash/redis`, `@upstash/ratelimit`
- [ ] Add environment variables to `.env.local` and `.env.example`

**Files to create:**
```
apps/web/src/app/api/v1/
├── _lib/
│   ├── auth.ts           # JWT validation, user extraction
│   ├── rate-limit.ts     # Upstash rate limiter setup
│   ├── cache.ts          # Redis cache helpers
│   ├── errors.ts         # Standard error responses
│   └── supabase.ts       # Server-side Supabase client (service role)
```

**Verification:**
- `pnpm typecheck` passes
- `pnpm lint` passes

---

### 1.2 Create Server-Side Supabase Client

**Task:** Create authenticated Supabase client that uses service role key (bypasses RLS for server operations).

**File:** `apps/web/src/app/api/v1/_lib/supabase.ts`

```typescript
// Server-side Supabase client with service role
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@quillty/api';

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Verification:**
- Service role key is NOT in any client-side code
- `.env.example` updated but without actual key value

---

### 1.3 Implement Rate Limiting Middleware

**File:** `apps/web/src/app/api/v1/_lib/rate-limit.ts`

**Rate limit tiers:**

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| `api` | 100 | 1 min | General API calls |
| `create` | 20 | 1 min | Write operations |
| `publish` | 5 | 1 min | Publish actions |
| `social` | 60 | 1 min | Likes, follows |
| `comments` | 10 | 1 min | Comments |
| `search` | 30 | 1 min | Search queries |

**Verification:**
- Unit test: rate limiter blocks after threshold
- Unit test: rate limiter resets after window

---

### 1.4 Implement Auth Middleware

**File:** `apps/web/src/app/api/v1/_lib/auth.ts`

**Functionality:**
- Extract JWT from Authorization header or cookies
- Validate with Supabase
- Return user object or null

**Verification:**
- Unit test: valid token returns user
- Unit test: invalid token returns null
- Unit test: expired token returns null

---

### 1.5 Implement Block Write Endpoints

**Files:**
- `apps/web/src/app/api/v1/blocks/route.ts` - POST (create)
- `apps/web/src/app/api/v1/blocks/[id]/route.ts` - PATCH (update), DELETE
- `apps/web/src/app/api/v1/blocks/[id]/publish/route.ts` - POST

**Reuse existing schemas:**
- `packages/core/src/block-designer/schemas.ts` for validation

**Verification:**
- Create block via API → appears in database
- Update block via API → changes persisted
- Publish block via API → status changes, published_at set
- Unauthorized request → 401 response
- Rate limit exceeded → 429 response

---

### 1.6 Create HTTP Client in packages/api

**File:** `packages/api/src/http-client.ts`

**Purpose:** Centralized API client for all API calls (used by both web and mobile).

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || 'Request failed', error);
    }

    return response.json();
  }

  // Blocks
  async createBlock(data: CreateBlockInput) {
    return this.request<Block>('/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlock(id: string, data: UpdateBlockInput) {
    return this.request<Block>(`/blocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ... additional methods
}

export const apiClient = new ApiClient(API_BASE_URL);
```

**Verification:**
- Can make authenticated requests
- Handles errors consistently
- Works in both web and mobile environments

---

### 1.7 Migrate Block Hooks to Use API

**Files to modify:**
- `packages/api/src/hooks/useBlock.ts`

**Changes:**
- `useCreateBlock` → calls `POST /api/v1/blocks`
- `useUpdateBlock` → calls `PATCH /api/v1/blocks/[id]`
- `usePublishBlock` → calls `POST /api/v1/blocks/[id]/publish`

**Verification:**
- Block designer still works end-to-end
- Save draft creates block
- Publish changes status

---

## Phase 2: Read Operations + Caching (Week 3-4)

**Goal:** Move reads to API with caching

### 2.1 Implement Feed Endpoint with Caching

**File:** `apps/web/src/app/api/v1/feed/route.ts`

**Features:**
- Query param: `?type=forYou|following&cursor=xxx`
- Redis cache: 60s TTL for forYou, 30s for following
- Pagination via cursor

**Verification:**
- Feed loads correctly
- Cache hit logged on second request within TTL
- Following feed shows only followed users' content

---

### 2.2 Implement Block Read Endpoint

**File:** `apps/web/src/app/api/v1/blocks/[id]/route.ts` - GET

**Features:**
- Include creator info (username, avatar)
- Check draft visibility (only owner)
- Redis cache: 5min TTL

**Verification:**
- Published block accessible to anyone
- Draft block only accessible to owner
- Cached on repeated requests

---

### 2.3 Implement User Profile Endpoint

**File:** `apps/web/src/app/api/v1/users/[username]/route.ts`

**Features:**
- Public profile data
- Follower/following counts
- Redis cache: 5min TTL

**Verification:**
- Profile loads with correct data
- Counts are accurate
- Cached appropriately

---

### 2.4 Add Cache Invalidation

**Logic:**
- On block create/update/publish → invalidate `block:{id}`, `feed:*`
- On user update → invalidate `user:{username}`

**Verification:**
- Update block → next request fetches fresh data
- Profile update → reflected immediately

---

### 2.5 Migrate Read Hooks

**Files to modify:**
- `packages/api/src/hooks/useBlock.ts` - `useBlock` query
- `packages/api/src/hooks/useFeed.ts`
- `packages/api/src/hooks/useUser.ts`

**Verification:**
- All pages still load correctly
- No direct Supabase calls for migrated operations

---

### 2.6 Add Sentry Error Tracking

**Tasks:**
- [ ] Install `@sentry/nextjs`
- [ ] Configure in `next.config.js`
- [ ] Add error boundary

**Verification:**
- Trigger error → appears in Sentry dashboard
- Source maps work (can see original code)

---

## Phase 3: Social & Commerce (Week 5-6)

**Goal:** Secure social interactions and payments

### 3.1 Social Endpoints

**Files:**
- `apps/web/src/app/api/v1/blocks/[id]/like/route.ts` - POST, DELETE
- `apps/web/src/app/api/v1/blocks/[id]/save/route.ts` - POST, DELETE
- `apps/web/src/app/api/v1/users/[username]/follow/route.ts` - POST, DELETE
- `apps/web/src/app/api/v1/blocks/[id]/comments/route.ts` - GET, POST

**Features:**
- Rate limiting (social tier: 60/min)
- Comment sanitization (HTML escape, length limit 2000 chars)
- Optimistic UI support (return updated counts)

**Verification:**
- Like/unlike works, count updates
- Comment created, appears in list
- Rate limit enforced

---

### 3.2 Notifications Endpoint

**File:** `apps/web/src/app/api/v1/notifications/route.ts`

**Features:**
- GET: list notifications (paginated)
- POST `/read`: mark as read
- GET `/count`: unread count

**Verification:**
- Notifications list correctly
- Mark as read updates count
- Realtime still works (Supabase direct for subscriptions)

---

### 3.3 Pattern Endpoints

**Files:**
- `apps/web/src/app/api/v1/patterns/route.ts` - GET, POST
- `apps/web/src/app/api/v1/patterns/[id]/route.ts` - GET, PATCH, DELETE
- `apps/web/src/app/api/v1/patterns/[id]/publish/route.ts` - POST
- `apps/web/src/app/api/v1/patterns/[id]/purchase/route.ts` - POST

**Verification:**
- Pattern CRUD works
- Purchase flow creates Stripe PaymentIntent
- Premium content access controlled

---

### 3.4 Stripe Webhook Handler

**File:** `apps/web/src/app/api/v1/webhooks/stripe/route.ts`

**Events to handle:**
- `payment_intent.succeeded` → create purchase record
- `account.updated` → update partner status

**Verification:**
- Use Stripe CLI to send test webhooks
- Purchase record created on success

---

## Phase 4: Optimization & Observability (Week 7-8)

**Goal:** Performance tuning and monitoring

### 4.1 Database Optimizations

**SQL migrations to add:**
```sql
-- Full-text search
CREATE INDEX blocks_search_idx ON public.blocks
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX patterns_search_idx ON public.quilt_patterns
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

**Verification:**
- `EXPLAIN ANALYZE` shows index usage
- Search queries < 100ms

---

### 4.2 Search Endpoint

**File:** `apps/web/src/app/api/v1/search/route.ts`

**Features:**
- Query param: `?q=term&type=blocks|patterns|users`
- Full-text search for blocks/patterns
- Prefix match for usernames

**Verification:**
- Search returns relevant results
- Results ordered by relevance

---

### 4.3 Performance Testing

**Tools:** k6 or Artillery

**Test scenarios:**
- Feed endpoint under load (100 concurrent users)
- Rate limiting works under load
- Cache effectiveness

**Targets:**
- p95 latency < 200ms
- Cache hit rate > 80% for feeds

---

### 4.4 Documentation

**Files to update:**
- `docs/TECH_ARCHITECTURE.md` - Update with new architecture
- `README.md` - Add API section
- Create `docs/API.md` - API reference

---

### 4.5 Mobile Parity Testing

**Verification:**
- All API endpoints work from Expo app
- Auth flow works on mobile
- Rate limiting respects mobile clients

---

## Summary Checklist

### Phase 1 Deliverables
- [ ] API directory structure created
- [ ] Rate limiting middleware
- [ ] Auth middleware
- [ ] Server-side Supabase client
- [ ] Block write endpoints (create, update, publish)
- [ ] HTTP client in packages/api
- [ ] Block hooks migrated

### Phase 2 Deliverables
- [ ] Feed endpoint with caching
- [ ] Block read endpoint with caching
- [ ] User profile endpoint with caching
- [ ] Cache invalidation logic
- [ ] Read hooks migrated
- [ ] Sentry integration

### Phase 3 Deliverables
- [ ] Social endpoints (like, save, follow, comments)
- [ ] Notifications endpoint
- [ ] Pattern endpoints
- [ ] Stripe webhook handler

### Phase 4 Deliverables
- [ ] Database indexes added
- [ ] Search endpoint
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Mobile testing completed

---

## Relationship to IMPLEMENTATION_PLAN.md

The existing `IMPLEMENTATION_PLAN.md` focuses on Block & Pattern Designer features (iterations 1.1-2.8).

After completing this architecture migration:
- Iterations 1.1-1.10 (already complete) will continue working via RLS
- Iteration 1.11+ (save/publish) will use the new API endpoints
- All new features will use the API layer

**Recommendation:** Complete Phase 1 of this plan before continuing with IMPLEMENTATION_PLAN.md iteration 1.11 (Save Draft & Publish).

---

## Reference: Full Design Document

See the complete technical design document at:
`~/.claude/plans/enchanted-puzzling-stonebraker.md`

This includes:
- Detailed architecture diagrams
- Security analysis
- Caching strategy
- API route structure
- Tradeoffs considered
- Future compliance considerations

---

_Document generated: 2026-02-03_
