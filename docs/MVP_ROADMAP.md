# Quillty - MVP Roadmap

## Overview

This roadmap phases the Quillty MVP into focused milestones, prioritizing a working product that can validate core assumptions before building advanced features.

### Guiding Principles
1. **Creator-first**: Seed platform with content before consumer features
2. **End-to-end slices**: Each phase delivers a complete, testable user flow
3. **Defer complexity**: Skip nice-to-haves until core loop is validated
4. **Cross-platform parity**: Web and iOS ship together

---

## Phase 0: Foundation

**Goal:** Project infrastructure ready for feature development

### Deliverables

| Task | Details |
|------|---------|
| Monorepo setup | Turborepo + pnpm workspaces |
| Web app scaffold | Next.js 14 with App Router |
| Mobile app scaffold | Expo 50 with Expo Router |
| Shared packages | `ui`, `api`, `core`, `config` |
| Supabase project | Database, Auth, Storage configured |
| CI/CD pipeline | GitHub Actions → Vercel + EAS |
| Dev environment | Local Supabase, hot reload for web+mobile |

### Database Schema
- `users` table with profile fields
- `partners` table (linked to users)
- Initial RLS policies

### Exit Criteria
- [ ] `pnpm dev` runs web app at localhost:3000
- [ ] `pnpm mobile:start` launches Expo on simulator
- [ ] Supabase local instance running with migrations
- [ ] Shared Button component renders on both platforms

---

## Phase 1: Auth & Profiles

**Goal:** Users can sign up, log in, and have a profile

### User Stories Covered
- User can create account (email/password)
- User can log in with Google/Apple
- User can view and edit their profile
- Public profile page exists at `/@username`

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Signup flow | ✅ | ✅ |
| Login flow | ✅ | ✅ |
| Email verification | ✅ | ✅ |
| Google OAuth | ✅ | ✅ |
| Apple Sign In | ✅ | ✅ |
| Profile view | ✅ | ✅ |
| Profile edit | ✅ | ✅ |
| Avatar upload | ✅ | ✅ |
| Public profile page | ✅ (SSR) | Deep link |
| Username selection | ✅ | ✅ |

### Database
- Auth triggers for profile creation
- Avatar storage bucket with policies

### Exit Criteria
- [ ] User can sign up, log out, log back in
- [ ] User can update display name and bio
- [ ] User can upload avatar (displayed at multiple sizes)
- [ ] Public profile at `quillty.com/@username` works
- [ ] Mobile deep links to profile work

---

## Phase 2: Content Browsing

**Goal:** Users can browse and view patterns and blocks

### User Stories Covered
- D1, D2, D4, D5, D6

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| For You feed | ✅ | ✅ |
| Following feed | ✅ | ✅ |
| Masonry grid layout | ✅ | ✅ |
| Infinite scroll | ✅ | ✅ |
| Pull to refresh | ✅ | ✅ |
| Pattern detail page | ✅ | ✅ |
| Block detail page | ✅ | ✅ |
| Pattern thumbnail display | ✅ | ✅ |
| Block thumbnail display | ✅ | ✅ |
| Content type badges | ✅ | ✅ |
| Price badges (Free/Premium) | ✅ | ✅ |

### Database
- `quilt_patterns` table
- `blocks` table
- `feed_scores` materialized view
- Image storage buckets

### Seed Data
- 20+ platform blocks (traditional patterns)
- 10+ sample quilt patterns (internal team)
- Placeholder thumbnails

### Exit Criteria
- [ ] Feed loads with mixed blocks and patterns
- [ ] Scrolling loads more content
- [ ] Tapping a card opens detail page
- [ ] Pattern shows creator, stats, description
- [ ] Block shows "used in X quilts" count

---

## Phase 3: Social Engagement

**Goal:** Users can interact with content and creators

### User Stories Covered
- E1, E2, E3, E4

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Like button (patterns) | ✅ | ✅ |
| Like button (blocks) | ✅ | ✅ |
| Save to collection | ✅ | ✅ |
| Follow creator | ✅ | ✅ |
| Unfollow creator | ✅ | ✅ |
| Comment on pattern | ✅ | ✅ |
| Comment on block | ✅ | ✅ |
| View comments list | ✅ | ✅ |
| Liked collection | ✅ | ✅ |
| Saved collection | ✅ | ✅ |
| Following list | ✅ | ✅ |
| Followers list | ✅ | ✅ |
| Activity/notifications | ✅ | ✅ |

### Database
- `likes` table
- `saves` table
- `follows` table
- `comments` table
- `notifications` table
- Realtime subscriptions

### Exit Criteria
- [ ] Like increments count and saves to collection
- [ ] Save adds pattern to saved collection
- [ ] Following a creator updates Following feed
- [ ] Comments appear on pattern in real-time
- [ ] Notifications appear when someone likes/comments/follows

---

## Phase 4: Block Designer

**Goal:** Users can create and publish custom blocks

### User Stories Covered
- B1, B2, B3, B4

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Block canvas (grid-based) | ✅ | ✅ |
| Square shapes | ✅ | ✅ |
| Half-square triangles | ✅ | ✅ |
| Quarter-square triangles | ✅ | ✅ |
| Color picker | ✅ | ✅ |
| Rotation tool | ✅ | ✅ |
| Mirror/symmetry | ✅ | ✅ |
| Save as draft | ✅ | ✅ |
| Publish block | ✅ | ✅ |
| Block name/description | ✅ | ✅ |
| Hashtags | ✅ | ✅ |
| Thumbnail generation | ✅ | ✅ |

### Technical
- `packages/core/block-designer` logic
- Canvas rendering (web) / Skia rendering (mobile)
- Thumbnail generation Edge Function

### Exit Criteria
- [ ] User can create a 4x4 block with HSTs
- [ ] User can assign colors to pieces
- [ ] User can save draft and resume editing
- [ ] User can publish block to feed
- [ ] Published block appears in feed with correct thumbnail
- [ ] Other users can like/save/comment on block

---

## Phase 5: Pattern Designer (Basic)

**Goal:** Users can create quilt patterns from blocks

### User Stories Covered
- C1, C3, C4, C5

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Quilt canvas (block grid) | ✅ | ✅ |
| Block library browser | ✅ | ✅ |
| Drag-and-drop placement | ✅ | ✅ |
| Block rotation | ✅ | ✅ |
| Resize quilt (rows/cols) | ✅ | ✅ |
| Color/fabric assignment | ✅ | ✅ |
| Solid color palette | ✅ | ✅ |
| Real-time preview | ✅ | ✅ |
| Save as draft | ✅ | ✅ |
| Publish (free) | ✅ | ✅ |
| Auto-generated cutting list | ✅ | ✅ |
| Auto-generated fabric requirements | ✅ | ✅ |

### Technical
- `packages/core/pattern-designer` logic
- `packages/core/calculations` for fabric math
- Pattern data model (JSON structure)

### Deferred to Later
- Sashing
- Borders
- Fabric photo upload
- Premium publishing (needs commerce)

### Exit Criteria
- [ ] User can place blocks on a 5x5 quilt grid
- [ ] User can assign colors to block pieces
- [ ] Fabric requirements calculate correctly
- [ ] User can publish pattern to feed
- [ ] Pattern shows in feed with generated thumbnail

---

## Phase 6: Pattern Viewing & Print

**Goal:** Users can view and print pattern instructions

### User Stories Covered
- A1, A2

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Step-by-step instructions | ✅ | ✅ |
| Interactive checklist | ✅ | ✅ |
| Progress persistence | ✅ | ✅ |
| Cutting instructions | ✅ | ✅ |
| Assembly diagrams | ✅ | ✅ |
| Fabric requirements list | ✅ | ✅ |
| Print view (web only) | ✅ | — |
| Print-optimized layout | ✅ | — |

### Technical
- Instruction generation from pattern data
- Print CSS for 8.5x11 layout
- Progress storage in user data

### Exit Criteria
- [ ] Viewing a pattern shows step-by-step instructions
- [ ] Checking off steps persists across sessions
- [ ] Print view renders cleanly on 8.5x11 paper
- [ ] Cutting instructions match pattern design

---

## Phase 7: Search & Discovery

**Goal:** Users can search and filter content

### User Stories Covered
- D3, D7, D8

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Search bar | ✅ | ✅ |
| Keyword search (patterns) | ✅ | ✅ |
| Keyword search (blocks) | ✅ | ✅ |
| Filter by category | ✅ | ✅ |
| Filter by difficulty | ✅ | ✅ |
| Filter by size | ✅ | ✅ |
| Filter by price (Free/Paid) | ✅ | ✅ |
| Hashtag pages | ✅ | ✅ |
| Trending hashtags | ✅ | ✅ |
| Search creator profiles | ✅ | ✅ |

### Technical
- Full-text search on Postgres
- Filter query builder
- Hashtag extraction and indexing

### Exit Criteria
- [ ] Searching "christmas" returns relevant patterns
- [ ] Filtering by "Beginner" shows only beginner patterns
- [ ] Tapping hashtag shows all content with that tag
- [ ] Trending hashtags update based on recent activity

---

## Phase 8: Commerce (Stripe)

**Goal:** Partners can sell patterns, users can purchase

### User Stories Covered
- P1, P2, P3, P4

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Partner application flow | ✅ | ✅ |
| Stripe Connect onboarding | ✅ | ✅ |
| Set pattern price | ✅ | ✅ |
| Publish as premium | ✅ | ✅ |
| Premium preview (watermarked) | ✅ | ✅ |
| Purchase button | ✅ | ✅ |
| Stripe checkout | ✅ | ✅ |
| Purchase confirmation | ✅ | ✅ |
| Purchased patterns collection | ✅ | ✅ |
| Earnings dashboard | ✅ | ✅ |
| Payout requests | ✅ | ✅ |

### Technical
- Stripe integration (payments + Connect)
- Webhook handlers (Edge Functions)
- Partner earnings tracking
- Payout processing (cron)

### Database
- `purchases` table
- `partner_earnings` table
- `payouts` table

### Exit Criteria
- [ ] User can apply to become Partner
- [ ] Partner can publish pattern with $5 price
- [ ] Other user can purchase pattern via Stripe
- [ ] Purchased pattern unlocks full access + print
- [ ] Partner sees earnings in dashboard
- [ ] Partner can request payout (manual approval for MVP)

---

## Phase 9: Creator Analytics

**Goal:** Partners can track their performance

### User Stories Covered
- G3

### Deliverables

| Feature | Web | Mobile |
|---------|-----|--------|
| Profile views count | ✅ | ✅ |
| Pattern views count | ✅ | ✅ |
| Referrer breakdown | ✅ | ✅ |
| Conversion: view → follow | ✅ | ✅ |
| Conversion: view → purchase | ✅ | ✅ |
| Revenue over time chart | ✅ | ✅ |
| Top performing patterns | ✅ | ✅ |

### Technical
- Analytics event tracking (PostHog)
- Dashboard queries
- Data aggregation

### Exit Criteria
- [ ] Partner dashboard shows key metrics
- [ ] Referrer shows "TikTok", "Instagram", etc.
- [ ] Revenue chart displays last 30 days

---

## Phase 10: Polish & Launch Prep

**Goal:** Production-ready quality

### Deliverables

| Task | Details |
|------|---------|
| Performance optimization | Bundle size, image loading, feed speed |
| Accessibility audit | WCAG 2.1 AA compliance, 44px touch targets |
| Error handling | Graceful degradation, user-friendly messages |
| Empty states | Helpful UI when no content exists |
| Onboarding flow | First-time user experience |
| Email templates | Welcome, purchase confirmation, payout |
| App Store assets | Screenshots, descriptions, keywords |
| Terms of Service | Legal review |
| Privacy Policy | GDPR/CCPA compliant |
| Content moderation | Reporting flow, admin tools |

### Exit Criteria
- [ ] Lighthouse score >90 on key pages
- [ ] All touch targets meet 44x44px minimum
- [ ] iOS app approved for TestFlight
- [ ] Legal documents reviewed and published

---

## MVP Scope Summary

### Included in MVP
- User auth (email, Google, Apple)
- Public creator profiles
- Content feed (For You, Following)
- Pattern and block browsing
- Like, save, comment, follow
- Block designer (basic shapes)
- Pattern designer (basic grid layout)
- Pattern viewing with instructions
- Print view (web)
- Search and filters
- Hashtags
- Partner accounts
- Premium pattern sales
- Stripe payments
- Basic analytics

### Deferred Post-MVP
- Android app
- Fabric photo upload
- Advanced block shapes (curves)
- Sashing and borders
- Pattern remixing/derivatives
- Direct messaging
- Subscription tiers
- Affiliate program
- Offline mode
- Video tutorials

---

## Timeline Estimate

| Phase | Scope | Parallel Work |
|-------|-------|---------------|
| Phase 0 | Foundation | — |
| Phase 1 | Auth & Profiles | — |
| Phase 2 | Content Browsing | Seed data creation |
| Phase 3 | Social Engagement | — |
| Phase 4 | Block Designer | — |
| Phase 5 | Pattern Designer | — |
| Phase 6 | Pattern Viewing | — |
| Phase 7 | Search & Discovery | — |
| Phase 8 | Commerce | Legal prep |
| Phase 9 | Creator Analytics | — |
| Phase 10 | Polish & Launch | App Store prep |

**Note:** Timeline estimates intentionally omitted. Duration depends on team size, experience, and other factors.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Pattern designer complexity | Start with grid-only, defer sashing/borders |
| Stripe Connect approval | Apply early, use test mode until approved |
| App Store rejection | Follow guidelines strictly, prepare for iteration |
| Content moderation at scale | Manual review for MVP, automate later |
| Feed algorithm cold start | Seed with quality content, boost new creators |

---

## Success Metrics for MVP Launch

| Metric | Target |
|--------|--------|
| Registered users | 500 |
| Published patterns | 100 |
| Published blocks | 200 |
| Partners | 20 |
| First paid transaction | ✅ |
| App Store rating | 4.0+ |

---

## Document Info

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial roadmap |
