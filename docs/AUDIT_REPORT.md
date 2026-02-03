# Quillty Codebase Audit Report

**Date:** 2026-02-02
**Auditor:** Claude Code
**Scope:** Full codebase review with focus on code created during MVP development

---

## 1. Standards in Effect

### Existing Tools/Configs (Canonical)

| Tool | Config Location | Status |
|------|-----------------|--------|
| **Prettier** | `.prettierrc` | ✅ Configured |
| **ESLint** | `.eslintrc.js` → `packages/config/eslint.js` | ✅ Configured |
| **TypeScript** | `tsconfig.json` + per-package configs | ✅ Strict mode enabled |
| **Turborepo** | `turbo.json` | ✅ Build/lint/typecheck tasks |
| **pnpm** | `pnpm-workspace.yaml` | ✅ Workspaces configured |

### Missing/Incomplete

| Tool | Status | Recommendation |
|------|--------|----------------|
| **CI Pipeline** | ❌ Missing | Add GitHub Actions workflow |
| **Tests** | ❌ No test files found | Add Vitest for packages, Playwright for e2e |
| **Coverage** | ❌ Not configured | Configure with test runner |
| **Pre-commit hooks** | ❌ Not configured | Add Husky + lint-staged |

---

## 2. Inventory of Changes

### packages/api/src/hooks/ (Social Features)
- `useLike.ts` - Like/unlike with optimistic updates
- `useSave.ts` - Save/unsave with optimistic updates
- `useFollow.ts` - Follow/unfollow users
- `useComments.ts` - Comment CRUD operations
- `useNotifications.ts` - Notifications with 30s polling

### apps/web/src/components/ (UI Components)
- `LikeButton.tsx` - Heart icon button
- `SaveButton.tsx` - Bookmark icon button
- `FollowButton.tsx` - Follow/Following toggle
- `CommentSection.tsx` - Comments list + input
- `ProfileActions.tsx` - Profile action buttons

### apps/web/src/app/ (Pages)
- `(main)/activity/page.tsx` - Notifications page
- `(main)/collections/liked/page.tsx` - Liked items collection
- `(main)/collections/saved/page.tsx` - Saved items collection
- `[username]/followers/page.tsx` - Followers list
- `[username]/following/page.tsx` - Following list

### supabase/migrations/
- `20240201000000_initial_schema.sql` - Full schema with RLS

---

## 3. Audit Findings

### 3.1 Correctness / Bugs

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P1** | Lexical declarations in case blocks without braces | `packages/core/src/calculations/cutting.ts:32,37` | Wrap case blocks in braces |
| **P2** | Unused variable `columnWidth` | `packages/ui/src/components/MasonryGrid.tsx:36` | Remove or use the variable |
| **P2** | Unused `error` variables | `apps/mobile/app/(tabs)/profile.tsx:49,62` | Rename to `_error` or remove |
| **P2** | Seed data `comment_count` mismatch | `supabase/seed.sql` | Set counts to 0 or add sample comments |

### 3.2 Security / Auth / Input Validation

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P2** | No comment content length validation | `useComments.ts`, `CommentSection.tsx` | Add max length check (already in mobile: 300) |
| **P2** | Missing XSS protection for comment display | `CommentSection.tsx:170` | Content is displayed with `whitespace-pre-wrap` - should sanitize or use React's built-in escaping (currently safe due to JSX) |
| **P0** | `useResetPassword` uses `window.location.origin` | `useAuth.ts:203` | Will break in React Native; needs platform detection |

### 3.3 Performance / Resource Usage

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P2** | Notifications polling every 30s always runs | `useNotifications.ts:52` | Add `enabled` check for visible tab |
| **P2** | No pagination on user likes/saves queries | `useLike.ts`, `useSave.ts` | Add limit/offset or cursor pagination |
| **P1** | Feed invalidation on every like | `useLike.ts:130` | Consider debouncing or smarter invalidation |

### 3.4 DX / Maintainability / Readability

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P2** | `as never` type assertions for Supabase inserts | Multiple hooks | Use proper typing or suppress with comment |
| **P2** | Duplicated `UserRow` component | `followers/page.tsx`, `following/page.tsx` | Extract to shared component |
| **P2** | Duplicated `FollowListSkeleton` component | `followers/page.tsx`, `following/page.tsx` | Extract to shared component |
| **P1** | Next.js ESLint plugin not configured | `apps/web` | Add `eslint-config-next` |

### 3.5 Architecture / Boundaries

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P2** | Web components not in shared `@quillty/ui` | `apps/web/src/components/` | Consider moving common ones to shared package |
| **P2** | No barrel export for web components | `apps/web/src/components/index.ts` | ✅ Already exists, good |

### 3.6 Testing Gaps

| Severity | Issue | Impact |
|----------|-------|--------|
| **P1** | No unit tests for API hooks | Regressions in social features undetected |
| **P1** | No tests for calculation functions | Cutting/fabric calculations could break silently |
| **P1** | No e2e tests for auth flow | Login/signup issues undetected |

### 3.7 Observability (Logging/Metrics/Errors)

| Severity | Issue | File(s) | Fix |
|----------|-------|---------|-----|
| **P2** | Silent error swallowing in catch blocks | `profile.tsx:49-50, 62-63` | Log errors to console or error service |
| **P2** | No error boundaries beyond root | `apps/web/src/app/` | Add per-route error boundaries |
| **P2** | Console.warn/error allowed but no structured logging | All | Consider structured error tracking (Sentry, etc.) |

---

## 4. Refactor Plan (Prioritized Batches)

### Batch 1: Fix Lint Errors (P1)
**Goal:** Pass `pnpm lint` cleanly
**Files:**
- `packages/core/src/calculations/cutting.ts`
- `packages/ui/src/components/MasonryGrid.tsx`
- `apps/mobile/app/(tabs)/profile.tsx`

**Changes:**
1. Add braces around case blocks in `cutting.ts`
2. Remove unused `columnWidth` in `MasonryGrid.tsx`
3. Rename `error` to `_error` in `profile.tsx`

**Why safe:** Purely cosmetic fixes, no behavior change
**Verify:** `pnpm lint`

---

### Batch 2: Add Next.js ESLint Plugin (P1)
**Goal:** Enable Next.js-specific linting rules
**Files:**
- `apps/web/package.json`
- `apps/web/.eslintrc.js` (create)

**Changes:**
1. Add `eslint-config-next` dependency
2. Create local ESLint config extending base + next

**Why safe:** Adds rules, doesn't change runtime behavior
**Verify:** `pnpm --filter web lint`

---

### Batch 3: Fix Platform-Specific Code (P0)
**Goal:** Prevent `window` reference errors in React Native
**Files:**
- `packages/api/src/hooks/useAuth.ts`

**Changes:**
1. Guard `window.location.origin` with platform check
2. Accept optional `redirectUrl` parameter

**Why safe:** Fixes bug, backwards compatible
**Verify:** Build passes, auth works on web/mobile

---

### Batch 4: Extract Shared Components (P2)
**Goal:** DRY up duplicated code between followers/following pages
**Files:**
- Create `apps/web/src/components/UserRow.tsx`
- Create `apps/web/src/components/FollowListSkeleton.tsx`
- Update `apps/web/src/app/[username]/followers/page.tsx`
- Update `apps/web/src/app/[username]/following/page.tsx`
- Update `apps/web/src/components/index.ts`

**Changes:**
1. Extract `UserRow` to shared component
2. Extract `FollowListSkeleton` to shared component
3. Import from components barrel

**Why safe:** No behavior change, only code organization
**Verify:** Visual inspection of followers/following pages

---

### Batch 5: Add Input Validation (P2)
**Goal:** Consistent validation for user input
**Files:**
- `apps/web/src/components/CommentSection.tsx`
- `packages/api/src/hooks/useComments.ts`

**Changes:**
1. Add `maxLength={500}` to comment textarea
2. Add character counter
3. Validate length before submission

**Why safe:** Adds constraint, doesn't break existing valid input
**Verify:** Try to submit comment > 500 chars

---

### Batch 6: Add CI Pipeline (P1)
**Goal:** Automated quality checks on PRs
**Files:**
- Create `.github/workflows/ci.yml`

**Changes:**
1. Run `pnpm install`
2. Run `pnpm typecheck`
3. Run `pnpm lint`
4. Run `pnpm build`

**Why safe:** New file, no runtime impact
**Verify:** Push branch, check Actions tab

---

### Batch 7: Fix Seed Data (P2)
**Goal:** Consistent counts in seed data
**Files:**
- `supabase/seed.sql`

**Changes:**
1. Set all `comment_count` values to 0
2. Set all `like_count` values to 0 (or add corresponding records)

**Why safe:** Only affects local dev seeding
**Verify:** `supabase db reset --local`, check pattern displays

---

## 5. Summary

| Priority | Count | Status |
|----------|-------|--------|
| P0 | 1 | Platform-specific code issue |
| P1 | 5 | Lint errors, missing tests, CI |
| P2 | 12 | DX improvements, validation |

**Recommended execution order:** Batches 1 → 3 → 2 → 6 → 4 → 5 → 7

---

**Awaiting approval to proceed with Batch 1.**
