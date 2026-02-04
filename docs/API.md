# Quillty API Reference

Base URL: `/api/v1`

## Authentication

The API supports two authentication methods:

1. **Bearer Token** - Include in Authorization header: `Authorization: Bearer <token>`
2. **Cookies** - Session-based auth via Supabase cookies (for SSR)

## Rate Limits

| Tier | Limit | Endpoints |
|------|-------|-----------|
| api | 100/min | General API requests |
| create | 20/min | Create operations |
| publish | 5/min | Publish operations |
| social | 60/min | Likes, follows |
| comments | 10/min | Comment operations |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Response Format

### Success Response

```json
{
  "data": { ... }
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "nextCursor": 1
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }  // Optional validation errors
  }
}
```

## Endpoints

### Auth

#### GET /auth/me
Get current authenticated user.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "is_partner": false,
    "follower_count": 0,
    "following_count": 0
  }
}
```

---

### Blocks

#### GET /blocks
List published blocks.

**Query Parameters:**
- `cursor` (optional) - Pagination cursor
- `creator_id` (optional) - Filter by creator

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "thumbnail_url": "string",
      "grid_size": 4,
      "difficulty": "beginner",
      "like_count": 10,
      "published_at": "timestamp",
      "creator": {
        "id": "uuid",
        "username": "string",
        "display_name": "string",
        "avatar_url": "string"
      }
    }
  ],
  "nextCursor": 1
}
```

#### POST /blocks
Create a new block. **Auth required.**

**Request Body:**
```json
{
  "name": "string (1-100 chars)",
  "description": "string (optional, max 2000 chars)",
  "gridSize": 4,
  "difficulty": "beginner|intermediate|advanced",
  "designData": { ... }
}
```

#### GET /blocks/[id]
Get a single block.

**Response includes:**
- Block details
- Creator info
- `is_liked` and `is_saved` (if authenticated)

#### PATCH /blocks/[id]
Update a block. **Auth required, owner only.**

#### DELETE /blocks/[id]
Delete a block. **Auth required, owner only.**

#### POST /blocks/[id]/publish
Publish a draft block. **Auth required, owner only.**

---

### Block Social Actions

#### POST /blocks/[id]/like
Like a block. **Auth required.**

#### DELETE /blocks/[id]/like
Unlike a block. **Auth required.**

#### POST /blocks/[id]/save
Save a block. **Auth required.**

#### DELETE /blocks/[id]/save
Unsave a block. **Auth required.**

#### GET /blocks/[id]/comments
Get comments on a block.

**Query Parameters:**
- `cursor` (optional) - Pagination cursor

#### POST /blocks/[id]/comments
Add a comment. **Auth required.**

**Request Body:**
```json
{
  "content": "string (1-2000 chars)"
}
```

---

### Patterns

#### GET /patterns
List published patterns.

**Query Parameters:**
- `cursor` (optional)
- `status` (optional) - `published_free` or `published_premium`
- `difficulty` (optional)
- `category` (optional)
- `creator_id` (optional)

#### POST /patterns
Create a new pattern. **Auth required.**

**Request Body:**
```json
{
  "title": "string (1-200 chars)",
  "description": "string (optional)",
  "difficulty": "beginner|intermediate|advanced",
  "category": "string (optional)",
  "size": "string (optional)",
  "designData": { ... }
}
```

#### GET /patterns/[id]
Get a single pattern.

**Response includes:**
- `has_purchased` (if authenticated)
- Full `design_data` only if free or purchased

#### PATCH /patterns/[id]
Update a pattern. **Auth required, owner only, draft status only.**

#### DELETE /patterns/[id]
Delete a pattern. **Auth required, owner only.**

#### POST /patterns/[id]/publish
Publish a pattern. **Auth required, owner only.**

**Request Body:**
```json
{
  "type": "free|premium",
  "priceCents": 499  // Required for premium
}
```

**Notes:**
- Premium patterns require active partner status with completed Stripe onboarding

#### POST /patterns/[id]/purchase
Create payment intent for premium pattern. **Auth required.**

**Response:**
```json
{
  "data": {
    "clientSecret": "stripe_client_secret",
    "amount": 499,
    "currency": "usd"
  }
}
```

---

### Users

#### GET /users/[username]
Get user profile.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "is_partner": false,
    "follower_count": 100,
    "following_count": 50,
    "block_count": 10,
    "pattern_count": 5,
    "is_following": false  // If authenticated
  }
}
```

#### GET /users/[username]/blocks
Get user's published blocks.

#### GET /users/[username]/patterns
Get user's published patterns.

#### POST /users/[username]/follow
Follow a user. **Auth required.**

#### DELETE /users/[username]/follow
Unfollow a user. **Auth required.**

---

### Feed

#### GET /feed
Get content feed.

**Query Parameters:**
- `type` (optional) - `forYou` (default) or `following`
- `cursor` (optional)

**Notes:**
- `following` feed requires authentication
- Results are cached (60s for forYou, 30s for following)

---

### Notifications

#### GET /notifications
List notifications. **Auth required.**

**Query Parameters:**
- `cursor` (optional)

#### POST /notifications/read
Mark notifications as read. **Auth required.**

**Request Body:**
```json
{
  "ids": ["uuid", "uuid"]
}
```

Or mark all:
```json
{
  "all": true
}
```

#### GET /notifications/count
Get unread notification count. **Auth required.**

**Response:**
```json
{
  "data": {
    "count": 5
  }
}
```

---

### Search

#### GET /search
Search blocks, patterns, and users.

**Query Parameters:**
- `q` (required) - Search query (2-100 chars)
- `type` (optional) - `blocks`, `patterns`, `users`, or `all` (default)
- `cursor` (optional)

**Response:**
```json
{
  "data": {
    "blocks": [ ... ],
    "patterns": [ ... ],
    "users": [ ... ]
  },
  "nextCursor": 1
}
```

---

### Webhooks

#### POST /webhooks/stripe
Stripe webhook handler. **Signature verification required.**

Handles events:
- `payment_intent.succeeded` - Creates purchase record
- `account.updated` - Updates partner onboarding status

---

## Caching

The API uses Redis caching with the following TTLs:

| Resource | TTL |
|----------|-----|
| Feed (forYou) | 60s |
| Feed (following) | 30s |
| Block | 5min |
| Pattern | 5min |
| User profile | 5min |
| Search results | 2min |
| Notification count | 1min |

Cache status is indicated via `X-Cache` header:
- `HIT` - Served from cache
- `MISS` - Fresh data
- `SKIP` - Caching skipped (e.g., draft content)

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid request |
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Server error |
