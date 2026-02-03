/**
 * Fabric Requirements Calculations
 *
 * DEFERRED TO POST-MVP per DATA_MODEL.md §11
 *
 * This module will calculate fabric yardage requirements based on:
 * - Total area of each fabric role
 * - Cutting waste allowances
 * - Fabric width assumptions
 *
 * The new shape-centric model requires rethinking how fabric is calculated
 * since shapes now have fabric_role references instead of direct colors.
 */

import type { FabricRequirements } from './types';

/**
 * Calculate fabric requirements from a pattern design
 *
 * @deprecated Deferred to post-MVP - returns placeholder data
 */
export function calculateFabricRequirements(): FabricRequirements {
  // TODO: Implement with new shape-centric model (deferred to post-MVP)
  // - Iterate over block instances in pattern
  // - For each shape, calculate area based on type and span
  // - Aggregate by fabric role (resolved to color via pattern palette)
  // - Add waste factor and convert to yardage
  return {
    fabrics: [],
    totalYardage: 0,
    backing: {
      width: 0,
      height: 0,
      yardage: 0,
    },
    binding: {
      strips: 0,
      yardage: 0,
    },
  };
}
