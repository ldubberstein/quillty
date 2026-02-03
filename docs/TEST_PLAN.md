# Quillty Test Plan

**Status:** Awaiting approval
**Coverage Targets:**
- Logic-heavy (packages/core): 90% lines / 90% statements / 85% branches
- Services (packages/api): 90% lines / 90% statements / 85% branches
- UI (packages/ui): 50% lines (behavioral focus)
- App (apps/mobile): 75% lines (global minimum)

---

## Priority 1: Core Business Logic (packages/core)

These are pure functions with no dependencies - easiest to test and highest value.

### 1.1 PatternDesigner Class

**File:** `packages/core/src/pattern-designer/PatternDesigner.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| constructor defaults | happy | Creates 5x5 grid with 12" blocks by default |
| constructor custom size | happy | Creates grid with specified rows/columns |
| setDimensions valid | happy | Updates rows/columns successfully |
| setDimensions out of range | error | Throws for rows/columns < 1 or > 20 |
| setDimensions removes out-of-bounds blocks | edge | Shrinking grid removes blocks outside new bounds |
| setBlockSize valid | happy | Updates block size |
| setBlockSize zero/negative | error | Throws for non-positive block size |
| placeBlock valid position | happy | Adds block to design |
| placeBlock replaces existing | edge | Placing at occupied position replaces block |
| placeBlock out of bounds | error | Throws for invalid row/col |
| placeBlock with rotation | happy | Places block with specified rotation |
| removeBlock existing | happy | Removes block from design |
| removeBlock non-existing | edge | No-op for empty position |
| getBlock existing | happy | Returns block at position |
| getBlock non-existing | edge | Returns undefined |
| rotateBlock cycles rotations | happy | 0 -> 90 -> 180 -> 270 -> 0 |
| rotateBlock non-existing | edge | No-op for empty position |
| setBlockColorOverride | happy | Adds color override to block |
| setSashing enabled | happy | Adds sashing config |
| setSashing null | happy | Removes sashing |
| addBorder | happy | Appends border to array |
| removeBorder | happy | Removes border at index |
| setFabric | happy | Adds fabric to mapping |
| getFinishedDimensions no extras | happy | Returns basic grid dimensions |
| getFinishedDimensions with sashing | branch | Adds sashing width to dimensions |
| getFinishedDimensions with borders | branch | Adds border widths to dimensions |
| getFinishedDimensions with both | branch | Combines sashing + borders |
| fillWithBlock | happy | Fills all positions with same block |
| fillAlternating | happy | Checkerboard pattern with two blocks |
| loadDesign | happy | Replaces current design |
| toJSON/fromJSON roundtrip | happy | Serializes and deserializes correctly |
| fromJSON invalid | error | Handles malformed JSON |

**Dependencies to mock:** None (pure TypeScript class)

---

### 1.2 BlockDesigner Class

**File:** `packages/core/src/block-designer/BlockDesigner.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| constructor defaults | happy | Creates 4x4 grid of squares |
| constructor custom size | happy | Creates grid with specified size |
| initializeCells | happy | Creates gridSize^2 cells with defaults |
| setGridSize valid | happy | Reinitializes cells with new size |
| setGridSize out of range | error | Throws for size < 2 or > 12 |
| getCell existing | happy | Returns cell at position |
| getCell non-existing | edge | Returns undefined for invalid position |
| setCell valid | happy | Updates cell properties |
| setCell not found | error | Throws for invalid position |
| setCellShape square | happy | Sets shape and 1 color |
| setCellShape hst | happy | Sets shape and 2 colors |
| setCellShape qst | happy | Sets shape and 4 colors |
| setCellShape preserves existing colors | edge | Keeps colors when possible |
| setCellColor valid | happy | Updates specific color index |
| setCellColor invalid cell | edge | No-op for non-existing cell |
| rotateCellClockwise cycles | happy | 0 -> 90 -> 180 -> 270 -> 0 |
| rotateCellClockwise invalid cell | edge | No-op for non-existing cell |
| mirrorHorizontal | happy | Mirrors columns (col becomes gridSize-1-col) |
| mirrorVertical | happy | Mirrors rows (row becomes gridSize-1-row) |
| countPieces squares only | happy | Returns cell count |
| countPieces with hst | branch | Each hst counts as 2 pieces |
| countPieces with qst | branch | Each qst counts as 4 pieces |
| countPieces mixed | branch | Correctly sums all piece types |
| loadDesign | happy | Replaces current design |
| toJSON/fromJSON roundtrip | happy | Serializes and deserializes correctly |

**Dependencies to mock:** None (pure TypeScript class)

---

### 1.3 Fabric Calculations

**File:** `packages/core/src/calculations/fabric.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| empty design | edge | Returns zero requirements |
| single square block | happy | Calculates basic fabric area |
| block with hst cells | branch | Calculates half-square triangle area |
| block with qst cells | branch | Calculates quarter-square triangle area |
| multiple blocks same fabric | happy | Aggregates fabric requirements |
| different fabrics | happy | Separates by fabric key |
| with color overrides | branch | Uses override color for grouping |
| sashing fabric | branch | Calculates sashing strip requirements |
| single border | branch | Calculates border strip requirements |
| multiple borders | branch | Accumulates border requirements |
| backing calculation | happy | Calculates backing yardage with overhang |
| binding calculation | happy | Calculates binding strip requirements |
| yardage rounding | edge | Rounds up to nearest 1/8 yard |
| waste factor | edge | Includes 10% waste in calculations |

**Dependencies to mock:** None (pure function)

---

### 1.4 Cutting List Calculations

**File:** `packages/core/src/calculations/cutting.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| empty design | edge | Returns empty array |
| square pieces | happy | Calculates cut size with seam allowance |
| hst pieces | branch | Calculates HST starting square (finish + 7/8") |
| qst pieces | branch | Calculates QST starting square (finish + 1.25") |
| quantity aggregation | happy | Counts identical cuts |
| multiple fabrics | happy | Groups by fabric |
| sorting by size | happy | Largest cuts first |
| formatMeasurement fractions | edge | Converts decimals to quilting fractions (⅛, ¼, ⅜, ½, ⅝, ¾, ⅞) |
| formatMeasurement whole numbers | edge | Returns whole number without fraction |
| formatMeasurement rounding | edge | Rounds to nearest 1/8" |

**Dependencies to mock:** None (pure function)

---

## Priority 2: API Services (packages/api)

These require mocking Supabase but are critical for app functionality.

### 2.1 Auth Hooks

**File:** `packages/api/src/hooks/useAuth.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| useAuth initial loading | happy | Returns isLoading true initially |
| useAuth session exists | happy | Returns user and session |
| useAuth no session | happy | Returns null user |
| useAuth listens for changes | happy | Updates on auth state change |
| useAuth cleanup | edge | Unsubscribes on unmount |
| useSignUp success | happy | Creates user account |
| useSignUp username taken | error | Throws "Username is already taken" |
| useSignUp auth error | error | Propagates Supabase error |
| useSignIn success | happy | Signs in user |
| useSignIn invalid credentials | error | Propagates auth error |
| useSignOut success | happy | Signs out and clears cache |
| useResetPassword success | happy | Sends reset email |
| useResetPassword invalid email | error | Propagates error |
| useUpdatePassword success | happy | Updates password |
| useCheckUsername available | happy | Returns true |
| useCheckUsername taken | happy | Returns false |

**Dependencies to mock:** `supabase.auth.*`, `supabase.from('users')`

---

### 2.2 Pattern Hooks

**File:** `packages/api/src/hooks/usePattern.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| usePattern with id | happy | Fetches pattern with creator |
| usePattern no id | edge | Returns null, disabled query |
| usePattern not found | error | Handles missing pattern |
| useCreatePattern success | happy | Creates pattern, invalidates feed |
| useCreatePattern error | error | Propagates insert error |
| useUpdatePattern success | happy | Updates pattern, invalidates caches |
| useUpdatePattern not found | error | Handles missing pattern |

**Dependencies to mock:** `supabase.from('quilt_patterns')`

---

### 2.3 Feed Hook

**File:** `packages/api/src/hooks/useFeed.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| useFeed forYou | happy | Fetches patterns and blocks |
| useFeed following with follows | happy | Filters by followed users |
| useFeed following no follows | edge | Returns empty array |
| useFeed pagination | happy | Loads next page correctly |
| useFeed combines and sorts | happy | Interleaves by date |
| useFeed error handling | error | Propagates query errors |

**Dependencies to mock:** `supabase.from('quilt_patterns')`, `supabase.from('blocks')`, `supabase.from('follows')`

---

### 2.4 Like Hooks

**File:** `packages/api/src/hooks/useLike.ts`

| Test Case | Type | Description |
|-----------|------|-------------|
| useLikeStatus liked | happy | Returns true |
| useLikeStatus not liked | happy | Returns false |
| useLikeStatus no user | edge | Returns false, disabled |
| useToggleLike like | happy | Inserts like record |
| useToggleLike unlike | happy | Deletes like record |
| useToggleLike optimistic update | happy | Updates cache immediately |
| useToggleLike rollback on error | error | Reverts optimistic update |
| useUserLikes with likes | happy | Returns likes with content |
| useUserLikes empty | edge | Returns empty array |

**Dependencies to mock:** `supabase.from('likes')`

---

## Priority 3: UI Components (packages/ui)

Behavioral tests only - verify user-visible interactions.

### 3.1 Button Component

**File:** `packages/ui/src/components/Button.tsx`

| Test Case | Type | Description |
|-----------|------|-------------|
| renders with text | happy | Displays button text |
| calls onPress | happy | Fires callback on press |
| disabled state | happy | Does not fire when disabled |
| loading state | happy | Shows loading indicator |
| variant styles | happy | Applies correct variant class |

---

### 3.2 FeedCard Component

**File:** `packages/ui/src/components/FeedCard.tsx`

| Test Case | Type | Description |
|-----------|------|-------------|
| renders pattern card | happy | Displays title, image, creator |
| renders block card | happy | Displays name, image, creator |
| like interaction | happy | Calls onLike callback |
| navigation to detail | happy | Calls onPress callback |

---

## Priority 4: Mobile App Screens (apps/mobile)

Integration tests for critical user flows.

### 4.1 Auth Screens

| Test Case | Type | Description |
|-----------|------|-------------|
| Login renders | happy | Shows email, password, submit |
| Login validation | error | Shows error for empty fields |
| Login success navigation | happy | Navigates to home on success |
| Signup renders | happy | Shows all fields |
| Signup username validation | error | Shows taken username error |
| Forgot password flow | happy | Sends reset email |

---

## Remaining Modules (Lower Priority)

| Module | Priority | Notes |
|--------|----------|-------|
| `packages/api/src/hooks/useBlock.ts` | Medium | Similar to usePattern |
| `packages/api/src/hooks/useFollow.ts` | Medium | Follow/unfollow logic |
| `packages/api/src/hooks/useSave.ts` | Medium | Save/unsave logic |
| `packages/api/src/hooks/useComments.ts` | Low | Comment CRUD |
| `packages/api/src/hooks/useNotifications.ts` | Low | Notification queries |
| `packages/api/src/hooks/useStorage.ts` | Low | File upload helpers |
| `packages/api/src/hooks/useUser.ts` | Low | User profile queries |
| `packages/ui/src/components/Avatar.tsx` | Low | Simple image component |
| `packages/ui/src/components/Card.tsx` | Low | Base card wrapper |
| `packages/ui/src/components/PatternCard.tsx` | Low | Pattern-specific card |
| `packages/ui/src/components/BlockCard.tsx` | Low | Block-specific card |
| `packages/ui/src/components/MasonryGrid.tsx` | Low | Grid layout component |

---

## Implementation Order

1. **Batch 1:** PatternDesigner + BlockDesigner (pure logic, no mocks)
2. **Batch 2:** Fabric + Cutting calculations (pure functions)
3. **Batch 3:** Auth hooks (critical user flow)
4. **Batch 4:** Pattern + Feed hooks (core functionality)
5. **Batch 5:** Like hooks (social features)
6. **Batch 6:** UI component tests (Button, FeedCard)
7. **Batch 7:** Mobile auth screens

---

## Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter @quillty/core test
pnpm --filter @quillty/api test
pnpm --filter @quillty/ui test
pnpm --filter mobile test

# Watch mode for development
pnpm --filter @quillty/core test:watch
```

---

## Approval Requested

Please review this test plan and confirm:
1. Priority order is correct
2. Test cases cover the critical paths
3. Ready to proceed with implementation

Once approved, I will implement tests in batches, starting with Batch 1 (PatternDesigner + BlockDesigner).
