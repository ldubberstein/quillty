import type { GridPosition } from '../block-designer/types';

/**
 * Calculate all grid positions in a rectangular range between two corners.
 * Works regardless of which corner is start vs end (handles all orderings).
 *
 * @param start First corner of the rectangle
 * @param end Second corner of the rectangle
 * @returns Array of all positions within the rectangular area (inclusive)
 */
export function getRectangularRange(
  start: GridPosition,
  end: GridPosition
): GridPosition[] {
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);

  const positions: GridPosition[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}
