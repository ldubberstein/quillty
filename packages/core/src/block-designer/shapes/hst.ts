/**
 * HST (Half-Square Triangle) Unit Definition
 *
 * A 1×1 cell divided diagonally into two triangles, each independently colorable.
 * Has 4 variants representing which corner the primary triangle fills.
 */

import { z } from 'zod';
import type { UnitDefinition, UnitConfig, TriangleGroup, VariantDefinition } from '../shape-registry/types';
import { unitRegistry } from '../shape-registry/registry';
import type { HstVariant } from '../types';

/**
 * HST has two colorable patches: primary and secondary triangles.
 */
const HST_PATCHES = [
  { id: 'primary', name: 'Primary', defaultRole: 'background' as const },
  { id: 'secondary', name: 'Secondary', defaultRole: 'background' as const },
] as const;

/**
 * HST variants representing which corner the primary triangle fills.
 */
const HST_VARIANTS: readonly VariantDefinition[] = [
  { id: 'nw', label: 'Top-Left', symbol: '◸' },
  { id: 'ne', label: 'Top-Right', symbol: '◹' },
  { id: 'sw', label: 'Bottom-Left', symbol: '◺' },
  { id: 'se', label: 'Bottom-Right', symbol: '◿' },
] as const;

/**
 * Zod schema for HST configuration.
 */
const hstConfigSchema = z.object({
  variant: z.enum(['nw', 'ne', 'sw', 'se']),
  patchRoles: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
});

/**
 * Rotation map: variant after 90° clockwise rotation.
 */
const ROTATION_MAP: Record<HstVariant, HstVariant> = {
  nw: 'ne',
  ne: 'se',
  se: 'sw',
  sw: 'nw',
};

/**
 * Horizontal flip map: variant after flipping left-right.
 */
const FLIP_H_MAP: Record<HstVariant, HstVariant> = {
  nw: 'ne',
  ne: 'nw',
  sw: 'se',
  se: 'sw',
};

/**
 * Vertical flip map: variant after flipping top-bottom.
 */
const FLIP_V_MAP: Record<HstVariant, HstVariant> = {
  nw: 'sw',
  sw: 'nw',
  ne: 'se',
  se: 'ne',
};

/**
 * HST unit definition.
 */
export const hstDefinition: UnitDefinition<HstVariant> = {
  // === Identity ===
  typeId: 'hst',
  displayName: 'Half-Square Triangle',
  category: 'basic',
  description: 'Two triangles in one cell, divided by a diagonal',

  // === Geometry ===
  defaultSpan: { rows: 1, cols: 1 },
  spanBehavior: { type: 'fixed', span: { rows: 1, cols: 1 } },
  patches: HST_PATCHES,

  // === Variants ===
  variants: HST_VARIANTS,
  defaultVariant: 'nw',

  /**
   * Generate two triangles based on the variant.
   */
  getTriangles(config: UnitConfig, width: number, height: number): TriangleGroup {
    const variant = (config.variant ?? 'nw') as HstVariant;

    switch (variant) {
      case 'nw':
        // ◸ Primary fills top-left, diagonal goes from top-right to bottom-left
        return [
          {
            patchId: 'primary',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: 0, y: height },
            ],
          },
          {
            patchId: 'secondary',
            points: [
              { x: width, y: 0 },
              { x: width, y: height },
              { x: 0, y: height },
            ],
          },
        ];

      case 'ne':
        // ◹ Primary fills top-right, diagonal goes from top-left to bottom-right
        return [
          {
            patchId: 'primary',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: width, y: height },
            ],
          },
          {
            patchId: 'secondary',
            points: [
              { x: 0, y: 0 },
              { x: width, y: height },
              { x: 0, y: height },
            ],
          },
        ];

      case 'sw':
        // ◺ Primary fills bottom-left, diagonal goes from top-left to bottom-right
        return [
          {
            patchId: 'primary',
            points: [
              { x: 0, y: 0 },
              { x: 0, y: height },
              { x: width, y: height },
            ],
          },
          {
            patchId: 'secondary',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: width, y: height },
            ],
          },
        ];

      case 'se':
        // ◿ Primary fills bottom-right, diagonal goes from top-right to bottom-left
        return [
          {
            patchId: 'primary',
            points: [
              { x: width, y: 0 },
              { x: width, y: height },
              { x: 0, y: height },
            ],
          },
          {
            patchId: 'secondary',
            points: [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: 0, y: height },
            ],
          },
        ];
    }
  },

  // === Transformations ===
  rotateVariant(current: HstVariant): HstVariant {
    return ROTATION_MAP[current];
  },

  flipHorizontalVariant(current: HstVariant): HstVariant {
    return FLIP_H_MAP[current];
  },

  flipVerticalVariant(current: HstVariant): HstVariant {
    return FLIP_V_MAP[current];
  },

  // === Validation ===
  configSchema: hstConfigSchema,

  // No special placement validation needed
  validatePlacement: undefined,

  // === UI ===
  thumbnail: {
    type: 'svg',
    viewBox: '0 0 24 24',
    paths: [
      { points: '3,3 21,3 3,21', fill: 'currentColor' },
      { points: '21,3 21,21 3,21', fill: '#E5E7EB' },
    ],
  },

  placementMode: 'single_tap',
  supportsBatchPlacement: true,
};

// Register the unit
unitRegistry.register(hstDefinition);
