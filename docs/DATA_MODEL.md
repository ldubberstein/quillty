# Quillty Data Model

## Document Info

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial data model design |
| 1.1 | 2026-02-02 | Added thumbnail generation strategy (§9) |
| 1.2 | 2026-02-02 | Added undo/redo state management (§10) |
| 1.3 | 2026-02-03 | Added default value notes: all shapes default to 'background' fabric role |

---

## 1. Design Principles

### 1.1 Core Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Block versioning | **Immutable published blocks** | Updates require new block ("save as"). Simplifies references, enables attribution. |
| Block derivatives | **Fork relationship** | Track `derived_from_block_id`. Parent unchanged. Enables lineage tracking. |
| Geometry representation | **Shape-centric list** | Shapes are first-class entities with position. Extensible, undo-friendly. |
| Palette ownership | **Pattern owns palette** | Blocks store structure + roles. Pattern defines colors. WYSIWYG in library. |
| Grid structure | **Metadata + shapes** | Grid dimensions in metadata. Shapes define their own positions. |
| Multi-cell shapes | **Span property** | Shapes define `span: { rows, cols }`. Single source of truth. |

### 1.2 Extensibility Goals

The data model must support future features without schema changes:

| Future Feature | How Model Supports It |
|----------------|----------------------|
| New shape types (curves, appliqué) | Add to `ShapeType` enum, no schema change |
| Sashing & borders | Add shapes with position outside block grid |
| Colorways (multiple palettes) | Array of palettes per pattern |
| Block remixing | `derived_from_block_id` + `remix_permissions` |
| Fabric photos | `FabricRole.texture_url` field |
| Real-time collaboration | Shape IDs enable CRDT-style merging |
| Undo/redo | Shape list + operation log |

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              QUILLTY DATA MODEL                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │     USER     │
                                    ├──────────────┤
                                    │ id           │
                                    │ username     │
                                    │ display_name │
                                    │ avatar_url   │
                                    │ is_partner   │
                                    └──────┬───────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                ▼                ▼
                   ┌──────────┐     ┌──────────┐     ┌──────────┐
                   │  BLOCK   │     │ PATTERN  │     │  SAVED   │
                   │ (owned)  │     │ (owned)  │     │ CONTENT  │
                   └────┬─────┘     └────┬─────┘     └──────────┘
                        │                │
         ┌──────────────┴──────┐         │
         │                     │         │
         ▼                     ▼         ▼
  ┌─────────────┐       ┌──────────┐  ┌──────────────┐
  │   SHAPE     │       │  BLOCK   │  │   PALETTE    │
  │ (in block)  │       │ INSTANCE │  │ (in pattern) │
  └─────────────┘       │(in quilt)│  └──────────────┘
                        └──────────┘         │
                                             ▼
                                      ┌─────────────┐
                                      │ FABRIC_ROLE │
                                      └─────────────┘


DETAILED RELATIONSHIPS
======================

┌─────────────────┐         ┌─────────────────┐
│      BLOCK      │         │     PATTERN     │
├─────────────────┤         ├─────────────────┤
│ id              │◄────────│ id              │
│ creator_id (FK) │         │ creator_id (FK) │
│ derived_from_id │──┐      │ title           │
│ title           │  │      │ description     │
│ description     │  │      │ grid_size       │
│ grid_size       │  │      │ status          │
│ status          │  │      │ price_cents     │
│ shapes[]        │  │      │ palette         │
│ preview_palette │  │      │ block_instances │
│ hashtags[]      │  │      │ hashtags[]      │
│ published_at    │  │      │ published_at    │
│ created_at      │  │      │ created_at      │
└─────────────────┘  │      └─────────────────┘
         ▲           │               │
         │           │               │
         └───────────┘               │
       (self-reference               │
        for forks)                   │
                                     │
                                     ▼
                        ┌─────────────────────┐
                        │   BLOCK_INSTANCE    │
                        ├─────────────────────┤
                        │ id                  │
                        │ block_id (FK)       │──────► References BLOCK
                        │ position { row,col }│
                        │ rotation (0,90,180, │
                        │           270)      │
                        │ flip_h, flip_v      │
                        └─────────────────────┘
```

---

## 3. Core Type Definitions

### 3.1 Identifiers

```typescript
// All IDs are UUIDs for distributed generation
type UUID = string;

// Timestamps are ISO 8601 strings
type Timestamp = string;
```

### 3.2 User

```typescript
interface User {
  id: UUID;
  username: string;           // Unique, URL-safe
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_partner: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 3.3 Block

```typescript
// Block status lifecycle
type BlockStatus = 'draft' | 'published';

// Grid sizes allowed for MVP
type GridSize = 2 | 3 | 4;

interface Block {
  id: UUID;
  creator_id: UUID;

  // Fork relationship (nullable for original blocks)
  derived_from_block_id: UUID | null;

  // Metadata
  title: string;
  description: string | null;
  hashtags: string[];

  // Grid configuration
  grid_size: GridSize;          // 2×2, 3×3, or 4×4

  // Shape-centric content (the core data)
  shapes: Shape[];

  // Preview palette (for standalone display)
  // When used in pattern, pattern's palette overrides
  preview_palette: Palette;

  // Publishing
  status: BlockStatus;
  published_at: Timestamp | null;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;

  // Computed (not stored, derived at query time)
  // like_count: number;
  // save_count: number;
  // used_in_patterns_count: number;
}
```

### 3.4 Shape (Core Geometry)

```typescript
// Shape types for MVP
// Extensible: add new types without schema migration
type ShapeType =
  | 'square'           // 1×1 solid square
  | 'hst'              // Half-square triangle
  | 'qst'              // Quarter-square triangle (4 triangles)
  | 'flying_geese';    // 2:1 ratio rectangle with center triangle

// HST variants (pre-rotated for picker)
// ◸ = NW (diagonal from top-left to bottom-right, fill top-left)
// ◹ = NE (diagonal from top-right to bottom-left, fill top-right)
// ◺ = SW (fill bottom-left)
// ◿ = SE (fill bottom-right)
type HstVariant = 'nw' | 'ne' | 'sw' | 'se';

// Flying Geese direction (points toward)
type FlyingGeeseDirection = 'up' | 'down' | 'left' | 'right';

// Position in grid (0-indexed)
interface GridPosition {
  row: number;
  col: number;
}

// How many cells a shape occupies
interface Span {
  rows: number;  // 1 for most shapes, 1 for horizontal FG
  cols: number;  // 1 for most shapes, 2 for horizontal FG
}

// Fabric role reference (resolved to color via palette)
type FabricRoleId = 'background' | 'feature' | 'accent1' | 'accent2' | string;

// Base shape interface
interface BaseShape {
  id: UUID;                    // Unique within block, enables undo/redo
  type: ShapeType;
  position: GridPosition;      // Top-left corner of shape
  span: Span;                  // How many cells shape occupies
  fabric_role: FabricRoleId;   // Primary fabric role
}

// Square shape (simplest)
// NOTE: When creating new shapes, default fabric_role to 'background'.
// User colors shapes via paint mode after placement.
interface SquareShape extends BaseShape {
  type: 'square';
  span: { rows: 1, cols: 1 };  // Always 1×1
  // fabric_role inherited from BaseShape (default: 'background')
}

// Half-square triangle
// NOTE: When creating new HST shapes, default both fabric roles to 'background'.
// User colors shapes via paint mode after placement.
interface HstShape extends BaseShape {
  type: 'hst';
  span: { rows: 1, cols: 1 };
  variant: HstVariant;                    // Which corner is filled
  fabric_role: FabricRoleId;              // Primary triangle (default: 'background')
  secondary_fabric_role: FabricRoleId;    // Other half of triangle (default: 'background')
}

// Quarter-square triangle (4 triangles in 1 cell)
interface QstShape extends BaseShape {
  type: 'qst';
  span: { rows: 1, cols: 1 };
  // 4 fabric roles: top, right, bottom, left
  fabric_roles: [FabricRoleId, FabricRoleId, FabricRoleId, FabricRoleId];
}

// Flying Geese (2:1 ratio)
// NOTE: When creating new Flying Geese shapes, default both fabric roles to 'background'.
// User colors shapes via paint mode after placement.
interface FlyingGeeseShape extends BaseShape {
  type: 'flying_geese';
  span: { rows: 1, cols: 2 } | { rows: 2, cols: 1 };  // H or V
  direction: FlyingGeeseDirection;
  fabric_role: FabricRoleId;              // Center triangle (default: 'background')
  secondary_fabric_role: FabricRoleId;    // Side triangles (default: 'background')
}

// Union type for all shapes
type Shape = SquareShape | HstShape | QstShape | FlyingGeeseShape;
```

### 3.5 Palette & Fabric Roles

```typescript
// Color in HSL for better manipulation
// Stored as hex string for simplicity in MVP
type HexColor = string;  // e.g., "#FF5733"

// A fabric role with its assigned color
interface FabricRole {
  id: FabricRoleId;
  name: string;           // Display name: "Background", "Feature", etc.
  color: HexColor;

  // Future: fabric photo texture
  // texture_url?: string;
}

// A complete palette (owned by pattern or block for preview)
interface Palette {
  roles: FabricRole[];
}

// Default palette for new patterns/blocks
const DEFAULT_PALETTE: Palette = {
  roles: [
    { id: 'background', name: 'Background', color: '#FFFFFF' },
    { id: 'feature', name: 'Feature', color: '#1E3A5F' },
    { id: 'accent1', name: 'Accent 1', color: '#E85D04' },
    { id: 'accent2', name: 'Accent 2', color: '#FAA307' },
  ]
};
```

### 3.6 Pattern

```typescript
type PatternStatus = 'draft' | 'published';

// Quilt size in block units
interface QuiltGridSize {
  rows: number;  // 2-25 for MVP
  cols: number;  // 2-25 for MVP
}

// Physical finished size (for fabric calculations)
interface PhysicalSize {
  width_inches: number;
  height_inches: number;
  block_size_inches: number;  // e.g., 12" blocks
}

interface Pattern {
  id: UUID;
  creator_id: UUID;

  // Metadata
  title: string;
  description: string | null;
  hashtags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Grid configuration
  grid_size: QuiltGridSize;
  physical_size: PhysicalSize;

  // The pattern owns the palette
  palette: Palette;

  // Block placements (references to blocks with transforms)
  block_instances: BlockInstance[];

  // Commerce
  status: PatternStatus;
  is_premium: boolean;
  price_cents: number | null;  // null = free

  // Publishing
  published_at: Timestamp | null;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// A block placed in a pattern at a specific position with transforms
interface BlockInstance {
  id: UUID;                    // Unique within pattern
  block_id: UUID;              // Reference to the block
  position: GridPosition;      // Where in the quilt grid
  rotation: 0 | 90 | 180 | 270;
  flip_horizontal: boolean;
  flip_vertical: boolean;
}
```

### 3.7 Saved Content (User Collections)

```typescript
// When a user saves a community block, we store a snapshot
interface SavedBlock {
  id: UUID;
  user_id: UUID;
  original_block_id: UUID;     // The source block
  original_creator_id: UUID;   // For attribution even if original deleted

  // Snapshot of block data at time of save
  // This ensures user's saved copy survives if creator deletes original
  block_snapshot: Block;

  saved_at: Timestamp;
}

// Similar for patterns
interface SavedPattern {
  id: UUID;
  user_id: UUID;
  original_pattern_id: UUID;
  original_creator_id: UUID;
  pattern_snapshot: Pattern;
  saved_at: Timestamp;
}
```

---

## 4. Relationship Diagram: Block to Pattern Flow

```
USER CREATES BLOCK                    USER CREATES PATTERN
==================                    ====================

     ┌──────────────┐                      ┌──────────────┐
     │ Block Editor │                      │Pattern Editor│
     └──────┬───────┘                      └──────┬───────┘
            │                                     │
            ▼                                     ▼
     ┌──────────────┐                      ┌──────────────┐
     │   BLOCK      │                      │   PATTERN    │
     │              │◄─────────────────────│              │
     │ • shapes[]   │   BlockInstance      │ • palette    │
     │ • grid_size  │   references         │ • grid_size  │
     │ • preview_   │   block by ID        │ • block_     │
     │   palette    │                      │   instances[]│
     └──────────────┘                      └──────────────┘
            │                                     │
            │                                     │
            ▼                                     ▼
     ┌──────────────┐                      ┌──────────────┐
     │ Publish as   │                      │ Publish as   │
     │ IMMUTABLE    │                      │ IMMUTABLE    │
     └──────────────┘                      └──────────────┘


RENDERING FLOW
==============

When rendering a block in the Pattern Designer's library:

  ┌─────────────────┐      ┌─────────────────┐
  │ Block's shapes  │      │ Pattern's       │
  │ (structure +    │  +   │ palette         │
  │ role refs)      │      │ (colors)        │
  └────────┬────────┘      └────────┬────────┘
           │                        │
           └──────────┬─────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  RENDERED BLOCK  │
           │  (WYSIWYG)       │
           └──────────────────┘

Each shape references a fabric_role (e.g., "accent1").
Pattern's palette defines what color "accent1" actually is.
Result: Same block structure, different colors per pattern.
```

---

## 5. Database Schema (Supabase/Postgres)

### 5.1 Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_partner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.users(id),
  derived_from_block_id UUID REFERENCES public.blocks(id),

  title TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] DEFAULT '{}',

  grid_size SMALLINT NOT NULL CHECK (grid_size IN (2, 3, 4)),

  -- JSONB for flexible shape storage
  shapes JSONB NOT NULL DEFAULT '[]',

  -- JSONB for palette
  preview_palette JSONB NOT NULL,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patterns
CREATE TABLE public.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.users(id),

  title TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  -- Grid size as JSONB: { rows, cols }
  grid_size JSONB NOT NULL,

  -- Physical size as JSONB: { width_inches, height_inches, block_size_inches }
  physical_size JSONB NOT NULL,

  -- Pattern owns the palette
  palette JSONB NOT NULL,

  -- Block instances as JSONB array
  block_instances JSONB NOT NULL DEFAULT '[]',

  -- Commerce
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_premium BOOLEAN DEFAULT FALSE,
  price_cents INTEGER,

  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved blocks (user collections)
CREATE TABLE public.saved_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  original_block_id UUID NOT NULL,  -- May reference deleted block
  original_creator_id UUID NOT NULL,
  block_snapshot JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, original_block_id)
);

-- Saved patterns (user collections)
CREATE TABLE public.saved_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  original_pattern_id UUID NOT NULL,
  original_creator_id UUID NOT NULL,
  pattern_snapshot JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, original_pattern_id)
);
```

### 5.2 Indexes

```sql
-- Block lookups
CREATE INDEX idx_blocks_creator ON public.blocks(creator_id);
CREATE INDEX idx_blocks_status ON public.blocks(status);
CREATE INDEX idx_blocks_derived_from ON public.blocks(derived_from_block_id);
CREATE INDEX idx_blocks_hashtags ON public.blocks USING GIN(hashtags);
CREATE INDEX idx_blocks_published_at ON public.blocks(published_at DESC)
  WHERE status = 'published';

-- Pattern lookups
CREATE INDEX idx_patterns_creator ON public.patterns(creator_id);
CREATE INDEX idx_patterns_status ON public.patterns(status);
CREATE INDEX idx_patterns_hashtags ON public.patterns USING GIN(hashtags);
CREATE INDEX idx_patterns_published_at ON public.patterns(published_at DESC)
  WHERE status = 'published';

-- Saved content lookups
CREATE INDEX idx_saved_blocks_user ON public.saved_blocks(user_id);
CREATE INDEX idx_saved_patterns_user ON public.saved_patterns(user_id);
```

### 5.3 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_patterns ENABLE ROW LEVEL SECURITY;

-- Blocks: public read for published, owner read/write for all
CREATE POLICY "Published blocks are viewable by everyone"
  ON public.blocks FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view their own blocks"
  ON public.blocks FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own blocks"
  ON public.blocks FOR UPDATE
  USING (auth.uid() = creator_id);

-- Patterns: similar policies
CREATE POLICY "Published patterns are viewable by everyone"
  ON public.patterns FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view their own patterns"
  ON public.patterns FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.patterns FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own patterns"
  ON public.patterns FOR UPDATE
  USING (auth.uid() = creator_id);

-- Saved content: user can only access their own
CREATE POLICY "Users can manage their saved blocks"
  ON public.saved_blocks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their saved patterns"
  ON public.saved_patterns FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6. Shape Geometry: Rendering Algorithms

### 6.1 Shape to Path Conversion

Each shape type needs to convert to canvas paths for rendering.

```typescript
// Coordinate system: (0,0) is top-left of cell
// Cell size is normalized to 1.0 for calculation, scaled at render time

interface Point {
  x: number;
  y: number;
}

type Path = Point[];

function shapeToPath(shape: Shape, cellSize: number): Path[] {
  const { row, col } = shape.position;
  const offsetX = col * cellSize;
  const offsetY = row * cellSize;

  switch (shape.type) {
    case 'square':
      return [squarePath(offsetX, offsetY, cellSize)];

    case 'hst':
      return hstPaths(offsetX, offsetY, cellSize, shape.variant);

    case 'qst':
      return qstPaths(offsetX, offsetY, cellSize);

    case 'flying_geese':
      return flyingGeesePaths(
        offsetX, offsetY, cellSize,
        shape.span, shape.direction
      );
  }
}

function squarePath(x: number, y: number, size: number): Path {
  return [
    { x, y },
    { x: x + size, y },
    { x: x + size, y: y + size },
    { x, y: y + size },
  ];
}

function hstPaths(
  x: number, y: number, size: number, variant: HstVariant
): Path[] {
  // Returns 2 paths: [filledTriangle, backgroundTriangle]
  const tl = { x, y };
  const tr = { x: x + size, y };
  const br = { x: x + size, y: y + size };
  const bl = { x, y: y + size };

  switch (variant) {
    case 'nw': // ◸ diagonal TL-BR, fill TL
      return [[tl, tr, bl], [tr, br, bl]];
    case 'ne': // ◹ diagonal TR-BL, fill TR
      return [[tl, tr, br], [tl, br, bl]];
    case 'se': // ◿ diagonal TL-BR, fill BR
      return [[tr, br, bl], [tl, tr, bl]];
    case 'sw': // ◺ diagonal TR-BL, fill BL
      return [[tl, br, bl], [tl, tr, br]];
  }
}

// Similar implementations for QST and Flying Geese...
```

### 6.2 Overlap Detection

When placing a shape, check for overlaps:

```typescript
function wouldOverlap(
  existingShapes: Shape[],
  newShape: Shape
): boolean {
  const newCells = getCellsOccupied(newShape);

  for (const existing of existingShapes) {
    const existingCells = getCellsOccupied(existing);

    for (const newCell of newCells) {
      for (const existingCell of existingCells) {
        if (newCell.row === existingCell.row &&
            newCell.col === existingCell.col) {
          return true;
        }
      }
    }
  }

  return false;
}

function getCellsOccupied(shape: Shape): GridPosition[] {
  const cells: GridPosition[] = [];
  const { row, col } = shape.position;

  for (let r = 0; r < shape.span.rows; r++) {
    for (let c = 0; c < shape.span.cols; c++) {
      cells.push({ row: row + r, col: col + c });
    }
  }

  return cells;
}
```

---

## 7. Extensibility Analysis

### 7.1 Adding New Shape Types

**Example: Adding a Curved Shape (Post-MVP)**

```typescript
// 1. Add to ShapeType union
type ShapeType =
  | 'square' | 'hst' | 'qst' | 'flying_geese'
  | 'drunkards_path';  // NEW

// 2. Define the shape interface
interface DrunkrardsPathShape extends BaseShape {
  type: 'drunkards_path';
  span: { rows: 1, cols: 1 };
  curve_position: 'tl' | 'tr' | 'bl' | 'br';  // Which corner has curve
  secondary_fabric_role: FabricRoleId;
}

// 3. Add to Shape union
type Shape = SquareShape | HstShape | QstShape | FlyingGeeseShape
           | DrunkrardsPathShape;

// 4. Add rendering logic (bezier curves)
function drunkrardsPathPaths(...): Path[] {
  // Use quadratic bezier for quarter-circle
}
```

**Database impact:** None. JSONB `shapes` column handles new types.

### 7.2 Adding Colorways

**Feature: Save multiple color schemes per pattern**

```typescript
// Current
interface Pattern {
  palette: Palette;
}

// With colorways
interface Pattern {
  palettes: Palette[];      // Array of palettes
  active_palette_index: number;
}

// Or named colorways
interface Colorway {
  id: UUID;
  name: string;
  palette: Palette;
}

interface Pattern {
  colorways: Colorway[];
  active_colorway_id: UUID;
}
```

**Database impact:** Migration to change `palette` column to `colorways` array.

### 7.3 Adding Sashing & Borders

```typescript
// Sashing: strips between blocks
interface Sashing {
  enabled: boolean;
  width_inches: number;
  fabric_role: FabricRoleId;
}

// Borders: frames around quilt
interface Border {
  width_inches: number;
  fabric_role: FabricRoleId;
}

interface Pattern {
  // ...existing fields
  sashing: Sashing | null;
  borders: Border[];  // Multiple borders (inner, outer)
}
```

**Database impact:** Add `sashing` and `borders` JSONB columns.

### 7.4 Adding Real-time Collaboration (Future)

The shape-centric model enables CRDT-style collaboration:

```typescript
// Each operation references shapes by ID
type Operation =
  | { type: 'add_shape'; shape: Shape }
  | { type: 'remove_shape'; shape_id: UUID }
  | { type: 'update_shape'; shape_id: UUID; changes: Partial<Shape> };

// Operations can be merged from multiple clients
// Shape IDs prevent conflicts
// Last-write-wins for individual shape properties
```

---

## 8. Validation Rules

### 8.1 Block Validation

```typescript
function validateBlock(block: Block): ValidationResult {
  const errors: string[] = [];

  // Grid size must be valid
  if (![2, 3, 4].includes(block.grid_size)) {
    errors.push('Grid size must be 2, 3, or 4');
  }

  // All shapes must be within grid bounds
  for (const shape of block.shapes) {
    if (!isWithinGrid(shape, block.grid_size)) {
      errors.push(`Shape ${shape.id} is outside grid bounds`);
    }
  }

  // No overlapping shapes
  if (hasOverlaps(block.shapes)) {
    errors.push('Shapes cannot overlap');
  }

  // Must have at least one shape to publish
  if (block.status === 'published' && block.shapes.length === 0) {
    errors.push('Published blocks must have at least one shape');
  }

  // All fabric roles must exist in palette
  const roleIds = new Set(block.preview_palette.roles.map(r => r.id));
  for (const shape of block.shapes) {
    if (!roleIds.has(shape.fabric_role)) {
      errors.push(`Unknown fabric role: ${shape.fabric_role}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### 8.2 Pattern Validation

```typescript
function validatePattern(pattern: Pattern): ValidationResult {
  const errors: string[] = [];

  // Grid size bounds
  if (pattern.grid_size.rows < 2 || pattern.grid_size.rows > 25) {
    errors.push('Pattern must have 2-25 rows');
  }
  if (pattern.grid_size.cols < 2 || pattern.grid_size.cols > 25) {
    errors.push('Pattern must have 2-25 columns');
  }

  // All block instances within bounds
  for (const instance of pattern.block_instances) {
    if (instance.position.row >= pattern.grid_size.rows ||
        instance.position.col >= pattern.grid_size.cols) {
      errors.push(`Block instance ${instance.id} is outside grid`);
    }
  }

  // No overlapping block instances
  const positions = new Set<string>();
  for (const instance of pattern.block_instances) {
    const key = `${instance.position.row},${instance.position.col}`;
    if (positions.has(key)) {
      errors.push(`Duplicate block at position ${key}`);
    }
    positions.add(key);
  }

  // Must have at least one block to publish
  if (pattern.status === 'published' && pattern.block_instances.length === 0) {
    errors.push('Published patterns must have at least one block');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 9. Thumbnail Generation Strategy

### 9.1 Requirements

Thumbnails are needed for:
- Block cards in feed/library (multiple sizes)
- Pattern cards in feed (multiple sizes)
- Social sharing (Open Graph images)
- Block library in Pattern Designer (small, rendered with pattern's palette)

| Use Case | Size | Format | Notes |
|----------|------|--------|-------|
| Feed card (1x) | 300×300px | WebP | Masonry grid |
| Feed card (2x) | 600×600px | WebP | Retina displays |
| Library thumbnail | 80×80px | WebP | Block picker in Pattern Designer |
| Social share | 1200×630px | PNG | Open Graph / Twitter Card |

### 9.2 Options Evaluated

#### Option A: Client-Side Generation + Upload

```
User saves block → Client renders to canvas → toBlob() → Upload to Supabase Storage
```

**Pros:**
- No server infrastructure needed
- Immediate feedback (user sees thumbnail instantly)
- Uses existing Konva renderer

**Cons:**
- Dependent on client device/browser
- Inconsistent rendering across devices
- Can't regenerate without user action
- Multiple sizes = multiple renders = slow save

#### Option B: Server-Side Edge Function

```
User saves block → Save to DB → Trigger Edge Function → Generate thumbnails → Store in Supabase Storage
```

**Pros:**
- Consistent rendering
- Can regenerate all thumbnails (e.g., if format changes)
- Generate multiple sizes in one pass
- Deferred processing (save is fast)

**Cons:**
- Requires server-side canvas (node-canvas, Sharp, or Skia)
- Edge Function cold start latency
- More infrastructure complexity

#### Option C: Hybrid (Client Primary + Server Fallback)

```
User saves block → Client generates primary thumbnail → Upload
                → Server queue regenerates all sizes async
```

**Pros:**
- Immediate visual feedback
- Server handles multi-size generation
- Graceful degradation

**Cons:**
- Most complex
- Potential mismatch between client/server renders

### 9.3 Recommendation: Option B (Server-Side Edge Function)

**Why:**
1. **Consistency** — All thumbnails look identical regardless of user's device
2. **Regeneration** — Can bulk-regenerate if we change thumbnail style
3. **Palette rendering** — Block library thumbnails must render with pattern's palette; this is easier server-side where we have both block and pattern data
4. **Multiple sizes** — Generate all sizes in one pass, store in predictable paths

**Implementation:**

```typescript
// Supabase Edge Function: generate-thumbnails

import { createCanvas } from '@napi-rs/canvas'; // or sharp + svg

interface ThumbnailRequest {
  type: 'block' | 'pattern';
  id: string;
  palette?: Palette; // For rendering block with specific palette
}

async function generateThumbnails(req: ThumbnailRequest) {
  // 1. Fetch block/pattern from DB
  const data = await fetchEntity(req.type, req.id);

  // 2. Render to canvas at largest size (600×600)
  const canvas = createCanvas(600, 600);
  const ctx = canvas.getContext('2d');
  renderShapes(ctx, data.shapes, req.palette ?? data.preview_palette);

  // 3. Generate multiple sizes
  const sizes = [
    { name: '1x', width: 300, height: 300 },
    { name: '2x', width: 600, height: 600 },
    { name: 'thumb', width: 80, height: 80 },
  ];

  for (const size of sizes) {
    const resized = resize(canvas, size.width, size.height);
    const webp = await resized.encode('webp', { quality: 85 });

    await supabase.storage
      .from('thumbnails')
      .upload(`${req.type}s/${req.id}/${size.name}.webp`, webp);
  }

  // 4. Update entity with thumbnail URLs
  await supabase
    .from(req.type + 's')
    .update({ thumbnail_url: `${req.id}/2x.webp` })
    .eq('id', req.id);
}
```

**Storage Structure:**
```
thumbnails/
├── blocks/
│   ├── {block_id}/
│   │   ├── 1x.webp    (300×300)
│   │   ├── 2x.webp    (600×600)
│   │   └── thumb.webp (80×80)
├── patterns/
│   ├── {pattern_id}/
│   │   ├── 1x.webp
│   │   ├── 2x.webp
│   │   └── og.png     (1200×630, for social)
```

**Trigger:**
- Database trigger on INSERT/UPDATE to `blocks` or `patterns` table
- Invoke Edge Function via pg_net or Supabase webhook

### 9.4 Block Library Thumbnails (Pattern Designer)

Special case: Block Library in Pattern Designer must show blocks with the **pattern's current palette**, not the block's preview palette.

**Solution:** Client-side rendering for library thumbnails.

```typescript
// In Pattern Designer, when palette changes:
function renderBlockLibraryThumbnails(blocks: Block[], palette: Palette) {
  return blocks.map(block => ({
    ...block,
    // Render to small canvas with pattern's palette
    thumbnailDataUrl: renderBlockToDataUrl(block.shapes, palette, 80, 80)
  }));
}
```

This is fast (80×80 is small) and must be dynamic since palette changes live.

---

## 10. Undo/Redo State Management

### 10.1 Requirements

| Requirement | Notes |
|-------------|-------|
| Linear undo/redo | Stack-based, no branching |
| Granular operations | Each shape add/remove/modify is one undo step |
| Cross-session persistence | Undo history survives page refresh (for drafts) |
| Memory efficient | Don't store entire state for each operation |
| Fast | Undo/redo must feel instant (<16ms) |

### 10.2 Approach: Command Pattern with Inverse Operations

Instead of storing full state snapshots, store **operations** that can be inverted.

```typescript
// Operation types
type Operation =
  | { type: 'add_shape'; shape: Shape }
  | { type: 'remove_shape'; shape: Shape }  // Store full shape for redo
  | { type: 'update_shape'; shapeId: string; prev: Partial<Shape>; next: Partial<Shape> }
  | { type: 'batch'; operations: Operation[] };  // Group related changes

// Inversion
function invertOperation(op: Operation): Operation {
  switch (op.type) {
    case 'add_shape':
      return { type: 'remove_shape', shape: op.shape };
    case 'remove_shape':
      return { type: 'add_shape', shape: op.shape };
    case 'update_shape':
      return { type: 'update_shape', shapeId: op.shapeId, prev: op.next, next: op.prev };
    case 'batch':
      return { type: 'batch', operations: op.operations.map(invertOperation).reverse() };
  }
}
```

### 10.3 State Machine

```
                    ┌─────────────────────────────────────────────────┐
                    │              UNDO/REDO STATE                     │
                    └─────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   shapes    │  ← Current state (source of truth)
                              │   (Block)   │
                              └─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      │                      ▼
     ┌─────────────────┐             │             ┌─────────────────┐
     │   Undo Stack    │             │             │   Redo Stack    │
     │                 │             │             │                 │
     │  [op3] ← top    │◄── UNDO ────┤──── REDO ──►│  [inv(op3)]     │
     │  [op2]          │             │             │                 │
     │  [op1]          │             │             │                 │
     └─────────────────┘             │             └─────────────────┘
                                     │
                              New operation
                              clears redo stack


UNDO FLOW:
1. Pop operation from undo stack
2. Apply inverse to shapes
3. Push inverse to redo stack

REDO FLOW:
1. Pop operation from redo stack
2. Apply inverse (which is original op) to shapes
3. Push to undo stack
```

### 10.4 Implementation

```typescript
interface UndoManager<T> {
  undoStack: Operation[];
  redoStack: Operation[];
  maxHistorySize: number;
}

function createUndoManager(maxSize = 100): UndoManager {
  return {
    undoStack: [],
    redoStack: [],
    maxHistorySize: maxSize,
  };
}

function applyOperation(shapes: Shape[], op: Operation): Shape[] {
  switch (op.type) {
    case 'add_shape':
      return [...shapes, op.shape];

    case 'remove_shape':
      return shapes.filter(s => s.id !== op.shape.id);

    case 'update_shape':
      return shapes.map(s =>
        s.id === op.shapeId ? { ...s, ...op.next } : s
      );

    case 'batch':
      return op.operations.reduce(applyOperation, shapes);
  }
}

function execute(
  manager: UndoManager,
  shapes: Shape[],
  op: Operation
): { manager: UndoManager; shapes: Shape[] } {
  const newShapes = applyOperation(shapes, op);

  return {
    shapes: newShapes,
    manager: {
      ...manager,
      undoStack: [...manager.undoStack.slice(-manager.maxHistorySize + 1), op],
      redoStack: [], // Clear redo on new operation
    },
  };
}

function undo(
  manager: UndoManager,
  shapes: Shape[]
): { manager: UndoManager; shapes: Shape[] } | null {
  if (manager.undoStack.length === 0) return null;

  const op = manager.undoStack[manager.undoStack.length - 1];
  const inverse = invertOperation(op);
  const newShapes = applyOperation(shapes, inverse);

  return {
    shapes: newShapes,
    manager: {
      ...manager,
      undoStack: manager.undoStack.slice(0, -1),
      redoStack: [...manager.redoStack, inverse],
    },
  };
}

function redo(
  manager: UndoManager,
  shapes: Shape[]
): { manager: UndoManager; shapes: Shape[] } | null {
  if (manager.redoStack.length === 0) return null;

  const op = manager.redoStack[manager.redoStack.length - 1];
  const inverse = invertOperation(op);
  const newShapes = applyOperation(shapes, inverse);

  return {
    shapes: newShapes,
    manager: {
      ...manager,
      redoStack: manager.redoStack.slice(0, -1),
      undoStack: [...manager.undoStack, inverse],
    },
  };
}
```

### 10.5 Batching Related Operations

Some user actions should be a single undo step:

| User Action | Operations | Batch? |
|-------------|------------|--------|
| Add shape | 1 add_shape | No |
| Delete shape | 1 remove_shape | No |
| Rotate shape | 1 update_shape | No |
| Change palette color | N update_shape (all affected) | **Yes** |
| Fill Empty (place many blocks) | N add_shape | **Yes** |
| Resize grid (remove row with blocks) | N remove_shape | **Yes** |

```typescript
// Example: Fill Empty as batched operation
function fillEmpty(
  shapes: Shape[],
  manager: UndoManager,
  emptyPositions: GridPosition[],
  block: Block
): { shapes: Shape[]; manager: UndoManager } {
  const newShapes = emptyPositions.map(pos => ({
    ...createBlockInstance(block),
    position: pos,
  }));

  const batchOp: Operation = {
    type: 'batch',
    operations: newShapes.map(shape => ({ type: 'add_shape', shape })),
  };

  return execute(manager, shapes, batchOp);
}
```

### 10.6 Persistence (Draft Auto-Save)

For drafts, persist undo history to enable cross-session undo:

```typescript
interface DraftState {
  block: Block;
  undoStack: Operation[];
  redoStack: Operation[];
  lastSaved: Timestamp;
}

// Auto-save every 30 seconds (debounced)
async function autoSaveDraft(state: DraftState) {
  await supabase
    .from('block_drafts')
    .upsert({
      id: state.block.id,
      user_id: currentUserId,
      data: {
        block: state.block,
        undoStack: state.undoStack,
        redoStack: state.redoStack,
      },
      updated_at: new Date().toISOString(),
    });
}

// On page load, restore draft
async function loadDraft(blockId: string): Promise<DraftState | null> {
  const { data } = await supabase
    .from('block_drafts')
    .select('data')
    .eq('id', blockId)
    .single();

  return data?.data ?? null;
}
```

### 10.7 Memory Considerations

| Scenario | Shapes | Ops (100 max) | Estimated Memory |
|----------|--------|---------------|------------------|
| Simple 3×3 block | 9 | 100 | ~50 KB |
| Complex 4×4 block | 16 | 100 | ~80 KB |
| 10×10 pattern (100 blocks) | 100 instances | 100 | ~200 KB |
| 25×25 pattern (625 blocks) | 625 instances | 100 | ~500 KB |

All well within browser memory limits. The `maxHistorySize: 100` cap prevents unbounded growth.

---

## 11. Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| Search indexing | Pending | Full-text on title/description? Hashtag indexes? |

### Resolved

| Item | Decision | Section |
|------|----------|---------|
| Thumbnail generation | Server-side Edge Function (Supabase) | §9 |
| Undo/redo architecture | Command pattern with inverse operations | §10 |

### Deferred to Post-MVP

| Item | Notes |
|------|-------|
| Fabric requirements calculation | Complex algorithm involving seam allowances, fabric width, cutting efficiency. Design after core features stable. |

---

## 12. Summary

### Key Architectural Choices

1. **Shape-centric model** — Shapes are first-class entities with IDs, positions, and spans. Enables extensibility, undo/redo, and future collaboration.

2. **Immutable published blocks** — No versioning needed. Updates require new block ("save as"). Simplifies everything.

3. **Fork relationship** — Track `derived_from_block_id` for lineage. Parent never changes.

4. **Pattern owns palette** — Blocks are structure + role references. Pattern defines actual colors. Enables WYSIWYG preview in library.

5. **JSONB for flexibility** — Shapes, palettes, and block_instances stored as JSONB. Add new shape types without migrations.

6. **Snapshot on save** — When user saves community content, we store a copy. Survives original deletion.

---

_Next: Implementation of core TypeScript types in `packages/core`._
