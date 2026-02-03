/**
 * Cutting List Calculations
 *
 * DEFERRED TO POST-MVP per DATA_MODEL.md §11
 *
 * This module will calculate cutting instructions based on:
 * - Shape types and sizes
 * - Seam allowances
 * - Efficient cutting layouts
 *
 * The new shape-centric model requires rethinking how cuts are calculated
 * since shapes now have fabric_role references instead of direct colors.
 */

import type { CuttingInstruction } from './types';

/**
 * Calculate cutting list from a pattern design
 *
 * @deprecated Deferred to post-MVP - returns empty array
 */
export function calculateCuttingList(): CuttingInstruction[] {
  // TODO: Implement with new shape-centric model (deferred to post-MVP)
  // - Iterate over block instances in pattern
  // - For each shape, determine cut size based on type
  // - Aggregate by fabric role (resolved to color via pattern palette)
  return [];
}
