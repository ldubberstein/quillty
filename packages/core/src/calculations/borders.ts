/**
 * Border Sizing Calculations
 *
 * Utilities for calculating border widths using mathematical proportions
 * commonly used in quilt design (Golden Ratio, Fibonacci sequence).
 */

import type { BorderConfig, PhysicalSize, QuiltGridSize } from '../pattern-designer/types';

/** The Golden Ratio - aesthetically pleasing proportion found in nature */
const GOLDEN_RATIO = 1.618;

/** Fibonacci sequence values for proportional border widths */
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21];

/**
 * Suggest next border width based on Golden Ratio
 * Each subsequent border should be approximately 1.618× the previous
 *
 * @param previousWidth - Width of the previous (inner) border in inches
 * @returns Suggested width rounded to nearest 0.25"
 */
export function suggestGoldenRatioWidth(previousWidth: number): number {
  const suggested = previousWidth * GOLDEN_RATIO;
  return Math.round(suggested * 4) / 4; // Round to nearest 0.25"
}

/**
 * Suggest border widths using Fibonacci sequence
 * Distributes total border width according to Fibonacci proportions
 *
 * @param totalWidth - Total desired border width in inches
 * @param borderCount - Number of borders (1-4)
 * @returns Array of suggested widths rounded to nearest 0.25"
 *
 * @example
 * suggestFibonacciWidths(10, 3) // Returns [1.5, 2.5, 6] (1:2:5 ratio scaled to 10")
 */
export function suggestFibonacciWidths(totalWidth: number, borderCount: number): number[] {
  if (borderCount < 1 || borderCount > FIBONACCI.length) {
    return [];
  }

  const relevantFib = FIBONACCI.slice(0, borderCount);
  const sum = relevantFib.reduce((a, b) => a + b, 0);

  return relevantFib.map((f) => Math.round((f / sum) * totalWidth * 4) / 4);
}

/**
 * Suggest border width based on block size
 * Traditional rule: border should be 1/4 to 1/2 of block size
 *
 * @param blockSizeInches - Size of quilt blocks in inches
 * @returns Object with min, max, and suggested (1/3 of block size) values
 */
export function suggestWidthFromBlockSize(blockSizeInches: number): {
  min: number;
  max: number;
  suggested: number;
} {
  return {
    min: Math.round((blockSizeInches / 4) * 4) / 4,
    max: Math.round((blockSizeInches / 2) * 4) / 4,
    suggested: Math.round((blockSizeInches / 3) * 4) / 4,
  };
}

/**
 * Calculate total quilt dimensions with borders
 *
 * @param physicalSize - Physical size of the quilt center
 * @param borderConfig - Border configuration
 * @returns Final dimensions including borders
 */
export function calculateQuiltSizeWithBorders(
  physicalSize: PhysicalSize,
  borderConfig: BorderConfig | null
): { widthInches: number; heightInches: number } {
  if (!borderConfig?.enabled || borderConfig.borders.length === 0) {
    return {
      widthInches: physicalSize.widthInches,
      heightInches: physicalSize.heightInches,
    };
  }

  const totalBorderWidth = borderConfig.borders.reduce((sum, b) => sum + b.widthInches, 0);

  return {
    widthInches: physicalSize.widthInches + totalBorderWidth * 2,
    heightInches: physicalSize.heightInches + totalBorderWidth * 2,
  };
}

/**
 * Calculate border widths needed to reach a target quilt size
 *
 * @param currentSize - Current quilt center size
 * @param targetSize - Desired final size
 * @param borderCount - Number of borders to distribute width across (default 1)
 * @returns Array of suggested border widths, or null if target is smaller than current
 */
export function calculateBordersForTargetSize(
  currentSize: PhysicalSize,
  targetSize: { widthInches: number; heightInches: number },
  borderCount: number = 1
): number[] | null {
  // Use the smaller dimension to calculate required border
  const widthNeeded = (targetSize.widthInches - currentSize.widthInches) / 2;
  const heightNeeded = (targetSize.heightInches - currentSize.heightInches) / 2;

  // Use the smaller of the two to ensure the quilt fits
  const borderNeeded = Math.min(widthNeeded, heightNeeded);

  if (borderNeeded <= 0) {
    return null; // Target size is smaller than current
  }

  // Distribute using Fibonacci for multiple borders
  if (borderCount > 1) {
    return suggestFibonacciWidths(borderNeeded, borderCount);
  }

  return [Math.round(borderNeeded * 4) / 4];
}

/** Standard bed sizes in inches (mattress dimensions) */
export const BED_SIZES = {
  baby: { width: 36, height: 52, name: 'Baby' },
  twin: { width: 68, height: 88, name: 'Twin' },
  full: { width: 84, height: 90, name: 'Full' },
  queen: { width: 90, height: 96, name: 'Queen' },
  king: { width: 106, height: 96, name: 'King' },
} as const;

export type BedSize = keyof typeof BED_SIZES;
