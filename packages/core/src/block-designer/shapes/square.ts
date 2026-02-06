/**
 * Square Unit Definition
 *
 * The simplest unit - a solid 1×1 square with one colorable patch.
 * Rendered as two triangles for consistency with the triangle-based rendering system.
 */

import { z } from 'zod';
import type { UnitDefinition, UnitConfig, TriangleGroup } from '../shape-registry/types';
import { unitRegistry } from '../shape-registry/registry';

/**
 * Square has a single patch - the whole square.
 * We render it as two triangles to use the same rendering pipeline as other units.
 */
const SQUARE_PATCHES = [
  { id: 'fill', name: 'Fill', defaultRole: 'background' as const },
] as const;

/**
 * Zod schema for Square configuration.
 * Square has no variants, just a single patch role.
 */
const squareConfigSchema = z.object({
  variant: z.undefined().optional(),
  patchRoles: z.object({
    fill: z.string(),
  }),
});

/**
 * Square unit definition.
 */
export const squareDefinition: UnitDefinition = {
  // === Identity ===
  typeId: 'square',
  displayName: 'Square',
  category: 'basic',
  description: 'A solid square filling one grid cell',

  // === Geometry ===
  defaultSpan: { rows: 1, cols: 1 },
  spanBehavior: { type: 'fixed', span: { rows: 1, cols: 1 } },
  patches: SQUARE_PATCHES,

  // No variants - squares don't rotate
  variants: undefined,
  defaultVariant: undefined,

  /**
   * Generate two triangles that fill the square.
   * We use the same diagonal split as HST-nw, but both triangles use the same patch ID.
   */
  getTriangles(_config: UnitConfig, width: number, height: number): TriangleGroup {
    return [
      {
        patchId: 'fill',
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: 0, y: height },
        ],
      },
      {
        patchId: 'fill',
        points: [
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
      },
    ];
  },

  // Squares don't rotate or flip (they're symmetric)
  rotateVariant: undefined,
  flipHorizontalVariant: undefined,
  flipVerticalVariant: undefined,

  // === Validation ===
  configSchema: squareConfigSchema,

  // No special placement validation needed
  validatePlacement: undefined,

  // === UI ===
  thumbnail: {
    type: 'svg',
    viewBox: '0 0 24 24',
    paths: [{ points: '3,3 21,3 21,21 3,21', fill: 'currentColor' }],
  },

  placementMode: 'single_tap',
  supportsBatchPlacement: true,
};

// Register the unit
unitRegistry.register(squareDefinition);
