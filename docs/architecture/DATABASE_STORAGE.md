# Database Storage Architecture

How units, blocks, and patterns are stored in the Quillty database.

## Overview

Quillty uses PostgreSQL (via Supabase) with JSONB columns to store flexible design data. This allows the schema to remain stable while supporting new unit types and design features.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐  │
│  │   blocks    │     │  pattern_blocks  │     │   quilt_    │  │
│  │             │◄────│   (junction)     │────►│   patterns  │  │
│  │ design_data │     │                  │     │ design_data │  │
│  │   (JSONB)   │     │                  │     │   (JSONB)   │  │
│  └─────────────┘     └──────────────────┘     └─────────────┘  │
│        │                                              │         │
│        ▼                                              ▼         │
│   Contains:                                    Contains:        │
│   • units[]                                    • gridSize       │
│   • previewPalette                             • blockInstances │
│                                                • palette        │
└─────────────────────────────────────────────────────────────────┘
```

## Table Schemas

### `blocks` Table

Stores quilt block designs (the reusable building blocks).

```sql
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  grid_size INTEGER DEFAULT 4,        -- 2, 3, or 4
  design_data JSONB NOT NULL,         -- Contains units + palette
  difficulty TEXT DEFAULT 'beginner',
  piece_count INTEGER DEFAULT 0,      -- Derived from units.length
  status TEXT DEFAULT 'draft',        -- 'draft' | 'published'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
```

### `quilt_patterns` Table

Stores complete quilt patterns (arrangements of blocks).

```sql
CREATE TABLE public.quilt_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  design_data JSONB NOT NULL,         -- Contains grid + blocks + palette
  status TEXT DEFAULT 'draft',
  price_cents INTEGER,                -- NULL = free
  difficulty TEXT DEFAULT 'beginner',
  category TEXT,
  size TEXT,                          -- e.g., "60x80 inches"
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
```

### `pattern_blocks` Junction Table

Links patterns to their constituent blocks (for querying/analytics).

```sql
CREATE TABLE public.pattern_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID NOT NULL REFERENCES public.quilt_patterns(id),
  block_id UUID NOT NULL REFERENCES public.blocks(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Block `design_data` Structure

The `design_data` JSONB column in `blocks` stores the complete block design:

```typescript
interface BlockDesignData {
  version: 1;                    // Schema version for migrations
  units: Unit[];                 // Array of all units in the block
  previewPalette: Palette;       // Default colors for preview
}
```

> **Legacy note:** Older database records may use `shapes` instead of `units`. The persistence layer reads both keys for backwards compatibility: `designData.units ?? designData.shapes ?? []`.

### Example: Simple 3×3 Block

A "Bear's Paw" style block with squares and HSTs:

```json
{
  "version": 1,
  "units": [
    {
      "id": "unit-001",
      "type": "square",
      "position": { "row": 0, "col": 0 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "background"
    },
    {
      "id": "unit-002",
      "type": "hst",
      "position": { "row": 0, "col": 1 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "nw",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-003",
      "type": "hst",
      "position": { "row": 0, "col": 2 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "ne",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-004",
      "type": "hst",
      "position": { "row": 1, "col": 0 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "sw",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-005",
      "type": "square",
      "position": { "row": 1, "col": 1 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature"
    },
    {
      "id": "unit-006",
      "type": "hst",
      "position": { "row": 1, "col": 2 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "se",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-007",
      "type": "hst",
      "position": { "row": 2, "col": 0 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "nw",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-008",
      "type": "hst",
      "position": { "row": 2, "col": 1 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "feature",
      "variant": "ne",
      "secondaryFabricRole": "background"
    },
    {
      "id": "unit-009",
      "type": "square",
      "position": { "row": 2, "col": 2 },
      "span": { "rows": 1, "cols": 1 },
      "fabricRole": "background"
    }
  ],
  "previewPalette": {
    "roles": [
      { "id": "background", "name": "Background", "color": "#F5F5DC" },
      { "id": "feature", "name": "Feature", "color": "#2C3E50" },
      { "id": "accent1", "name": "Accent 1", "color": "#8B4513" },
      { "id": "accent2", "name": "Accent 2", "color": "#DAA520" }
    ]
  }
}
```

### Visual Representation

```
Grid (3×3):               Colors:
┌───┬───┬───┐            ░ = background (#F5F5DC)
│ ░ │◸▓ │▓◹ │            ▓ = feature (#2C3E50)
├───┼───┼───┤
│▓◺ │ ▓ │◿▓ │            HST variants:
├───┼───┼───┤            ◸ = nw (diagonal from top-left)
│◸▓ │▓◹ │ ░ │            ◹ = ne (diagonal from top-right)
└───┴───┴───┘            ◺ = sw (diagonal from bottom-left)
                         ◿ = se (diagonal from bottom-right)
```

---

## Unit Types

### 1. Square Unit

The simplest unit - fills one cell with a single color.

```json
{
  "id": "sq-001",
  "type": "square",
  "position": { "row": 0, "col": 0 },
  "span": { "rows": 1, "cols": 1 },
  "fabricRole": "feature"
}
```

### 2. Half-Square Triangle (HST) Unit

Two triangles in one cell, each with its own color.

```json
{
  "id": "hst-001",
  "type": "hst",
  "position": { "row": 0, "col": 0 },
  "span": { "rows": 1, "cols": 1 },
  "fabricRole": "feature",
  "variant": "nw",
  "secondaryFabricRole": "background"
}
```

**Variants:**
| Variant | Description | Visual |
|---------|-------------|--------|
| `nw` | Primary triangle in top-left | `◸` |
| `ne` | Primary triangle in top-right | `◹` |
| `sw` | Primary triangle in bottom-left | `◺` |
| `se` | Primary triangle in bottom-right | `◿` |

### 3. Flying Geese Unit

A 2:1 ratio unit with a center triangle (goose) and two corner triangles (sky).

**Horizontal (points left or right):**
```json
{
  "id": "fg-001",
  "type": "flying_geese",
  "position": { "row": 0, "col": 0 },
  "span": { "rows": 1, "cols": 2 },
  "direction": "right",
  "patchFabricRoles": {
    "goose": "feature",
    "sky1": "background",
    "sky2": "background"
  }
}
```

**Vertical (points up or down):**
```json
{
  "id": "fg-002",
  "type": "flying_geese",
  "position": { "row": 0, "col": 0 },
  "span": { "rows": 2, "cols": 1 },
  "direction": "up",
  "patchFabricRoles": {
    "goose": "accent1",
    "sky1": "background",
    "sky2": "background"
  }
}
```

**Directions:**
| Direction | Span | Visual |
|-----------|------|--------|
| `up` | 2 rows × 1 col | `△` pointing up |
| `down` | 2 rows × 1 col | `▽` pointing down |
| `left` | 1 row × 2 cols | `◁` pointing left |
| `right` | 1 row × 2 cols | `▷` pointing right |

---

## Pattern `design_data` Structure

The `design_data` JSONB column in `quilt_patterns` stores:

```typescript
interface PatternDesignData {
  version: 1;
  gridSize: { rows: number; cols: number };  // Quilt dimensions in blocks
  blockInstances: BlockInstance[];            // Placed blocks with transforms
  palette: Palette;                           // Colors for the entire pattern
}
```

### Example: 4×4 Quilt Pattern

A simple quilt using two different blocks:

```json
{
  "version": 1,
  "gridSize": { "rows": 4, "cols": 4 },
  "blockInstances": [
    {
      "id": "inst-001",
      "blockId": "550e8400-e29b-41d4-a716-446655440001",
      "position": { "row": 0, "col": 0 },
      "rotation": 0,
      "flipHorizontal": false,
      "flipVertical": false
    },
    {
      "id": "inst-002",
      "blockId": "550e8400-e29b-41d4-a716-446655440002",
      "position": { "row": 0, "col": 1 },
      "rotation": 90,
      "flipHorizontal": false,
      "flipVertical": false
    },
    {
      "id": "inst-003",
      "blockId": "550e8400-e29b-41d4-a716-446655440001",
      "position": { "row": 0, "col": 2 },
      "rotation": 180,
      "flipHorizontal": false,
      "flipVertical": false
    },
    {
      "id": "inst-004",
      "blockId": "550e8400-e29b-41d4-a716-446655440002",
      "position": { "row": 0, "col": 3 },
      "rotation": 270,
      "flipHorizontal": false,
      "flipVertical": false
    }
  ],
  "palette": {
    "roles": [
      { "id": "background", "name": "Background", "color": "#FFFFFF" },
      { "id": "feature", "name": "Feature", "color": "#1E3A5F" },
      { "id": "accent1", "name": "Accent 1", "color": "#E85D04" },
      { "id": "accent2", "name": "Accent 2", "color": "#FAA307" }
    ]
  }
}
```

### Visual Representation

```
4×4 Pattern Grid:

┌─────────┬─────────┬─────────┬─────────┐
│ Block A │ Block B │ Block A │ Block B │
│   0°    │   90°   │  180°   │  270°   │
├─────────┼─────────┼─────────┼─────────┤
│         │         │         │         │
│  empty  │  empty  │  empty  │  empty  │
├─────────┼─────────┼─────────┼─────────┤
│         │         │         │         │
│  empty  │  empty  │  empty  │  empty  │
├─────────┼─────────┼─────────┼─────────┤
│         │         │         │         │
│  empty  │  empty  │  empty  │  empty  │
└─────────┴─────────┴─────────┴─────────┘

Block A = 550e8400-e29b-41d4-a716-446655440001
Block B = 550e8400-e29b-41d4-a716-446655440002
```

---

## Block Instance Transforms

When a block is placed in a pattern, it can be transformed:

| Property | Values | Description |
|----------|--------|-------------|
| `rotation` | 0, 90, 180, 270 | Clockwise rotation in degrees |
| `flipHorizontal` | true/false | Mirror along vertical axis |
| `flipVertical` | true/false | Mirror along horizontal axis |

### Rotation Example

Original block and rotations:

```
Original (0°):    90° CW:         180°:           270° CW:
┌───┬───┐        ┌───┬───┐       ┌───┬───┐       ┌───┬───┐
│ A │ B │        │ C │ A │       │ D │ C │       │ B │ D │
├───┼───┤        ├───┼───┤       ├───┼───┤       ├───┼───┤
│ C │ D │        │ D │ B │       │ B │ A │       │ A │ C │
└───┴───┘        └───┴───┘       └───┴───┘       └───┴───┘
```

---

## Palette & Fabric Roles

Blocks store units with **fabric role references**, not colors. The pattern's palette maps roles to actual colors.

### Why This Design?

1. **Reusability**: Same block can look different in different patterns
2. **Easy Colorway Changes**: Change one palette color, affects all blocks
3. **Library Preview**: Blocks show preview palette in library, pattern palette when placed

### Default Fabric Roles

```json
{
  "roles": [
    { "id": "background", "name": "Background", "color": "#F5F5DC" },
    { "id": "feature", "name": "Feature", "color": "#2C3E50" },
    { "id": "accent1", "name": "Accent 1", "color": "#8B4513" },
    { "id": "accent2", "name": "Accent 2", "color": "#DAA520" }
  ]
}
```

---

## Complete Database Record Examples

### Block Record

```sql
SELECT * FROM blocks WHERE id = '550e8400-e29b-41d4-a716-446655440001';
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "creator_id": "user-123",
  "name": "Ohio Star",
  "description": "Traditional Ohio Star block with HSTs",
  "thumbnail_url": "https://storage.example.com/blocks/ohio-star.png",
  "grid_size": 3,
  "design_data": {
    "version": 1,
    "units": [
      { "id": "s1", "type": "square", "position": { "row": 0, "col": 0 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "background" },
      { "id": "s2", "type": "hst", "position": { "row": 0, "col": 1 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "feature", "variant": "sw", "secondaryFabricRole": "background" },
      { "id": "s3", "type": "square", "position": { "row": 0, "col": 2 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "background" },
      { "id": "s4", "type": "hst", "position": { "row": 1, "col": 0 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "feature", "variant": "ne", "secondaryFabricRole": "background" },
      { "id": "s5", "type": "square", "position": { "row": 1, "col": 1 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "accent1" },
      { "id": "s6", "type": "hst", "position": { "row": 1, "col": 2 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "feature", "variant": "nw", "secondaryFabricRole": "background" },
      { "id": "s7", "type": "square", "position": { "row": 2, "col": 0 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "background" },
      { "id": "s8", "type": "hst", "position": { "row": 2, "col": 1 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "feature", "variant": "ne", "secondaryFabricRole": "background" },
      { "id": "s9", "type": "square", "position": { "row": 2, "col": 2 }, "span": { "rows": 1, "cols": 1 }, "fabricRole": "background" }
    ],
    "previewPalette": {
      "roles": [
        { "id": "background", "name": "Background", "color": "#F5F5DC" },
        { "id": "feature", "name": "Feature", "color": "#2C3E50" },
        { "id": "accent1", "name": "Accent 1", "color": "#8B4513" },
        { "id": "accent2", "name": "Accent 2", "color": "#DAA520" }
      ]
    }
  },
  "difficulty": "beginner",
  "piece_count": 9,
  "status": "published",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "published_at": "2024-01-15T11:00:00Z"
}
```

### Pattern Record

```sql
SELECT * FROM quilt_patterns WHERE id = 'pattern-456';
```

```json
{
  "id": "pattern-456",
  "creator_id": "user-123",
  "title": "Starry Night Quilt",
  "description": "A stunning queen-size quilt featuring Ohio Star blocks",
  "thumbnail_url": "https://storage.example.com/patterns/starry-night.png",
  "design_data": {
    "version": 1,
    "gridSize": { "rows": 6, "cols": 6 },
    "blockInstances": [
      { "id": "i1", "blockId": "550e8400-e29b-41d4-a716-446655440001", "position": { "row": 0, "col": 0 }, "rotation": 0, "flipHorizontal": false, "flipVertical": false },
      { "id": "i2", "blockId": "550e8400-e29b-41d4-a716-446655440001", "position": { "row": 0, "col": 1 }, "rotation": 90, "flipHorizontal": false, "flipVertical": false },
      { "id": "i3", "blockId": "550e8400-e29b-41d4-a716-446655440001", "position": { "row": 0, "col": 2 }, "rotation": 0, "flipHorizontal": true, "flipVertical": false }
    ],
    "palette": {
      "roles": [
        { "id": "background", "name": "Cream", "color": "#FFF8DC" },
        { "id": "feature", "name": "Navy", "color": "#000080" },
        { "id": "accent1", "name": "Gold", "color": "#FFD700" },
        { "id": "accent2", "name": "Burgundy", "color": "#800020" }
      ]
    }
  },
  "status": "published_free",
  "price_cents": null,
  "difficulty": "intermediate",
  "category": "traditional",
  "size": "90x90 inches",
  "like_count": 42,
  "save_count": 15,
  "comment_count": 3,
  "view_count": 234,
  "created_at": "2024-01-20T14:00:00Z",
  "updated_at": "2024-01-21T09:30:00Z",
  "published_at": "2024-01-21T09:30:00Z"
}
```

---

## Rendering Flow

When displaying a pattern:

1. **Fetch pattern** with `design_data`
2. **Fetch blocks** for each unique `blockId` in `blockInstances`
3. **For each block instance**:
   - Get the block's units from `block.design_data.units`
   - Apply `rotation` transform to unit positions
   - Apply `flipHorizontal`/`flipVertical` transforms
   - Map `fabricRole` IDs to colors from pattern's `palette`
4. **Render units** using geometry algorithms in `packages/core`

```typescript
// Simplified rendering pseudocode
for (const instance of pattern.blockInstances) {
  const block = blocks[instance.blockId];

  for (const unit of block.units) {
    // Transform position based on rotation/flip
    const transformedPos = applyTransform(unit.position, instance);

    // Get color from pattern palette
    const color = pattern.palette.roles.find(r => r.id === unit.fabricRole)?.color;

    // Render unit at grid position
    renderUnit(unit.type, transformedPos, color);
  }
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| [supabase/migrations/20240201000000_initial_schema.sql](../supabase/migrations/20240201000000_initial_schema.sql) | Database schema |
| [packages/core/src/block-designer/types.ts](../packages/core/src/block-designer/types.ts) | Unit & Block types |
| [packages/core/src/block-designer/persistence.ts](../packages/core/src/block-designer/persistence.ts) | Serialization |
| [packages/core/src/pattern-designer/types.ts](../packages/core/src/pattern-designer/types.ts) | Pattern types |
| [apps/web/src/app/api/v1/blocks/schemas.ts](../apps/web/src/app/api/v1/blocks/schemas.ts) | API validation |
| [docs/DATA_MODEL.md](./DATA_MODEL.md) | Conceptual data model |
