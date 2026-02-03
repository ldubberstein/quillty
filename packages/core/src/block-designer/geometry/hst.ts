/**
 * HST (Half-Square Triangle) Geometry Calculations
 *
 * Provides functions to calculate the triangle points for each HST variant.
 * Each variant represents which corner the primary fabric fills:
 * - nw (◸): top-left triangle (primary), bottom-right triangle (secondary)
 * - ne (◹): top-right triangle (primary), bottom-left triangle (secondary)
 * - sw (◺): bottom-left triangle (primary), top-right triangle (secondary)
 * - se (◿): bottom-right triangle (primary), top-left triangle (secondary)
 */

import type { HstVariant } from '../types';

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Triangle defined by three points
 */
export interface Triangle {
  points: [Point, Point, Point];
}

/**
 * HST triangle paths for both primary and secondary triangles
 */
export interface HstTriangles {
  primary: Triangle;
  secondary: Triangle;
}

/**
 * Get the triangle paths for an HST variant
 *
 * @param variant - The HST variant (nw, ne, sw, se)
 * @param width - Width of the cell in pixels
 * @param height - Height of the cell in pixels (usually equal to width for square cells)
 * @returns The primary and secondary triangle definitions
 */
export function getHstTriangles(variant: HstVariant, width: number, height: number): HstTriangles {
  switch (variant) {
    case 'nw':
      // ◸ Primary fills top-left, diagonal goes from top-right to bottom-left
      return {
        primary: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
          ],
        },
        secondary: {
          points: [
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
        },
      };

    case 'ne':
      // ◹ Primary fills top-right, diagonal goes from top-left to bottom-right
      return {
        primary: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
          ],
        },
        secondary: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
        },
      };

    case 'sw':
      // ◺ Primary fills bottom-left, diagonal goes from top-left to bottom-right
      return {
        primary: {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: height },
            { x: width, y: height },
          ],
        },
        secondary: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
          ],
        },
      };

    case 'se':
      // ◿ Primary fills bottom-right, diagonal goes from top-right to bottom-left
      return {
        primary: {
          points: [
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
        },
        secondary: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
          ],
        },
      };
  }
}

/**
 * Convert triangle points to a flat array for Konva Line
 *
 * @param triangle - The triangle definition
 * @returns Flat array [x1, y1, x2, y2, x3, y3]
 */
export function triangleToFlatPoints(triangle: Triangle): number[] {
  return triangle.points.flatMap((p) => [p.x, p.y]);
}

/**
 * HST variants with their display info
 */
export const HST_VARIANT_INFO: Record<HstVariant, { symbol: string; label: string }> = {
  nw: { symbol: '◸', label: 'NW' },
  ne: { symbol: '◹', label: 'NE' },
  sw: { symbol: '◺', label: 'SW' },
  se: { symbol: '◿', label: 'SE' },
};
