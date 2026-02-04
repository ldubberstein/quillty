# Quillty Architecture Documentation

This folder contains detailed documentation for the Quillty application architecture, including guides for each major technology component.

## Overview

Quillty uses a modern full-stack architecture built on:

- **Frontend**: Next.js 14 (App Router) + React
- **Backend**: Next.js API Routes (`/api/v1/*`)
- **Database**: Supabase (PostgreSQL)
- **Caching**: Upstash Redis
- **Authentication**: Supabase Auth with JWT validation
- **Payments**: Stripe Connect

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloudflare (CDN/WAF)                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │  Web Client  │   │Mobile Client │   │   Webhooks   │
        │  (Next.js)   │   │   (Expo)     │   │  (Stripe)    │
        └──────────────┘   └──────────────┘   └──────────────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (/api/v1)                     │
│                         (Hosted on Vercel)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │Rate Limiter │  │ Validator   │  │    Auth     │  │  Cache    │  │
│  │ (Upstash)   │  │   (Zod)     │  │ Middleware  │  │ (Redis)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
     │Upstash Redis │      │   Supabase   │      │   Supabase   │
     │(Cache/Rate)  │      │  PostgreSQL  │      │   Storage    │
     └──────────────┘      └──────────────┘      └──────────────┘
```

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | High-level architecture and design decisions |
| [UPSTASH_REDIS.md](./UPSTASH_REDIS.md) | Caching and rate limiting with Upstash Redis |
| [SUPABASE.md](./SUPABASE.md) | Database operations and authentication |
| [RATE_LIMITING.md](./RATE_LIMITING.md) | Rate limiting configuration and usage |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | JWT validation and auth middleware |
| [TESTING.md](./TESTING.md) | Testing strategies and patterns |

## Quick Reference

### API Endpoints

All API endpoints follow the pattern `/api/v1/{resource}`:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/blocks` | POST | Create blocks |
| `/api/v1/blocks/[id]` | GET, PATCH, DELETE | Block CRUD |
| `/api/v1/blocks/[id]/like` | POST, DELETE | Like/unlike |
| `/api/v1/patterns` | GET, POST | List/create patterns |
| `/api/v1/patterns/[id]` | GET, PATCH, DELETE | Pattern CRUD |
| `/api/v1/feed` | GET | Get feed items |
| `/api/v1/search` | GET | Search content |
| `/api/v1/users/[username]` | GET | User profile |
| `/api/v1/notifications` | GET | List notifications |

### Cache TTLs

| Content Type | TTL | Key Pattern |
|--------------|-----|-------------|
| Feed (forYou) | 60s | `feed:forYou:{cursor}` |
| Feed (following) | 30s | `feed:following:{userId}:{cursor}` |
| Blocks | 5min | `block:{id}` |
| Patterns | 5min | `pattern:{id}` |
| Users | 5min | `user:{username}` |
| Search | 2min | `search:{type}:{query}:{cursor}` |

### Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| General API | 100 req | 1 minute |
| Create operations | 20 req | 1 minute |
| Publish | 5 req | 1 minute |
| Social actions | 60 req | 1 minute |

## Related Documentation

- [API.md](../API.md) - Complete API reference
- [TECH_ARCHITECTURE.md](../TECH_ARCHITECTURE.md) - Original tech architecture doc
- [DATA_MODEL.md](../DATA_MODEL.md) - Database schema documentation
