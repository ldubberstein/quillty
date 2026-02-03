/**
 * Flying Geese Geometry Calculations
 *
 * Provides functions to calculate triangle paths for Flying Geese shapes.
 * Flying Geese consist of a center triangle (the "goose") pointing in a direction,
 * flanked by two smaller triangles (the "sky") on either side.
 *
 * The shape spans 2 cells in a 2:1 ratio:
 * - Horizontal (left/right): 1 row × 2 cols
 * - Vertical (up/down): 2 rows × 1 col
 */

import type { FlyingGeeseDirection } from '../types';
import type { Triangle } from './hst';

/**
 * Flying Geese triangle paths
 */
export interface FlyingGeeseTriangles {
  /** The center triangle (goose) - uses primary fabric role */
  goose: Triangle;
  /** First sky triangle - uses secondary fabric role */
  sky1: Triangle;
  /** Second sky triangle - uses secondary fabric role */
  sky2: Triangle;
}

/**
 * Get the triangle paths for a Flying Geese shape
 *
 * @param direction - The direction the goose points
 * @param width - Total width of the shape in pixels
 * @param height - Total height of the shape in pixels
 * @returns The goose and sky triangle definitions
 */
export function getFlyingGeeseTriangles(
  direction: FlyingGeeseDirection,
  width: number,
  height: number
): FlyingGeeseTriangles {
  switch (direction) {
    case 'right':
      // Horizontal: goose points right
      // Shape is wide (2 cells) and short (1 cell)
      return {
        goose: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: height / 2 },
            { x: 0, y: height },
          ],
        },
        sky1: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height / 2 },
          ],
        },
        sky2: {
          points: [
            { x: 0, y: height },
            { x: width, y: height / 2 },
            { x: width, y: height },
          ],
        },
      };

    case 'left':
      // Horizontal: goose points left
      return {
        goose: {
          points: [
            { x: width, y: 0 },
            { x: 0, y: height / 2 },
            { x: width, y: height },
          ],
        },
        sky1: {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height / 2 },
          ],
        },
        sky2: {
          points: [
            { x: 0, y: height / 2 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
        },
      };

    case 'down':
      // Vertical: goose points down
      // Shape is tall (2 cells) and narrow (1 cell)
      return {
        goose: {
          points: [
            { x: 0, y: 0 },
            { x: width / 2, y: height },
            { x: width, y: 0 },
          ],
        },
        sky1: {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: height },
            { x: width / 2, y: height },
          ],
        },
        sky2: {
          points: [
            { x: width, y: 0 },
            { x: width / 2, y: height },
            { x: width, y: height },
          ],
        },
      };

    case 'up':
      // Vertical: goose points up
      return {
        goose: {
          points: [
            { x: 0, y: height },
            { x: width / 2, y: 0 },
            { x: width, y: height },
          ],
        },
        sky1: {
          points: [
            { x: 0, y: 0 },
            { x: width / 2, y: 0 },
            { x: 0, y: height },
          ],
        },
        sky2: {
          points: [
            { x: width / 2, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
          ],
        },
      };
  }
}

/**
 * Flying Geese direction display info
 */
export const FLYING_GEESE_DIRECTION_INFO: Record<
  FlyingGeeseDirection,
  { symbol: string; label: string }
> = {
  up: { symbol: '▲', label: 'Up' },
  down: { symbol: '▼', label: 'Down' },
  left: { symbol: '◀', label: 'Left' },
  right: { symbol: '▶', label: 'Right' },
};
