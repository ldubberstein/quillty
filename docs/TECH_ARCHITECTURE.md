# Quillty - Technical Architecture

## 1. Overview

This document outlines the technical architecture for Quillty, a social quilting pattern platform.

### 1.1 Platform Strategy

| Platform | Technology | Rationale |
|----------|------------|-----------|
| **iOS** | React Native | Shared codebase with web, fast iteration |
| **Web** | Next.js (React) | SEO for creator profiles, SSR, shared components |
| **Backend** | Supabase | PostgreSQL + Auth + Storage + Realtime, rapid development |

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────┬───────────────────────────────────────────┤
│   iOS App           │              Web App                       │
│   (React Native)    │              (Next.js)                     │
│                     │                                            │
│   Expo managed      │   Vercel hosting                          │
│   workflow          │   App Router + SSR                        │
└─────────┬───────────┴───────────────┬───────────────────────────┘
          │                           │
          │      Shared packages:     │
          │   • UI components (RN Web)│
          │   • API client            │
          │   • Types/schemas         │
          │   • Business logic        │
          │                           │
          └─────────────┬─────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Auth       │  │   Database   │  │   Storage            │  │
│  │              │  │   (Postgres) │  │                      │  │
│  │ • Email/Pass │  │              │  │ • Pattern thumbnails │  │
│  │ • Google     │  │ • Users      │  │ • User avatars       │  │
│  │ • Apple      │  │ • Patterns   │  │ • Fabric uploads     │  │
│  │              │  │ • Blocks     │  │                      │  │
│  └──────────────┘  │ • Social     │  └──────────────────────┘  │
│                    │ • Commerce   │                             │
│  ┌──────────────┐  │              │  ┌──────────────────────┐  │
│  │   Realtime   │  └──────────────┘  │   Edge Functions     │  │
│  │              │                     │                      │  │
│  │ • Feed subs  │                     │ • Stripe webhooks    │  │
│  │ • Notifs     │                     │ • Image processing   │  │
│  │ • Comments   │                     │ • Payout processing  │  │
│  └──────────────┘                     └──────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Stripe     │  │   Resend     │  │   Cloudflare         │  │
│  │              │  │              │  │                      │  │
│  │ • Payments   │  │ • Transact.  │  │ • CDN                │  │
│  │ • Connect    │  │   emails     │  │ • Image optimization │  │
│  │ • Payouts    │  │ • Notifs     │  │ • DDoS protection    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Monorepo Structure

```
quillty/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Auth pages (login, signup)
│   │   │   ├── (feed)/         # Main feed pages
│   │   │   ├── (creator)/      # Creator profile pages
│   │   │   ├── pattern/[id]/   # Pattern detail
│   │   │   ├── block/[id]/     # Block detail
│   │   │   └── @username/      # Public creator profiles
│   │   └── components/         # Web-specific components
│   │
│   └── mobile/                 # React Native (Expo)
│       ├── app/                # Expo Router screens
│       ├── components/         # Mobile-specific components
│       └── ios/                # iOS native config
│
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── components/         # Cross-platform components
│   │   ├── primitives/         # Base design system
│   │   └── icons/              # Icon library
│   │
│   ├── api/                    # Supabase client & hooks
│   │   ├── client.ts           # Supabase client setup
│   │   ├── hooks/              # React Query hooks
│   │   └── types/              # Generated DB types
│   │
│   ├── core/                   # Business logic
│   │   ├── pattern-designer/   # Pattern creation logic
│   │   ├── block-designer/     # Block creation logic
│   │   └── calculations/       # Fabric/yardage calcs
│   │
│   └── config/                 # Shared config
│       ├── eslint/
│       └── typescript/
│
├── supabase/                   # Supabase config
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   └── seed.sql                # Seed data
│
└── turbo.json                  # Turborepo config
```

### 2.2 Technology Choices

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| **Monorepo** | Turborepo | latest | Fast builds, caching |
| **Package Manager** | pnpm | 8.x | Fast, disk efficient |
| **Web Framework** | Next.js | 14.x | App Router, SSR, SEO |
| **Mobile Framework** | Expo | 50.x | Managed workflow, OTA updates |
| **Routing (Mobile)** | Expo Router | 3.x | File-based routing |
| **State Management** | Zustand | 4.x | Simple, performant |
| **Server State** | TanStack Query | 5.x | Caching, sync, optimistic updates |
| **Forms** | React Hook Form | 7.x | Performance, validation |
| **Validation** | Zod | 3.x | TypeScript-first schemas |
| **Styling (Web)** | Tailwind CSS | 3.x | Utility-first, fast |
| **Styling (Mobile)** | NativeWind | 4.x | Tailwind for RN |
| **Animation** | Reanimated | 3.x | 60fps native animations |
| **Icons** | Lucide | latest | Consistent, tree-shakeable |

### 2.3 Shared Component Strategy

Components are built "mobile-first" in `packages/ui` using React Native primitives, then adapted for web:

```typescript
// packages/ui/components/Button.tsx
import { Pressable, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

export function Button({ children, variant = 'primary', onPress }) {
  return (
    <StyledPressable
      className={cn(
        'px-4 py-3 rounded-lg min-h-[44px] items-center justify-center',
        variant === 'primary' && 'bg-brand',
        variant === 'secondary' && 'bg-gray-100'
      )}
      onPress={onPress}
    >
      <StyledText className={cn(
        'font-semibold',
        variant === 'primary' && 'text-white',
        variant === 'secondary' && 'text-gray-900'
      )}>
        {children}
      </StyledText>
    </StyledPressable>
  );
}
```

---

## 3. Backend Architecture (Supabase)

### 3.1 Database Schema

See [DATA_MODEL.md](./DATA_MODEL.md) for complete schema. Key highlights:

**Row Level Security (RLS) Policies:**

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Anyone can view published patterns
CREATE POLICY "Anyone can view published patterns"
  ON quilt_patterns FOR SELECT
  USING (status IN ('published_free', 'published_premium'));

-- Only owner can update their patterns
CREATE POLICY "Users can update own patterns"
  ON quilt_patterns FOR UPDATE
  USING (auth.uid() = creator_id);

-- Purchased patterns are accessible
CREATE POLICY "Buyers can view purchased patterns"
  ON quilt_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.pattern_id = quilt_patterns.id
      AND purchases.buyer_id = auth.uid()
      AND purchases.status = 'completed'
    )
  );
```

### 3.2 Authentication

| Method | Provider | Notes |
|--------|----------|-------|
| Email/Password | Supabase Auth | Primary method |
| Google OAuth | Supabase Auth | Web + iOS |
| Apple Sign In | Supabase Auth | iOS required, web optional |

**Auth Flow:**
1. User signs up → Create auth user → Trigger creates profile row
2. On login → Fetch user profile → Load preferences
3. Session managed via Supabase client (auto-refresh)

### 3.3 Storage Buckets

| Bucket | Access | Purpose | Max Size |
|--------|--------|---------|----------|
| `avatars` | Public | User profile images | 2MB |
| `pattern-thumbnails` | Public | Pattern preview images | 5MB |
| `block-thumbnails` | Public | Block preview images | 2MB |
| `user-fabrics` | Authenticated | Fabric swatch uploads | 5MB |

**Image Processing Pipeline:**
1. Client uploads to Supabase Storage
2. Edge Function triggered on upload
3. Generate multiple sizes (thumbnail, medium, large)
4. Store in Cloudflare R2 for CDN delivery
5. Update record with CDN URLs

### 3.4 Realtime Subscriptions

```typescript
// Subscribe to feed updates
const feedSubscription = supabase
  .channel('feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'quilt_patterns',
    filter: `creator_id=in.(${followedUserIds.join(',')})`
  }, (payload) => {
    // Add new pattern to feed
  })
  .subscribe();

// Subscribe to notifications
const notifSubscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${currentUserId}`
  }, (payload) => {
    // Show notification
  })
  .subscribe();
```

### 3.5 Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `on-user-created` | Auth hook | Create user profile, default collection |
| `on-pattern-published` | DB webhook | Generate thumbnails, update feed |
| `stripe-webhook` | HTTP | Handle payments, update purchases |
| `process-payout` | Cron (daily) | Process pending partner payouts |
| `calculate-fabric` | HTTP | Calculate yardage for pattern |

---

## 4. Commerce Architecture

### 4.1 Stripe Integration

**Stripe Products:**
- Stripe Payments for pattern purchases
- Stripe Connect for partner payouts

**Purchase Flow:**
```
1. User taps "Purchase" → Create Stripe PaymentIntent
2. Show Stripe Payment Sheet (mobile) or Elements (web)
3. On success → Stripe webhook → Edge Function
4. Edge Function:
   - Create purchase record
   - Credit partner balance
   - Send confirmation email
5. Client polls for purchase status
6. Pattern unlocked on success
```

**Partner Onboarding:**
```
1. User applies for Partner status
2. Admin approves application
3. User redirected to Stripe Connect onboarding
4. On completion → Stripe webhook → Update partner record
5. Partner can now publish premium patterns
```

### 4.2 Revenue Split

| Party | Percentage | Notes |
|-------|------------|-------|
| Creator | 80% | Configurable |
| Platform | 20% | Covers Stripe fees + margin |

---

## 5. Pattern Designer Architecture

### 5.1 Canvas Rendering

The pattern designer uses a custom rendering engine for cross-platform consistency:

```typescript
// packages/core/pattern-designer/renderer.ts

interface QuiltDesign {
  columns: number;
  rows: number;
  blocks: PlacedBlock[];
  sashing: SashingConfig | null;
  borders: BorderConfig[];
  fabricMapping: FabricMapping;
}

interface PlacedBlock {
  row: number;
  col: number;
  blockId: string;
  rotation: 0 | 90 | 180 | 270;
  colorOverrides?: Record<string, string>;
}

// Render to Canvas (web) or Skia (mobile)
export function renderQuilt(
  ctx: CanvasRenderingContext2D | SkCanvas,
  design: QuiltDesign,
  options: RenderOptions
) {
  // 1. Calculate dimensions
  // 2. Draw blocks
  // 3. Draw sashing
  // 4. Draw borders
}
```

### 5.2 Block Designer

Block designs are stored as structured JSON:

```typescript
interface BlockDesign {
  gridSize: number;  // e.g., 4 for 4x4
  cells: Cell[];
  fabricMapping: FabricMapping;
}

interface Cell {
  row: number;
  col: number;
  shape: 'square' | 'hst' | 'qst' | 'curve';
  rotation: 0 | 90 | 180 | 270;
  colors: string[];  // fabric keys
}
```

### 5.3 Fabric Calculation

```typescript
// packages/core/calculations/fabric.ts

export function calculateFabricRequirements(
  design: QuiltDesign,
  blockLibrary: Map<string, BlockDesign>
): FabricRequirements {
  // 1. Count all pieces by fabric
  // 2. Calculate cut sizes with seam allowance
  // 3. Optimize cutting layout
  // 4. Add backing & binding
  // 5. Return yardage totals
}
```

---

## 6. Feed Algorithm

### 6.1 For You Feed

The "For You" feed uses a scoring algorithm:

```sql
-- Materialized view refreshed every 5 minutes
CREATE MATERIALIZED VIEW feed_scores AS
SELECT
  p.id,
  p.creator_id,
  p.published_at,
  (
    -- Recency score (decays over time)
    EXP(-EXTRACT(EPOCH FROM (NOW() - p.published_at)) / 86400 * 0.1)
    -- Engagement score
    + (p.like_count * 0.3)
    + (p.save_count * 0.5)
    + (p.comment_count * 0.2)
    -- Creator quality score
    + (SELECT follower_count FROM users WHERE id = p.creator_id) * 0.01
  ) as score
FROM quilt_patterns p
WHERE p.status IN ('published_free', 'published_premium');

-- Query for user's feed
SELECT f.*
FROM feed_scores f
WHERE f.creator_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $user_id)
ORDER BY
  -- Boost content from followed creators
  CASE WHEN f.creator_id IN (SELECT followed_id FROM follows WHERE follower_id = $user_id)
    THEN f.score * 1.5
    ELSE f.score
  END DESC
LIMIT 20 OFFSET $offset;
```

### 6.2 Following Feed

Simple chronological feed:

```sql
SELECT p.*
FROM quilt_patterns p
WHERE p.creator_id IN (
  SELECT followed_id FROM follows WHERE follower_id = $user_id
)
AND p.status IN ('published_free', 'published_premium')
ORDER BY p.published_at DESC
LIMIT 20 OFFSET $offset;
```

---

## 7. Performance Considerations

### 7.1 Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| Feed | TanStack Query | 5 min | On pull-to-refresh |
| Pattern details | TanStack Query | 30 min | On mutation |
| User profile | TanStack Query | 15 min | On mutation |
| Block library | TanStack Query | 1 hour | On publish |
| Static assets | Cloudflare CDN | 1 year | URL versioning |

### 7.2 Image Optimization

- All images served via Cloudflare CDN
- Responsive images with srcset
- WebP format with JPEG fallback
- Lazy loading for below-fold content
- Blur placeholder during load

### 7.3 Bundle Optimization

**Web:**
- Code splitting by route
- Dynamic imports for heavy components (pattern designer)
- Tree shaking via ESM
- Target: <200KB initial JS

**Mobile:**
- Hermes engine for faster startup
- Lazy screens with Expo Router
- Target: <50MB app size

---

## 8. Security

### 8.1 Authentication & Authorization

- All API calls require valid JWT
- RLS policies enforce data access at database level
- Sensitive operations require recent auth (< 5 min)

### 8.2 Data Protection

- All traffic over HTTPS
- Sensitive data encrypted at rest (Supabase default)
- PII handling compliant with GDPR/CCPA
- Payment data never touches our servers (Stripe handles)

### 8.3 Content Protection

- No downloadable PDF generation
- Print view rendered server-side, not cacheable
- Watermarks on premium pattern previews
- Rate limiting on API endpoints

---

## 9. Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Supabase Dashboard | Database metrics, auth events |
| Vercel Analytics | Web vitals, traffic |
| Expo Updates | Mobile deployment tracking |
| Sentry | Error tracking (web + mobile) |
| PostHog | Product analytics, feature flags |

---

## 10. Development Workflow

### 10.1 Local Development

```bash
# Install dependencies
pnpm install

# Start Supabase locally
pnpm supabase start

# Run web app
pnpm --filter web dev

# Run mobile app
pnpm --filter mobile start
```

### 10.2 CI/CD Pipeline

```
Push to main
    │
    ├─► Run tests (Turborepo)
    │
    ├─► Type check (tsc)
    │
    ├─► Lint (ESLint)
    │
    ├─► Build web → Deploy to Vercel (preview)
    │
    └─► Build mobile → EAS Build (preview)

Merge to main
    │
    ├─► Deploy web to production (Vercel)
    │
    ├─► Submit mobile to TestFlight
    │
    └─► Run Supabase migrations
```

---

## 11. Cost Estimates

### 11.1 Infrastructure (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Supabase | Pro | $25 |
| Vercel | Pro | $20 |
| Cloudflare | Pro | $20 |
| Stripe | Pay-as-you-go | 2.9% + $0.30/txn |
| Resend | Pro | $20 |
| Sentry | Team | $26 |
| Expo EAS | Production | $99 |
| **Total** | | **~$210/mo + Stripe fees** |

### 11.2 Scaling Considerations

- Supabase scales to Team ($599/mo) at ~100K MAU
- Image bandwidth may require dedicated CDN at scale
- Consider read replicas for feed queries at scale

---

## Document Info

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial architecture |
