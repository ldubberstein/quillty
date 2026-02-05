/**
 * QST (Quarter-Square Triangle) Geometry Calculations
 *
 * Provides functions to calculate the triangle points for QST shapes.
 * QST divides a square into 4 triangles meeting at the center point.
 *
 * Note: QST has no variants - the shape geometry is always the same (4 triangles meeting at center).
 * Visual variety comes from coloring the 4 triangles (top, right, bottom, left) differently.
 * The shape has 2-fold rotational symmetry, so visual rotation is achieved by cycling part colors.
 */

import type { Point, Triangle } from './hst';

/**
 * QST triangle paths for all four triangles
 */
export interface QstTriangles {
  top: Triangle;
  right: Triangle;
  bottom: Triangle;
  left: Triangle;
}

/**
 * Get the triangle paths for a QST
 *
 * @param width - Width of the cell in pixels
 * @param height - Height of the cell in pixels (usually equal to width for square cells)
 * @returns The four triangle definitions (top, right, bottom, left)
 */
export function getQstTriangles(width: number, height: number): QstTriangles {
  const cx = width / 2;
  const cy = height / 2;

  return {
    // Top triangle: top-left corner → top-right corner → center
    top: {
      points: [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: cx, y: cy },
      ],
    },
    // Right triangle: top-right corner → bottom-right corner → center
    right: {
      points: [
        { x: width, y: 0 },
        { x: width, y: height },
        { x: cx, y: cy },
      ],
    },
    // Bottom triangle: bottom-right corner → bottom-left corner → center
    bottom: {
      points: [
        { x: width, y: height },
        { x: 0, y: height },
        { x: cx, y: cy },
      ],
    },
    // Left triangle: bottom-left corner → top-left corner → center
    left: {
      points: [
        { x: 0, y: height },
        { x: 0, y: 0 },
        { x: cx, y: cy },
      ],
    },
  };
}
