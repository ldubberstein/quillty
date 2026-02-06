/**
 * Flying Geese Unit Definition
 *
 * A 2:1 ratio unit spanning 2 cells with 3 independently colorable triangles:
 * - Goose: The center triangle pointing in the direction
 * - Sky1/Sky2: The two flanking triangles
 *
 * Span depends on direction:
 * - Horizontal (left/right): 1 row × 2 cols
 * - Vertical (up/down): 2 rows × 1 col
 */

import { z } from 'zod';
import type {
  UnitDefinition,
  UnitConfig,
  TriangleGroup,
  VariantDefinition,
  PlacementValidation,
} from '../shape-registry/types';
import { unitRegistry } from '../shape-registry/registry';
import type { FlyingGeeseDirection, GridPosition, FabricRoleId, Span } from '../types';

/**
 * Flying Geese has three colorable patches.
 */
const FLYING_GEESE_PATCHES = [
  { id: 'goose', name: 'Goose', defaultRole: 'background' as const },
  { id: 'sky1', name: 'Sky 1', defaultRole: 'background' as const },
  { id: 'sky2', name: 'Sky 2', defaultRole: 'background' as const },
] as const;

/**
 * Flying Geese directions (variants).
 */
const FLYING_GEESE_VARIANTS: readonly VariantDefinition[] = [
  { id: 'right', label: 'Right', symbol: '▶' },
  { id: 'left', label: 'Left', symbol: '◀' },
  { id: 'down', label: 'Down', symbol: '▼' },
  { id: 'up', label: 'Up', symbol: '▲' },
] as const;

/**
 * Zod schema for Flying Geese configuration.
 */
const flyingGeeseConfigSchema = z.object({
  variant: z.enum(['up', 'down', 'left', 'right']),
  patchRoles: z.object({
    goose: z.string(),
    sky1: z.string(),
    sky2: z.string(),
  }),
});

/**
 * Get span based on direction (variant).
 */
function getSpanForDirection(direction: FlyingGeeseDirection): Span {
  if (direction === 'left' || direction === 'right') {
    return { rows: 1, cols: 2 }; // Horizontal
  }
  return { rows: 2, cols: 1 }; // Vertical
}

/**
 * Rotation map: direction after 90° clockwise rotation.
 */
const ROTATION_MAP: Record<FlyingGeeseDirection, FlyingGeeseDirection> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
};

/**
 * Horizontal flip map: direction after flipping left-right.
 */
const FLIP_H_MAP: Record<FlyingGeeseDirection, FlyingGeeseDirection> = {
  left: 'right',
  right: 'left',
  up: 'up',
  down: 'down',
};

/**
 * Vertical flip map: direction after flipping top-bottom.
 */
const FLIP_V_MAP: Record<FlyingGeeseDirection, FlyingGeeseDirection> = {
  up: 'down',
  down: 'up',
  left: 'left',
  right: 'right',
};

/**
 * Flying Geese unit definition.
 */
export const flyingGeeseDefinition: UnitDefinition<FlyingGeeseDirection> = {
  // === Identity ===
  typeId: 'flying_geese',
  displayName: 'Flying Geese',
  category: 'compound',
  description: 'A 2:1 ratio unit with a center triangle and two flanking triangles',

  // === Geometry ===
  defaultSpan: { rows: 1, cols: 2 }, // Default to horizontal (right)
  spanBehavior: {
    type: 'variant_dependent',
    getSpan: (variant) => getSpanForDirection(variant as FlyingGeeseDirection),
  },
  patches: FLYING_GEESE_PATCHES,

  // === Variants ===
  variants: FLYING_GEESE_VARIANTS,
  defaultVariant: 'right',

  /**
   * Generate three triangles based on the direction.
   */
  getTriangles(config: UnitConfig, width: number, height: number): TriangleGroup {
    const direction = (config.variant ?? 'right') as FlyingGeeseDirection;

    switch (direction) {
      case 'right':
        // Horizontal: goose points right
        return [
          {
            patchId: 'goose',
            points: [
              { x: 0, y: 0 },
              { x: width, y: height / 2 },
              { x: 0, y: height },
            ],
          },
          {
            patchId: 'sky1',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: width, y: height / 2 },
            ],
          },
          {
            patchId: 'sky2',
            points: [
              { x: 0, y: height },
              { x: width, y: height / 2 },
              { x: width, y: height },
            ],
          },
        ];

      case 'left':
        // Horizontal: goose points left
        return [
          {
            patchId: 'goose',
            points: [
              { x: width, y: 0 },
              { x: 0, y: height / 2 },
              { x: width, y: height },
            ],
          },
          {
            patchId: 'sky1',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: 0, y: height / 2 },
            ],
          },
          {
            patchId: 'sky2',
            points: [
              { x: 0, y: height / 2 },
              { x: width, y: height },
              { x: 0, y: height },
            ],
          },
        ];

      case 'down':
        // Vertical: goose points down
        return [
          {
            patchId: 'goose',
            points: [
              { x: 0, y: 0 },
              { x: width / 2, y: height },
              { x: width, y: 0 },
            ],
          },
          {
            patchId: 'sky1',
            points: [
              { x: 0, y: 0 },
              { x: 0, y: height },
              { x: width / 2, y: height },
            ],
          },
          {
            patchId: 'sky2',
            points: [
              { x: width, y: 0 },
              { x: width / 2, y: height },
              { x: width, y: height },
            ],
          },
        ];

      case 'up':
        // Vertical: goose points up
        return [
          {
            patchId: 'goose',
            points: [
              { x: 0, y: height },
              { x: width / 2, y: 0 },
              { x: width, y: height },
            ],
          },
          {
            patchId: 'sky1',
            points: [
              { x: 0, y: 0 },
              { x: width / 2, y: 0 },
              { x: 0, y: height },
            ],
          },
          {
            patchId: 'sky2',
            points: [
              { x: width / 2, y: 0 },
              { x: width, y: 0 },
              { x: width, y: height },
            ],
          },
        ];
    }
  },

  // === Transformations ===
  rotateVariant(current: FlyingGeeseDirection): FlyingGeeseDirection {
    return ROTATION_MAP[current];
  },

  flipHorizontalVariant(current: FlyingGeeseDirection): FlyingGeeseDirection {
    return FLIP_H_MAP[current];
  },

  flipVerticalVariant(current: FlyingGeeseDirection): FlyingGeeseDirection {
    return FLIP_V_MAP[current];
  },

  /**
   * Flip sky triangles when flipping horizontally (for left/right directions).
   * For up/down, the sky triangles should swap.
   */
  flipHorizontalPartRoles(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId> {
    return {
      goose: currentRoles.goose,
      sky1: currentRoles.sky2,
      sky2: currentRoles.sky1,
    };
  },

  /**
   * Flip sky triangles when flipping vertically.
   */
  flipVerticalPartRoles(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId> {
    return {
      goose: currentRoles.goose,
      sky1: currentRoles.sky2,
      sky2: currentRoles.sky1,
    };
  },

  // === Validation ===
  configSchema: flyingGeeseConfigSchema,

  /**
   * Validate placement - Flying Geese needs 2 adjacent cells.
   * Returns valid adjacent cells for the second tap.
   */
  validatePlacement(
    position: GridPosition,
    gridSize: number,
    isCellOccupied: (pos: GridPosition) => boolean
  ): PlacementValidation {
    const { row, col } = position;
    const validAdjacentCells: GridPosition[] = [];

    // Check all 4 adjacent cells
    const adjacentPositions: GridPosition[] = [
      { row: row - 1, col }, // Up
      { row: row + 1, col }, // Down
      { row, col: col - 1 }, // Left
      { row, col: col + 1 }, // Right
    ];

    for (const adj of adjacentPositions) {
      // Check bounds
      if (adj.row < 0 || adj.row >= gridSize || adj.col < 0 || adj.col >= gridSize) {
        continue;
      }
      // Check if occupied
      if (!isCellOccupied(adj)) {
        validAdjacentCells.push(adj);
      }
    }

    if (validAdjacentCells.length === 0) {
      return {
        valid: false,
        reason: 'No adjacent empty cells available for Flying Geese',
      };
    }

    return {
      valid: true,
      validAdjacentCells,
    };
  },

  // === UI ===
  thumbnail: {
    type: 'svg',
    viewBox: '0 0 48 24',
    paths: [
      { points: '3,3 45,12 3,21', fill: 'currentColor' },
      { points: '3,3 45,3 45,12', fill: '#E5E7EB' },
      { points: '3,21 45,12 45,21', fill: '#E5E7EB' },
    ],
  },

  placementMode: 'two_tap',
  supportsBatchPlacement: false, // Flying Geese uses two-tap, not batch
  wideInPicker: true, // Spans 2 columns in unit picker
};

// Register the unit
unitRegistry.register(flyingGeeseDefinition);
