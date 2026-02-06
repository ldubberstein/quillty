# Per-Block Coloring Implementation Plan

## Overview

Add the ability to color individual block instances differently within a pattern. Users can override specific fabric role colors per block while maintaining connection to the pattern's palette for non-overridden roles.

**Example use case:** Idaho Star blocks with alternating color schemes across the quilt.

---

## Design Decisions

### Override Model (Not New Blocks)
Color overrides maintain block structure—only color resolution changes. This matches Figma's component/instance model where instances can override properties without detaching from the main component.

**When to use overrides:** Same block structure, just different colors (most common case)
**When to create new block:** Different shapes or structure (rare, user-initiated)

### Sparse Storage
Only store overridden roles in `paletteOverrides`. Missing roles fall back to pattern palette. This keeps data minimal and allows pattern-level palette changes to propagate to non-overridden blocks.

```typescript
interface BlockInstance {
  // ...existing fields
  paletteOverrides?: Record<FabricRoleId, HexColor>;
}
```

### Visual Indicators
- **Block with overrides:** Small purple dot in top-right corner
- **Overridden role in panel:** Purple background tint + "Custom" label
- **Reset button:** Only visible for overridden roles

### Automatic Block Variants in Sidebar
When a block instance has color overrides, a "variant" automatically appears in the sidebar's block library. Users can drag variants to place more blocks with the same overrides.

**Key behaviors:**
- **Pattern-scoped:** Variants only exist in the current pattern (not saved to global library)
- **Automatic creation:** Variants appear when any block instance has overrides
- **Debounced (100ms):** Variant appears 100ms after last color change to reduce flicker
- **Unique combinations:** Each unique set of overrides becomes one variant
- **No extra storage:** Variants are derived from existing `blockInstances` at render time

```
Block Library Sidebar:
├── Idaho Star [uses pattern palette]
│   ├── ● Variant [red/gold]    ← derived from instances with these overrides
│   └── ● Variant [blue/silver] ← derived from instances with these overrides
├── Log Cabin [uses pattern palette]
│   └── (no variants - no instances have overrides)
```

---

## Implementation Summary

### Data Model Changes

**[packages/core/src/pattern-designer/types.ts](packages/core/src/pattern-designer/types.ts)**
```typescript
// New type
export type PaletteOverrides = Record<FabricRoleId, HexColor>;

// Updated interface
export interface BlockInstance {
  id: UUID;
  blockId: UUID;
  position: GridPosition;
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  paletteOverrides?: PaletteOverrides;  // NEW
}
```

**[packages/core/src/pattern-designer/schemas.ts](packages/core/src/pattern-designer/schemas.ts)**
```typescript
export const PaletteOverridesSchema = z.record(FabricRoleIdSchema, HexColorSchema);

export const BlockInstanceSchema = z.object({
  // ...existing fields
  paletteOverrides: PaletteOverridesSchema.optional(),
});
```

---

## Files to Modify

### 1. Core Types & Schemas
| File | Changes |
|------|---------|
| `packages/core/src/pattern-designer/types.ts` | Add `PaletteOverrides` type, update `BlockInstance` |
| `packages/core/src/pattern-designer/schemas.ts` | Add `PaletteOverridesSchema`, update `BlockInstanceSchema` |

### 2. History Operations
| File | Changes |
|------|---------|
| `packages/core/src/pattern-designer/history/operations.ts` | Add `UpdateInstancePaletteOperation`, `ResetInstancePaletteOperation`, update invert/apply functions |

**New Operation Types:**
```typescript
interface UpdateInstancePaletteOperation {
  type: 'update_instance_palette';
  instanceId: UUID;
  roleId: FabricRoleId;
  prevColor: string | null;  // null = was using pattern palette
  nextColor: string | null;  // null = reset to pattern palette
}

interface ResetInstancePaletteOperation {
  type: 'reset_instance_palette';
  instanceId: UUID;
  prevOverrides: PaletteOverrides;  // For undo
}
```

### 3. Store Actions
| File | Changes |
|------|---------|
| `packages/core/src/pattern-designer/store.ts` | Add actions and selectors |

**New Actions:**
```typescript
setInstanceRoleColor: (instanceId: UUID, roleId: FabricRoleId, color: string) => void;
resetInstanceRoleColor: (instanceId: UUID, roleId: FabricRoleId) => void;
resetInstancePalette: (instanceId: UUID) => void;
placeBlockWithOverrides: (blockId: UUID, position: GridPosition, overrides: PaletteOverrides) => void;
```

**New Selectors:**
```typescript
useInstanceRoleColor(instanceId, roleId)  // Returns { color, isOverride }
useSelectedInstanceHasOverrides()          // Returns boolean
useBlockVariants(blockId)                  // Returns unique PaletteOverrides[] for variants
```

**Block Variants Selector (derived, not stored):**
```typescript
export const useBlockVariants = (blockId: UUID) => {
  return usePatternDesignerStore((state) => {
    const instances = state.pattern.blockInstances.filter(
      (i) => i.blockId === blockId && i.paletteOverrides
    );

    // Deduplicate by unique override combinations
    const uniqueOverrides = new Map<string, PaletteOverrides>();
    for (const instance of instances) {
      if (instance.paletteOverrides && Object.keys(instance.paletteOverrides).length > 0) {
        const key = JSON.stringify(instance.paletteOverrides);
        uniqueOverrides.set(key, instance.paletteOverrides);
      }
    }

    return Array.from(uniqueOverrides.values());
  });
};

// Debounced hook for UI (100ms delay reduces flicker during color changes)
export const useDebouncedBlockVariants = (blockId: UUID) => {
  const variants = useBlockVariants(blockId);
  const [debouncedVariants, setDebouncedVariants] = useState(variants);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedVariants(variants), 100);
    return () => clearTimeout(timer);
  }, [variants]);

  return debouncedVariants;
};
```

### 4. Renderer
| File | Changes |
|------|---------|
| `apps/web/src/components/pattern-designer/BlockInstanceRenderer.tsx` | Update color resolution, add visual indicator |

**Updated `getColor` helper:**
```typescript
function getColor(
  palette: Palette,
  roleId: string,
  instanceOverrides?: PaletteOverrides
): string {
  // Check override first
  if (instanceOverrides?.[roleId]) {
    return instanceOverrides[roleId];
  }
  // Fall back to pattern palette
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}
```

**Visual indicator for overridden blocks:**
```tsx
{instance.paletteOverrides && Object.keys(instance.paletteOverrides).length > 0 && (
  <Group x={cellSize - 10} y={4}>
    <Rect width={8} height={8} fill="#8B5CF6" cornerRadius={4} />
  </Group>
)}
```

### 5. New UI Component
| File | Description |
|------|-------------|
| `apps/web/src/components/pattern-designer/InstanceColorPanel.tsx` | New component for per-block color editing |

**Component Features:**
- Shows when a block instance is selected (`mode === 'editing_block'`)
- Displays only fabric roles used by the selected block's shapes
- Each role shows: color swatch, name, override indicator
- Color picker to set override (reuses `ColorSwatch` component)
- Reset button per role
- "Reset all" button in header
- Shows pattern palette reference when overrides exist

### 6. Sidebar Integration
| File | Changes |
|------|---------|
| `apps/web/src/components/pattern-designer/SidebarContext.tsx` | Add `'instance-colors'` panel type |
| `apps/web/src/app/design/pattern/page.tsx` | Conditionally render `InstanceColorPanel` |

### 7. Block Library Variants
| File | Changes |
|------|---------|
| `apps/web/src/components/pattern-designer/BlockLibraryItem.tsx` | Show variants below each block |

**Block Library Item with Variants:**
```tsx
function BlockLibraryItem({ block }: { block: Block }) {
  const variants = useBlockVariants(block.id);

  return (
    <div>
      {/* Original block (uses pattern palette) */}
      <DraggableBlock block={block} />

      {/* Variants - only shown if any instances have overrides */}
      {variants.length > 0 && (
        <div className="ml-4 mt-1 space-y-1">
          {variants.map((overrides, i) => (
            <DraggableBlockVariant
              key={i}
              block={block}
              overrides={overrides}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableBlockVariant({ block, overrides }) {
  // When dropped, calls placeBlockWithOverrides(block.id, position, overrides)
  // Mini preview shows block rendered with the override colors
}
```

---

## User Flows

### Flow 1: Customize a Block's Colors

```
1. Click block instance on canvas
   ↓
2. Enters 'editing_block' mode
   ↓
3. InstanceColorPanel appears in sidebar
   (shows only roles used by this block)
   ↓
4. Click color swatch → color picker
   ↓
5. Select new color
   ↓
6. Override saved, canvas updates immediately
   ↓
7. Purple dot appears on block (visual indicator)
   ↓
8. Variant automatically appears in block library
   ↓
9. Optional: Reset to pattern colors
```

### Flow 2: Reuse Customized Colors (Place Variant)

```
1. Customize a block's colors (Flow 1)
   ↓
2. Variant appears under block in library sidebar
   (shows mini preview with override colors)
   ↓
3. Drag variant to canvas
   ↓
4. New block placed with same overrides pre-applied
   ↓
5. Both blocks now share the same override colors
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Pattern palette color changes | Blocks with overrides for that role keep custom color; others update |
| Pattern palette role deleted | Override persists in data; shape falls back to gray (#CCCCCC) |
| Undo past block placement | Override data preserved in removed instance, restored on redo |
| Block rotation/flip | Overrides preserved (independent of transforms) |

---

## Reusable Utilities

These existing components/utilities should be reused:

| Utility | Location | Use |
|---------|----------|-----|
| `ColorSwatch` | `apps/web/src/components/shared/ColorSwatch.tsx` | Color picker UI |
| `CollapsiblePanel` | `apps/web/src/components/shared/` | Panel wrapper |
| `useSidebarPanel` | `apps/web/src/components/pattern-designer/SidebarContext.tsx` | Accordion behavior |
| `recordOperation` | `packages/core/src/pattern-designer/history/` | Undo/redo |

---

## Verification

### Automated Tests
```bash
# Run pattern designer tests
npm test -- --filter=pattern-designer

# Specific test files to update
packages/core/src/pattern-designer/history/operations.test.ts
apps/web/src/components/pattern-designer/BlockInstanceRenderer.test.tsx
```

### Manual Testing Checklist

**Per-Block Color Overrides:**
- [ ] Place multiple identical blocks on canvas
- [ ] Select one block, change a color in InstanceColorPanel
- [ ] Verify only that block changes color (others unchanged)
- [ ] Verify purple indicator appears on customized block
- [ ] Change pattern palette color → verify non-overridden blocks update
- [ ] Undo color change (Ctrl+Z)
- [ ] Redo color change (Ctrl+Shift+Z)
- [ ] Reset single role → verify reverts to pattern color
- [ ] Reset all → verify all overrides cleared
- [ ] Save pattern, reload → verify overrides persist
- [ ] Delete block with overrides, undo → verify overrides restored

**Block Variants in Sidebar:**
- [ ] Customize a block's colors → verify variant appears in sidebar
- [ ] Create second unique color combo → verify second variant appears
- [ ] Drag variant to canvas → verify new block has same override colors
- [ ] Delete all blocks with specific overrides → verify that variant disappears
- [ ] Create same override on two blocks → verify only ONE variant shown (deduped)
- [ ] Variants should show mini preview with override colors applied

---

## Implementation Phases

### Phase 1: Core Data Model
- Add types and schemas
- Update BlockInstance interface

### Phase 2: History System
- Add new operation types
- Implement invert/apply functions
- Add tests

### Phase 3: Store Actions
- Add override actions
- Add selector hooks
- Add tests

### Phase 4: Renderer Updates
- Update getColor helper
- Add visual indicator
- Update render function calls

### Phase 5: UI Component
- Create InstanceColorPanel
- Integrate into sidebar
- Add conditional rendering

### Phase 6: Integration Testing
- End-to-end flow testing
- Edge case testing
- Persistence testing

---

## Related Documentation

- [Fabric Block Coloring Research](../research/FABRIC_BLOCK_COLORING_RESEARCH.md) - Industry patterns, user pain points, data model research
