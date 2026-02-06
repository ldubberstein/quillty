/**
 * Unit Bridge
 *
 * Bridges the gap between the store's type-specific Unit interfaces and
 * the registry's generic UnitConfig/UnitDefinition interface.
 *
 * This is the SINGLE place that maps between:
 * - Store types: fabricRole, secondaryFabricRole, variant, direction, patchFabricRoles
 * - Registry types: UnitConfig { variant?, patchRoles: Record<string, FabricRoleId> }
 *
 * All other code (store, renderers, operations) should use these bridge functions
 * instead of hardcoding per-type switch statements.
 */

import { unitRegistry } from './shape-registry/registry';
import type { UnitConfig, TriangleGroup } from './shape-registry/types';
import { triangleToFlatPoints } from './shape-registry/types';

// Ensure shape definitions are registered (side-effect import)
import './shapes';

import type {
  Unit,
  SquareUnit,
  HstUnit,
  HstVariant,
  FlyingGeeseUnit,
  FlyingGeeseDirection,
  QstUnit,
  FabricRoleId,
  Palette,
  Span,
} from './types';

// =============================================================================
// Unit → UnitConfig Conversion
// =============================================================================

/**
 * Convert a store Unit to the registry's generic UnitConfig.
 * This maps type-specific fields to the generic patchRoles/variant structure.
 */
export function toUnitConfig(unit: Unit): UnitConfig {
  switch (unit.type) {
    case 'square':
      return { patchRoles: { fill: unit.fabricRole } };
    case 'hst':
      return {
        variant: unit.variant,
        patchRoles: { primary: unit.fabricRole, secondary: unit.secondaryFabricRole },
      };
    case 'flying_geese':
      return {
        variant: unit.direction,
        patchRoles: { ...unit.patchFabricRoles },
      };
    case 'qst':
      return {
        patchRoles: { ...unit.patchFabricRoles },
      };
  }
}

// =============================================================================
// Generic Config → Type-Specific Unit Update
// =============================================================================

/**
 * Convert generic config changes (variant, patchRoles) back to type-specific
 * unit fields. Returns a Partial<Unit> ready to spread onto an Immer draft.
 */
function configToUnitUpdate(
  unit: Unit,
  newVariant: string | undefined,
  newPatchRoles: Record<string, FabricRoleId> | undefined
): Partial<Unit> {
  const update: Record<string, unknown> = {};

  switch (unit.type) {
    case 'square':
      if (newPatchRoles?.fill !== undefined) {
        update.fabricRole = newPatchRoles.fill;
      }
      break;

    case 'hst':
      if (newVariant !== undefined) {
        update.variant = newVariant as HstVariant;
      }
      if (newPatchRoles) {
        if (newPatchRoles.primary !== undefined) update.fabricRole = newPatchRoles.primary;
        if (newPatchRoles.secondary !== undefined) update.secondaryFabricRole = newPatchRoles.secondary;
      }
      break;

    case 'flying_geese': {
      if (newVariant !== undefined) {
        const newDirection = newVariant as FlyingGeeseDirection;
        update.direction = newDirection;
        // Span changes with direction
        const def = unitRegistry.getOrThrow('flying_geese');
        if (def.spanBehavior.type === 'variant_dependent') {
          update.span = def.spanBehavior.getSpan(newDirection);
        }
      }
      if (newPatchRoles) {
        update.patchFabricRoles = {
          goose: newPatchRoles.goose,
          sky1: newPatchRoles.sky1,
          sky2: newPatchRoles.sky2,
        };
      }
      break;
    }

    case 'qst':
      if (newPatchRoles) {
        update.patchFabricRoles = {
          top: newPatchRoles.top,
          right: newPatchRoles.right,
          bottom: newPatchRoles.bottom,
          left: newPatchRoles.left,
        };
      }
      break;
  }

  return update as Partial<Unit>;
}

// =============================================================================
// Role Extraction & Checking
// =============================================================================

/**
 * Extract all fabric role IDs from any unit.
 * Replaces per-type extraction in operations.ts, InstanceColorPanel, InstanceToolbar.
 */
export function getAllRoleIds(unit: Unit): FabricRoleId[] {
  const config = toUnitConfig(unit);
  return Object.values(config.patchRoles);
}

/**
 * Check if a unit uses a specific fabric role.
 */
export function unitUsesRole(unit: Unit, roleId: FabricRoleId): boolean {
  return getAllRoleIds(unit).includes(roleId);
}

// =============================================================================
// Transform Functions (Rotate, Flip)
// =============================================================================

/**
 * Apply 90° clockwise rotation via the registry.
 * Returns a Partial<Unit> with the changed fields, or null if the unit doesn't rotate.
 */
export function applyRotation(unit: Unit): Partial<Unit> | null {
  const def = unitRegistry.getOrThrow(unit.type);
  const config = toUnitConfig(unit);

  let newVariant: string | undefined;
  let newPatchRoles: Record<string, FabricRoleId> | undefined;

  // Apply variant rotation (HST, Flying Geese)
  if (def.rotateVariant && config.variant) {
    newVariant = def.rotateVariant(config.variant);
  }

  // Apply patch role rotation (QST, or future units that rotate by color cycling)
  if (def.rotatePartRoles) {
    newPatchRoles = def.rotatePartRoles(config.patchRoles);
  }

  // If nothing changed, unit doesn't rotate (e.g., Square)
  if (newVariant === undefined && newPatchRoles === undefined) {
    return null;
  }

  return configToUnitUpdate(unit, newVariant, newPatchRoles);
}

/**
 * Apply horizontal flip via the registry.
 * Returns a Partial<Unit> with the changed fields, or null if the unit doesn't flip.
 *
 * Important: For flips, either the variant changes (geometry handles the visual flip)
 * OR the patch roles swap (colors adjust for the new orientation), but NOT both.
 * Example: Flying Geese pointing right → flip horizontal → now points left (variant change,
 * no sky swap needed). Flying Geese pointing up → flip horizontal → still points up,
 * but sky1↔sky2 swap is needed.
 */
export function applyFlipHorizontal(unit: Unit): Partial<Unit> | null {
  const def = unitRegistry.getOrThrow(unit.type);
  const config = toUnitConfig(unit);

  let newVariant: string | undefined;
  let newPatchRoles: Record<string, FabricRoleId> | undefined;
  let variantChanged = false;

  if (def.flipHorizontalVariant && config.variant) {
    const flipped = def.flipHorizontalVariant(config.variant);
    if (flipped !== config.variant) {
      newVariant = flipped;
      variantChanged = true;
    }
  }

  // Only apply patch role swap if the variant didn't change
  if (!variantChanged && def.flipHorizontalPartRoles) {
    newPatchRoles = def.flipHorizontalPartRoles(config.patchRoles);
  }

  if (newVariant === undefined && newPatchRoles === undefined) {
    return null;
  }

  return configToUnitUpdate(unit, newVariant, newPatchRoles);
}

/**
 * Apply vertical flip via the registry.
 * Returns a Partial<Unit> with the changed fields, or null if the unit doesn't flip.
 *
 * Same variant-vs-partRoles logic as applyFlipHorizontal.
 */
export function applyFlipVertical(unit: Unit): Partial<Unit> | null {
  const def = unitRegistry.getOrThrow(unit.type);
  const config = toUnitConfig(unit);

  let newVariant: string | undefined;
  let newPatchRoles: Record<string, FabricRoleId> | undefined;
  let variantChanged = false;

  if (def.flipVerticalVariant && config.variant) {
    const flipped = def.flipVerticalVariant(config.variant);
    if (flipped !== config.variant) {
      newVariant = flipped;
      variantChanged = true;
    }
  }

  // Only apply patch role swap if the variant didn't change
  if (!variantChanged && def.flipVerticalPartRoles) {
    newPatchRoles = def.flipVerticalPartRoles(config.patchRoles);
  }

  if (newVariant === undefined && newPatchRoles === undefined) {
    return null;
  }

  return configToUnitUpdate(unit, newVariant, newPatchRoles);
}

// =============================================================================
// Role Assignment
// =============================================================================

/**
 * Assign a fabric role to a specific patch of a unit.
 * Returns { prev, next } partial updates for undo/redo recording.
 *
 * If patchId is not provided, assigns to the first/default patch.
 */
export function assignPatchRole(
  unit: Unit,
  roleId: FabricRoleId,
  patchId?: string
): { prev: Partial<Unit>; next: Partial<Unit> } {
  const def = unitRegistry.getOrThrow(unit.type);
  const config = toUnitConfig(unit);

  // Determine target patch
  const validPatchIds = def.patches.map((p) => p.id);
  const targetPatchId = patchId && validPatchIds.includes(patchId) ? patchId : validPatchIds[0];

  // Build new patchRoles with the changed patch
  const newPatchRoles = { ...config.patchRoles, [targetPatchId]: roleId };

  const prev = configToUnitUpdate(unit, undefined, config.patchRoles);
  const next = configToUnitUpdate(unit, undefined, newPatchRoles);

  return { prev, next };
}

/**
 * Replace all occurrences of a fabric role with another across a unit's patches.
 * Returns a Partial<Unit> with the updated fields.
 */
export function replaceRole(
  unit: Unit,
  oldRoleId: FabricRoleId,
  newRoleId: FabricRoleId
): Partial<Unit> {
  const config = toUnitConfig(unit);

  const newPatchRoles: Record<string, FabricRoleId> = {};
  let changed = false;

  for (const [key, value] of Object.entries(config.patchRoles)) {
    if (value === oldRoleId) {
      newPatchRoles[key] = newRoleId;
      changed = true;
    } else {
      newPatchRoles[key] = value;
    }
  }

  if (!changed) return {};

  return configToUnitUpdate(unit, undefined, newPatchRoles);
}

// =============================================================================
// Rendering Helpers
// =============================================================================

/**
 * Resolve a patch's fabric role to a color from the palette.
 */
function resolveColor(
  roleId: FabricRoleId,
  palette: Palette,
  paletteOverrides?: Record<string, string>
): string {
  // Check overrides first
  if (paletteOverrides?.[roleId]) {
    return paletteOverrides[roleId];
  }
  // Look up in palette
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}

/**
 * Get triangles with resolved colors for rendering any unit type.
 *
 * This is the generic rendering function that replaces all per-type
 * render functions in BlockInstanceRenderer, BlockThumbnail, PreviewGrid.
 *
 * @param unit - The unit to render
 * @param cellSize - Size of one grid cell in pixels
 * @param palette - The palette to resolve colors from
 * @param paletteOverrides - Optional per-instance color overrides
 * @returns Array of { points, color } ready for Konva Line components
 */
export function getUnitTrianglesWithColors(
  unit: Unit,
  cellSize: number,
  palette: Palette,
  paletteOverrides?: Record<string, string>
): Array<{ points: number[]; color: string }> {
  const def = unitRegistry.getOrThrow(unit.type);
  const config = toUnitConfig(unit);

  // Calculate dimensions from span
  const width = unit.span.cols * cellSize;
  const height = unit.span.rows * cellSize;

  // Get triangles from registry definition
  const triangles: TriangleGroup = def.getTriangles(config, width, height);

  // Map each triangle's patchId to a color
  return triangles.map((triangle) => {
    const roleId = config.patchRoles[triangle.patchId];
    const color = resolveColor(roleId, palette, paletteOverrides);
    return {
      points: triangleToFlatPoints(triangle),
      color,
    };
  });
}

/**
 * Get the effective span for a unit type with a given variant.
 * Useful for ghost previews and placement validation.
 */
export function getSpanForUnit(typeId: string, variant?: string): Span {
  const def = unitRegistry.getOrThrow(typeId);
  if (def.spanBehavior.type === 'fixed') {
    return def.spanBehavior.span;
  }
  return def.spanBehavior.getSpan(variant ?? def.defaultVariant ?? '');
}
