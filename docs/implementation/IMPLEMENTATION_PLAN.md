# Block & Pattern Designer Implementation Plan

## Document Info

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2026-02-02 | Draft — Awaiting Approval |

---

## 1. Prerequisites

Before implementation, ensure these documents have been reviewed:

- [PRD_BLOCK_PATTERN_DESIGNER.md](./PRD_BLOCK_PATTERN_DESIGNER.md) — User flows, decisions log, UI standards
- [DATA_MODEL.md](./DATA_MODEL.md) — Shape-centric data model, TypeScript types, undo/redo
- [TECH_RESEARCH_RENDERING.md](./TECH_RESEARCH_RENDERING.md) — Konva.js (web) + React Native Skia (mobile)

---

## 2. Audit: Existing Types vs. DATA_MODEL.md

### Current Code (`packages/core/src/block-designer/types.ts`)

```typescript
// Cell-centric model (OUTDATED)
type CellShape = 'square' | 'hst' | 'qst';
type Cell = { row, col, shape, rotation, colors: string[] };
type BlockDesign = { gridSize: 2-12, cells: Cell[], fabricMapping: Record<string, string> };
```

### Required by DATA_MODEL.md

| Aspect | Current | Required | Discrepancy |
|--------|---------|----------|-------------|
| **Architecture** | Cell-centric (`Cell[]`) | Shape-centric (`Shape[]`) | **Major**: Complete redesign needed |
| **Shape Types** | `square, hst, qst` | `square, hst, flying_geese` (MVP) | Missing `flying_geese`, QST deferred |
| **Shape IDs** | None | UUID per shape | **Critical**: Required for undo/redo |
| **HST Orientation** | `rotation: 0\|90\|180\|270` | `variant: 'nw'\|'ne'\|'sw'\|'se'` | Different approach |
| **HST Colors** | `colors: string[]` | `fabric_role` + `secondary_fabric_role` | Role-based, not array |
| **Multi-cell Shapes** | Not supported | `span: { rows, cols }` | Needed for Flying Geese |
| **Grid Size** | `2-12` | `2\|3\|4` (MVP) | More constrained |
| **Fabric System** | `fabricMapping: Record` | `Palette` with `FabricRole[]` | Role-based palette |
| **Block Metadata** | None | `id, creator_id, title, status, etc.` | Missing all metadata |

### Conclusion

The existing types need **significant updates** to match DATA_MODEL.md. The current cell-based approach must be replaced with a shape-centric model. This will be addressed in Iteration 1.1.

---

## 3. MVP Shape Scope

Per PRD_BLOCK_PATTERN_DESIGNER.md §9 decisions:

| Shape | MVP Status | Notes |
|-------|------------|-------|
| `SquareShape` | **Included** | 1×1 solid square |
| `HstShape` | **Included** | 4 variants (◸◹◺◿), 2 fabric roles |
| `FlyingGeeseShape` | **Included** | 2:1 ratio, two-tap placement |
| `QstShape` | **Deferred** | Post-MVP, exists in DATA_MODEL.md for extensibility |

---

## 4. Implementation Iterations

### Block Designer — Core (Iterations 1.1 – 1.11)

---

### Iteration 1.1: Core Types & Interfaces

**Scope:**
- Create shape-centric type definitions matching DATA_MODEL.md §3
- Define `ShapeType`, `HstVariant`, `FlyingGeeseDirection`
- Define `BaseShape`, `SquareShape`, `HstShape`, `FlyingGeeseShape`
- Define `GridPosition`, `Span`, `FabricRoleId`
- Define `FabricRole`, `Palette`, `DEFAULT_PALETTE`
- Define `Block` interface with all metadata fields
- Create Zod schemas for runtime validation

**Files:**
- `packages/core/src/block-designer/types.ts` (rewrite)
- `packages/core/src/block-designer/schemas.ts` (new)
- `packages/core/src/block-designer/constants.ts` (new)

**Dependencies:**
- None (foundation)

**Test Cases (UI):**
- [ ] N/A — this iteration is types only
- [ ] Run `pnpm typecheck` — no errors
- [ ] Run `pnpm lint` — no errors

**Acceptance Criteria:**
- All types from DATA_MODEL.md §3.3-3.5 are implemented
- Zod schemas validate shape data correctly
- TypeScript compiles without errors

---

### Iteration 1.2: Zustand Store Setup

**Scope:**
- Create `useBlockDesignerStore` Zustand store
- Store state: `block`, `selectedShapeId`, `activeFabricRole`, `mode`
- Store actions: `addShape`, `removeShape`, `updateShape`, `selectShape`, `setActiveFabricRole`
- Initialize with empty 3×3 block and DEFAULT_PALETTE

**Files:**
- `packages/core/src/block-designer/store.ts` (new)
- `packages/core/src/block-designer/index.ts` (update exports)

**Dependencies:**
- Iteration 1.1 (types)

**Test Cases (UI):**
- [ ] N/A — store-only, no UI yet
- [ ] Run `pnpm typecheck` — no errors
- [ ] Verify store can be imported in web app without errors

**Acceptance Criteria:**
- Store initializes with default state
- Actions correctly mutate state
- Types are properly inferred

---

### Iteration 1.3: Empty Canvas Rendering (Web)

**Scope:**
- Install and configure react-konva in web app
- Create `BlockCanvas` component with Konva Stage and Layer
- Render 3×3 grid lines (no shapes yet)
- Add basic zoom controls ([−] [%] [+] [Fit])
- Canvas should be responsive to container size

**Files:**
- `apps/web/package.json` (add react-konva, konva dependencies)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (new)
- `apps/web/src/components/block-designer/GridLines.tsx` (new)
- `apps/web/src/components/block-designer/ZoomControls.tsx` (new)
- `apps/web/src/app/design/block/page.tsx` (new route)

**Dependencies:**
- Iteration 1.2 (store for grid size)

**Test Cases (UI):**
- [ ] Navigate to `/design/block` — canvas renders with 3×3 grid lines visible
- [ ] Click [+] zoom — canvas zooms in
- [ ] Click [−] zoom — canvas zooms out
- [ ] Click [Fit] — canvas fits to viewport
- [ ] Resize browser window — canvas adapts
- [ ] No console errors in devtools

**Acceptance Criteria:**
- Empty 3×3 grid visible with cell boundaries
- Zoom controls functional
- Canvas is centered in viewport

---

### Iteration 1.4: Shape Placement (Squares)

**Scope:**
- Tap empty cell → show shape picker popup near tap point
- Shape picker shows only "Square" option initially
- Select Square → place SquareShape in cell with background role
- Render filled squares on canvas using Konva Rect
- Tapping occupied cell does NOT trigger picker (edit mode later)

**Files:**
- `apps/web/src/components/block-designer/ShapePicker.tsx` (new)
- `apps/web/src/components/block-designer/SquareRenderer.tsx` (new)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (update)
- `packages/core/src/block-designer/store.ts` (update addShape)

**Dependencies:**
- Iteration 1.3 (canvas)

**Test Cases (UI):**
- [ ] Tap empty cell at (0,0) — shape picker appears near tap point
- [ ] Select "Square" — cell fills with background color (#FFFFFF or visible default)
- [ ] Tap another empty cell — picker appears again
- [ ] Place square at (1,1) — second square renders
- [ ] Tap outside grid — picker dismisses, nothing placed
- [ ] Tap already-filled cell — picker does NOT appear
- [ ] No console errors

**Acceptance Criteria:**
- Squares can be placed in any empty cell
- Picker appears near tap location (not fixed position)
- Multiple squares can be placed

---

### Iteration 1.5: Shape Placement (HST Variants)

**Scope:**
- Add 4 HST options to shape picker: ◸ ◹ ◺ ◿
- Each option pre-renders the correct triangle orientation
- Select HST variant → place HstShape with correct `variant`
- Render HSTs using Konva Line (polygon) with two colors
- Primary triangle uses `fabric_role`, secondary uses `secondary_fabric_role`

**Files:**
- `apps/web/src/components/block-designer/ShapePicker.tsx` (update)
- `apps/web/src/components/block-designer/HstRenderer.tsx` (new)
- `packages/core/src/block-designer/geometry/hst.ts` (new — path calculations)

**Dependencies:**
- Iteration 1.4 (shape picker)

**Test Cases (UI):**
- [ ] Tap empty cell — picker shows Square + 4 HST variants
- [ ] Select "◹" (NE) — HST renders with diagonal from top-right to bottom-left
- [ ] Select "◸" (NW) — HST renders with diagonal from top-left to bottom-right
- [ ] Select "◺" (SW) — HST renders with bottom-left filled
- [ ] Select "◿" (SE) — HST renders with bottom-right filled
- [ ] Each HST shows two distinct colors (primary + secondary)
- [ ] HSTs and Squares can coexist on canvas

**Acceptance Criteria:**
- All 4 HST variants render correctly
- Diagonal direction matches the picker icon
- Two-color fill is visible

---

### Iteration 1.6: Shape Placement (Flying Geese)

**Scope:**
- Add "Flying Geese" to shape picker
- Implement two-tap placement flow:
  1. First tap selects starting cell, highlights valid adjacent cells
  2. Second tap on adjacent cell completes placement (horizontal or vertical)
  3. Tap on non-adjacent/same cell cancels
- Flying Geese spans 2 cells (1×2 or 2×1)
- Render center triangle + two side triangles

**Files:**
- `apps/web/src/components/block-designer/ShapePicker.tsx` (update)
- `apps/web/src/components/block-designer/FlyingGeeseRenderer.tsx` (new)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (update for two-tap mode)
- `packages/core/src/block-designer/geometry/flyingGeese.ts` (new)
- `packages/core/src/block-designer/store.ts` (add placement mode state)

**Dependencies:**
- Iteration 1.5 (shape picker)

**Test Cases (UI):**
- [ ] Tap empty cell, select "Flying Geese" — first cell highlights, adjacent cells glow
- [ ] Tap cell to the right — horizontal Flying Geese placed spanning both cells
- [ ] Tap cell below — vertical Flying Geese placed spanning both cells
- [ ] Tap same cell again — cancels placement, returns to normal mode
- [ ] Tap non-adjacent cell — cancels placement
- [ ] Flying Geese at grid edge — only valid adjacent cells highlighted
- [ ] Toast appears if no valid pairs: "Not enough space for Flying Geese here."

**Acceptance Criteria:**
- Two-tap flow works correctly
- Flying Geese spans 2 cells visually
- Invalid placements are prevented with feedback

---

### Iteration 1.7: Palette & Paint Mode

**Scope:**
- Create Fabric Panel sidebar with 4 roles: Background, Feature, Accent 1, Accent 2
- Each role shows a color swatch
- Tap role → enters "paint mode" (role becomes active)
- In paint mode, tap any shape → assigns active role to shape
- Tap role's color swatch → opens color picker to change role color
- All shapes with that role update immediately

**Files:**
- `apps/web/src/components/block-designer/FabricPanel.tsx` (new)
- `apps/web/src/components/block-designer/ColorPicker.tsx` (new)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (update tap handling)
- `packages/core/src/block-designer/store.ts` (add setRoleColor action)

**Dependencies:**
- Iteration 1.6 (shapes placed)

**Test Cases (UI):**
- [ ] Fabric Panel visible on right side of screen
- [ ] Shows 4 roles with colored swatches
- [ ] Tap "Feature" role — role highlights as active
- [ ] Tap a square on canvas — square changes to Feature color
- [ ] Tap another square — also changes to Feature color (still in paint mode)
- [ ] Tap Feature's color swatch — color picker opens
- [ ] Select red (#FF0000) — Feature color updates, all Feature shapes turn red
- [ ] Tap outside panel to deselect role — exits paint mode

**Acceptance Criteria:**
- Paint mode works for assigning roles
- Color picker changes role color globally
- All shapes with role update in real-time

---

### Iteration 1.8: Shape Selection & Editing

**Scope:**
- Tap a placed shape (when not in paint mode) → shape becomes selected
- Show floating toolbar above selection: [↺ 90°] [↔ Flip] [↕ Flip] [🗑 Delete]
- Rotate rotates entire shape 90° clockwise
- Flip H/V mirrors the shape
- Delete removes the shape
- Tap outside shape deselects

**Files:**
- `apps/web/src/components/block-designer/FloatingToolbar.tsx` (new)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (update selection)
- `packages/core/src/block-designer/store.ts` (add rotate, flip, delete actions)
- `packages/core/src/block-designer/geometry/transform.ts` (new)

**Dependencies:**
- Iteration 1.7 (shapes with colors)

**Test Cases (UI):**
- [ ] Tap placed HST — floating toolbar appears above it
- [ ] Tap [↺ 90°] — HST rotates 90° (variant changes nw→ne→se→sw→nw)
- [ ] Tap [↔ Flip] — HST flips horizontally
- [ ] Tap [↕ Flip] — HST flips vertically
- [ ] Tap [🗑 Delete] — shape removed from canvas
- [ ] Tap empty area — toolbar disappears, nothing selected
- [ ] Toolbar repositions if near edge (doesn't clip off screen)

**Acceptance Criteria:**
- Selection visual feedback is clear
- All toolbar actions work correctly
- Toolbar auto-positions to stay visible

---

### Iteration 1.9: Undo/Redo

**Scope:**
- Implement command pattern per DATA_MODEL.md §10
- Operations: add_shape, remove_shape, update_shape, batch
- Each operation stores data needed for inverse
- Add undo/redo buttons to toolbar
- Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
- Max history: 100 operations

**Files:**
- `packages/core/src/block-designer/history/undoManager.ts` (new)
- `packages/core/src/block-designer/history/operations.ts` (new)
- `packages/core/src/block-designer/store.ts` (integrate undo manager)
- `apps/web/src/components/block-designer/Toolbar.tsx` (add undo/redo buttons)

**Dependencies:**
- Iteration 1.8 (all shape operations)

**Test Cases (UI):**
- [ ] Add a square → undo → square disappears
- [ ] Redo → square reappears
- [ ] Delete shape → undo → shape restored
- [ ] Rotate shape → undo → rotation reverted
- [ ] Change palette color → undo → all shapes revert color
- [ ] Undo button disabled when stack empty
- [ ] Redo button disabled when stack empty
- [ ] Cmd+Z triggers undo
- [ ] Cmd+Shift+Z triggers redo
- [ ] 100+ operations → oldest operations dropped (no memory issues)

**Acceptance Criteria:**
- All operations are undoable/redoable
- Keyboard shortcuts work
- History is bounded

---

### Iteration 1.10: Preview Mode

**Scope:**
- Add "Preview" toggle button
- Toggle shows 3×3 grid of the block repeated
- Add rotation preset dropdown: "All same", "Alternating", "Pinwheel", "Random"
- "Alternating" = 0°, 90°, 0°, 90° checkerboard
- "Pinwheel" = 0°, 90°, 180°, 270° around center
- Tap any block in preview → returns to single-block edit mode

**Files:**
- `apps/web/src/components/block-designer/PreviewMode.tsx` (new)
- `apps/web/src/components/block-designer/PreviewControls.tsx` (new)
- `apps/web/src/components/block-designer/BlockCanvas.tsx` (update)

**Dependencies:**
- Iteration 1.9 (all editing complete)

**Test Cases (UI):**
- [ ] Tap "Preview" toggle — canvas shows 3×3 repeat of block
- [ ] All blocks render with current palette colors
- [ ] Select "Alternating" — blocks rotate in checkerboard pattern
- [ ] Select "Pinwheel" — blocks rotate 0°, 90°, 180°, 270°
- [ ] Select "Random" — blocks have random rotations
- [ ] Tap a block instance — returns to single-block edit mode
- [ ] Tap "Preview" again — exits preview mode

**Acceptance Criteria:**
- Preview renders 9 copies of the block
- Rotation presets apply correctly
- Non-destructive (doesn't change block's saved orientation)

---

### Iteration 1.11: Save Draft & Publish

**Scope:**
- Add "Save Draft" and "Publish" buttons
- Save Draft: Persist to Supabase `blocks` table with status='draft'
- Auto-save draft every 30 seconds (debounced)
- Publish: Open modal for name, description, tags
- Tags auto-detected from description (#hashtags)
- Validate: must have at least 1 shape to publish
- On publish: status='published', trigger thumbnail generation

**Files:**
- `apps/web/src/components/block-designer/SaveControls.tsx` (new)
- `apps/web/src/components/block-designer/PublishModal.tsx` (new)
- `packages/core/src/block-designer/persistence.ts` (new)
- `apps/web/src/lib/supabase/blocks.ts` (new)

**Dependencies:**
- Iteration 1.10 (complete Block Designer)

**Test Cases (UI):**
- [ ] Tap "Save Draft" — block saved, toast "Draft saved"
- [ ] Wait 30s with changes — auto-save triggers silently
- [ ] Refresh page — draft persists and loads
- [ ] Tap "Publish" with 0 shapes — error "Add at least one shape before publishing"
- [ ] Tap "Publish" with shapes — modal opens
- [ ] Enter name "My Block", description "A cool block #modern" — #modern highlighted
- [ ] Tap "Publish" — block publishes, redirects to block view page
- [ ] Network error during save — retry 3x, then show error toast

**Acceptance Criteria:**
- Drafts persist across sessions
- Publish flow validates and saves correctly
- Error handling works gracefully

---

### Pattern Designer — Core (Iterations 2.1 – 2.8)

---

### Iteration 2.1: Pattern Types & State

**Scope:**
- Define Pattern types matching DATA_MODEL.md §3.6
- Define `PatternStatus`, `QuiltGridSize`, `PhysicalSize`
- Define `Pattern`, `BlockInstance`
- Create `usePatternDesignerStore` Zustand store
- Store state: `pattern`, `selectedBlockInstanceId`, `selectedLibraryBlockId`
- Store actions: `addBlockInstance`, `removeBlockInstance`, `updateBlockInstance`

**Files:**
- `packages/core/src/pattern-designer/types.ts` (new)
- `packages/core/src/pattern-designer/schemas.ts` (new)
- `packages/core/src/pattern-designer/store.ts` (new)
- `packages/core/src/pattern-designer/index.ts` (new)

**Dependencies:**
- Iteration 1.11 (Block types for BlockInstance)

**Test Cases (UI):**
- [ ] N/A — types and store only
- [ ] Run `pnpm typecheck` — no errors

**Acceptance Criteria:**
- All Pattern types from DATA_MODEL.md implemented
- Store initializes and actions work

---

### Iteration 2.2: Pattern Canvas

**Scope:**
- Create Pattern Designer page at `/design/pattern`
- Size picker on entry: select rows × cols (default 4×4)
- Render quilt grid with empty slots
- Each slot shows light border indicating it's placeable
- Zoom controls (reuse from Block Designer)

**Files:**
- `apps/web/src/app/design/pattern/page.tsx` (new)
- `apps/web/src/components/pattern-designer/PatternCanvas.tsx` (new)
- `apps/web/src/components/pattern-designer/SizePicker.tsx` (new)
- `apps/web/src/components/pattern-designer/EmptySlot.tsx` (new)

**Dependencies:**
- Iteration 2.1 (pattern store)

**Test Cases (UI):**
- [ ] Navigate to `/design/pattern` — size picker shown
- [ ] Select 5×4 grid — "Create" button enabled
- [ ] Tap "Create" — canvas renders with 5 columns × 4 rows of empty slots
- [ ] Empty slots have visible borders (dashed or light)
- [ ] Zoom controls work
- [ ] Canvas is responsive

**Acceptance Criteria:**
- Size picker allows 2-15 rows/cols
- Empty grid renders with correct dimensions
- Slots are visually distinct

---

### Iteration 2.3: Block Library Panel

**Scope:**
- Create collapsible Block Library panel at bottom
- Three tabs: "My Blocks" | "Saved" | "Platform"
- My Blocks: Fetch user's published blocks from Supabase
- Saved: User's saved community blocks (placeholder for MVP)
- Platform: Curated blocks (placeholder for MVP)
- Each block shows thumbnail rendered with pattern's current palette
- Horizontal scroll on tablet/mobile

**Files:**
- `apps/web/src/components/pattern-designer/BlockLibraryPanel.tsx` (new)
- `apps/web/src/components/pattern-designer/BlockThumbnail.tsx` (new)
- `apps/web/src/lib/supabase/blocks.ts` (update — fetch user blocks)

**Dependencies:**
- Iteration 2.2 (pattern canvas)

**Test Cases (UI):**
- [ ] Library panel visible at bottom (desktop: fixed, tablet: collapsible)
- [ ] "My Blocks" tab shows user's published blocks
- [ ] Each thumbnail renders with pattern's palette colors
- [ ] Change pattern palette → thumbnails update
- [ ] Tap panel collapse button — panel minimizes
- [ ] Tap again — panel expands

**Acceptance Criteria:**
- User's blocks load in My Blocks tab
- Thumbnails render with pattern palette (WYSIWYG)
- Panel is responsive

---

### Iteration 2.4: Select-Then-Place

**Scope:**
- Tap block in library → block becomes "selected" (highlighted)
- Tap empty slot on canvas → selected block placed there
- Tap another empty slot → same block placed again (still selected)
- Tap different block in library → new block selected
- "Fill Empty" button: places selected block in all empty slots

**Files:**
- `apps/web/src/components/pattern-designer/PatternCanvas.tsx` (update)
- `apps/web/src/components/pattern-designer/BlockLibraryPanel.tsx` (update)
- `packages/core/src/pattern-designer/store.ts` (update)

**Dependencies:**
- Iteration 2.3 (library panel)

**Test Cases (UI):**
- [ ] Tap block in library — block highlights with selection border
- [ ] Tap empty slot — block placed, renders with pattern colors
- [ ] Tap another empty slot — same block placed
- [ ] Tap different library block — new selection, previous deselected
- [ ] Tap "Fill Empty" — all empty slots fill with selected block
- [ ] Placed blocks render correctly with rotation 0° initially

**Acceptance Criteria:**
- Select-then-place flow works smoothly
- Multiple blocks can be placed rapidly
- Fill Empty fills all remaining slots

---

### Iteration 2.5: Block Selection & Manipulation

**Scope:**
- Tap placed block on canvas → block selected, floating toolbar appears
- Floating toolbar: [↺ 90°] [↔ Flip] [↕ Flip] [🗑 Delete]
- Rotation rotates BlockInstance (not the Block definition)
- Flip flips the instance
- Delete removes instance (slot becomes empty)
- Tap empty area → deselects

**Files:**
- `apps/web/src/components/pattern-designer/PatternCanvas.tsx` (update)
- `apps/web/src/components/pattern-designer/FloatingToolbar.tsx` (new or reuse)
- `packages/core/src/pattern-designer/store.ts` (update actions)

**Dependencies:**
- Iteration 2.4 (blocks placed)

**Test Cases (UI):**
- [ ] Tap placed block — floating toolbar appears above
- [ ] Tap [↺ 90°] — block rotates 90° clockwise
- [ ] Tap [↺ 90°] 3 more times — cycles through 0°, 90°, 180°, 270°
- [ ] Tap [↔ Flip] — block flips horizontally
- [ ] Tap [↕ Flip] — block flips vertically
- [ ] Tap [🗑 Delete] — block removed, slot empty
- [ ] Tap empty area — deselects, toolbar disappears

**Acceptance Criteria:**
- All instance manipulations work
- Visual feedback is clear
- Toolbar positions correctly

---

### Iteration 2.6: Pattern Palette

**Scope:**
- Pattern owns its own palette (separate from blocks' preview palettes)
- Fabric Panel shows pattern's 4 roles with colors
- Changing role color updates ALL blocks on canvas immediately
- Block Library thumbnails also update with new colors

**Files:**
- `apps/web/src/components/pattern-designer/FabricPanel.tsx` (new or adapt)
- `apps/web/src/components/pattern-designer/PatternCanvas.tsx` (update)
- `packages/core/src/pattern-designer/store.ts` (add palette actions)

**Dependencies:**
- Iteration 2.5 (blocks with colors)

**Test Cases (UI):**
- [ ] Pattern Fabric Panel shows 4 roles
- [ ] Default colors match DEFAULT_PALETTE
- [ ] Tap Feature color swatch → color picker
- [ ] Change to green — all blocks on canvas update to show green for Feature
- [ ] Library thumbnails also show green for Feature
- [ ] Different pattern = different palette (isolated)

**Acceptance Criteria:**
- Pattern palette controls all color display
- Blocks inherit colors from pattern
- WYSIWYG between library and canvas

---

### Iteration 2.7: Grid Resize

**Scope:**
- [+ Column] button on right edge of canvas
- [+ Row] button at bottom edge of canvas
- Tap [+ Column] → adds new column of empty slots
- Tap [+ Row] → adds new row of empty slots
- Minimum grid: 2×2 (can't go below)
- Maximum grid: 15×15 (warning at 15+, hard cap at 25×25)
- Remove via settings menu (secondary action)

**Files:**
- `apps/web/src/components/pattern-designer/PatternCanvas.tsx` (update)
- `apps/web/src/components/pattern-designer/GridResizeButtons.tsx` (new)
- `packages/core/src/pattern-designer/store.ts` (add resize actions)

**Dependencies:**
- Iteration 2.6 (pattern palette)

**Test Cases (UI):**
- [ ] [+ Column] button visible on right edge
- [ ] Tap [+ Column] — new empty column added, dimensions update
- [ ] [+ Row] button visible at bottom
- [ ] Tap [+ Row] — new empty row added
- [ ] Try to resize below 2×2 — blocked with toast
- [ ] Resize to 16×16 — warning appears "May run slowly on some devices"
- [ ] Resize to 26×26 — blocked

**Acceptance Criteria:**
- Grid can be expanded easily
- Minimums and maximums enforced
- Performance warning at 15+

---

### Iteration 2.8: Save & Publish Pattern

**Scope:**
- "Save Draft" and "Publish" buttons
- Save Draft: Persist to Supabase `patterns` table
- Auto-save every 30 seconds
- Publish modal: name, description, tags, difficulty, category
- Validate: must have at least 1 block
- On publish: trigger thumbnail generation Edge Function

**Files:**
- `apps/web/src/components/pattern-designer/SaveControls.tsx` (new)
- `apps/web/src/components/pattern-designer/PublishModal.tsx` (new)
- `packages/core/src/pattern-designer/persistence.ts` (new)
- `apps/web/src/lib/supabase/patterns.ts` (new)

**Dependencies:**
- Iteration 2.7 (complete Pattern Designer)

**Test Cases (UI):**
- [ ] Tap "Save Draft" — pattern saved
- [ ] Refresh page — draft loads correctly
- [ ] Tap "Publish" with 0 blocks — error message
- [ ] Tap "Publish" with blocks — modal opens
- [ ] Enter name, description, select "Beginner" difficulty
- [ ] Tap "Publish" — pattern publishes, redirects to pattern view
- [ ] Published pattern shows thumbnail (may take a moment to generate)

**Acceptance Criteria:**
- Pattern persistence works
- Publish flow validates correctly
- Thumbnail generation triggered

---

## 5. Summary

| Phase | Iterations | Focus |
|-------|------------|-------|
| **Block Designer Core** | 1.1 – 1.11 | Types, canvas, shape placement, palette, editing, undo/redo, preview, persistence |
| **Pattern Designer Core** | 2.1 – 2.8 | Types, canvas, library, placement, manipulation, palette, resize, persistence |

**Total Iterations:** 19

Each iteration is scoped to be testable in 15-30 minutes and leaves the app in a runnable state.

---

## 6. Implementation Rules

When building each iteration:

1. **Use Context7 MCP** for current Konva.js, Zustand, Supabase, and NativeWind docs
2. **Pause after each iteration** — Wait for user to test before proceeding
3. **Run typecheck and lint** before marking complete: `pnpm typecheck && pnpm lint`
4. **Test web first** at `localhost:3000` before considering mobile
5. **Reference the decisions log** in PRD_BLOCK_PATTERN_DESIGNER.md §9 for design choices

---

## 7. Approval

- [ ] Plan reviewed
- [ ] Questions resolved
- [ ] Ready to begin Iteration 1.1

---

_Document generated: 2026-02-02_
