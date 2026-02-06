/**
 * QST (Quarter-Square Triangle) Unit Definition
 *
 * A 1×1 cell divided into 4 triangles meeting at the center.
 * Each triangle is independently colorable.
 *
 * QST has no variants - the geometry is always the same.
 * Visual rotation is achieved by cycling the patch colors.
 */

import { z } from 'zod';
import type { UnitDefinition, UnitConfig, TriangleGroup } from '../shape-registry/types';
import { unitRegistry } from '../shape-registry/registry';
import type { FabricRoleId } from '../types';

/**
 * QST has four colorable patches named by compass direction.
 */
const QST_PATCHES = [
  { id: 'top', name: 'Top', defaultRole: 'background' as const },
  { id: 'right', name: 'Right', defaultRole: 'background' as const },
  { id: 'bottom', name: 'Bottom', defaultRole: 'background' as const },
  { id: 'left', name: 'Left', defaultRole: 'background' as const },
] as const;

/**
 * Zod schema for QST configuration.
 * QST has no variants, just 4 patch roles.
 */
const qstConfigSchema = z.object({
  variant: z.undefined().optional(),
  patchRoles: z.object({
    top: z.string(),
    right: z.string(),
    bottom: z.string(),
    left: z.string(),
  }),
});

/**
 * QST unit definition.
 */
export const qstDefinition: UnitDefinition = {
  // === Identity ===
  typeId: 'qst',
  displayName: 'Quarter-Square Triangle',
  category: 'basic',
  description: 'Four triangles meeting at the center, each independently colorable',

  // === Geometry ===
  defaultSpan: { rows: 1, cols: 1 },
  spanBehavior: { type: 'fixed', span: { rows: 1, cols: 1 } },
  patches: QST_PATCHES,

  // QST has no variants - rotation is done by cycling colors
  variants: undefined,
  defaultVariant: undefined,

  /**
   * Generate four triangles meeting at the center.
   */
  getTriangles(_config: UnitConfig, width: number, height: number): TriangleGroup {
    const cx = width / 2;
    const cy = height / 2;

    return [
      // Top triangle: top-left → top-right → center
      {
        patchId: 'top',
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: cx, y: cy },
        ],
      },
      // Right triangle: top-right → bottom-right → center
      {
        patchId: 'right',
        points: [
          { x: width, y: 0 },
          { x: width, y: height },
          { x: cx, y: cy },
        ],
      },
      // Bottom triangle: bottom-right → bottom-left → center
      {
        patchId: 'bottom',
        points: [
          { x: width, y: height },
          { x: 0, y: height },
          { x: cx, y: cy },
        ],
      },
      // Left triangle: bottom-left → top-left → center
      {
        patchId: 'left',
        points: [
          { x: 0, y: height },
          { x: 0, y: 0 },
          { x: cx, y: cy },
        ],
      },
    ];
  },

  // QST doesn't use variant-based rotation - it uses patch color cycling
  rotateVariant: undefined,
  flipHorizontalVariant: undefined,
  flipVerticalVariant: undefined,

  /**
   * Rotate QST by cycling patch colors clockwise: top→right→bottom→left→top
   */
  rotatePartRoles(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId> {
    return {
      top: currentRoles.left,
      right: currentRoles.top,
      bottom: currentRoles.right,
      left: currentRoles.bottom,
    };
  },

  /**
   * Horizontal flip swaps left↔right.
   */
  flipHorizontalPartRoles(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId> {
    return {
      top: currentRoles.top,
      right: currentRoles.left,
      bottom: currentRoles.bottom,
      left: currentRoles.right,
    };
  },

  /**
   * Vertical flip swaps top↔bottom.
   */
  flipVerticalPartRoles(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId> {
    return {
      top: currentRoles.bottom,
      right: currentRoles.right,
      bottom: currentRoles.top,
      left: currentRoles.left,
    };
  },

  // === Validation ===
  configSchema: qstConfigSchema,

  // No special placement validation needed
  validatePlacement: undefined,

  // === UI ===
  thumbnail: {
    type: 'svg',
    viewBox: '0 0 24 24',
    paths: [
      { points: '3,3 21,3 12,12', fill: 'currentColor' },
      { points: '21,3 21,21 12,12', fill: '#E5E7EB' },
      { points: '21,21 3,21 12,12', fill: 'currentColor' },
      { points: '3,21 3,3 12,12', fill: '#E5E7EB' },
    ],
  },

  placementMode: 'single_tap',
  supportsBatchPlacement: true,
};

// Register the unit
unitRegistry.register(qstDefinition);
