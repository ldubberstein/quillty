'use client';

import { Group, Rect, Line } from 'react-konva';

interface PatternGridLinesProps {
  /** Number of rows in the pattern grid */
  rows: number;
  /** Number of columns in the pattern grid */
  cols: number;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset for centering */
  offsetX: number;
  /** Y offset for centering */
  offsetY: number;
}

/** Grid styling - mimics quilt seam lines */
const SEAM_LINE_COLOR = '#D1D5DB'; // gray-300 (like seam lines between blocks)
const SEAM_LINE_WIDTH = 1;
const BORDER_COLOR = '#6B7280'; // gray-500 (quilt edge)
const BORDER_WIDTH = 2;

/** Checkerboard pattern for empty cells (Photoshop-style transparency indicator) */
const CHECKER_SIZE = 10; // Size of each checker square in pixels
const CHECKER_COLOR_1 = '#FFFFFF'; // White
const CHECKER_COLOR_2 = '#F3F4F6'; // Very light gray (gray-100)

/**
 * Generate checkerboard pattern rectangles
 * Creates a Photoshop-style transparency indicator pattern
 */
function generateCheckerboard(totalWidth: number, totalHeight: number): JSX.Element[] {
  const checkers: JSX.Element[] = [];
  const colCount = Math.ceil(totalWidth / CHECKER_SIZE);
  const rowCount = Math.ceil(totalHeight / CHECKER_SIZE);

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const isEven = (row + col) % 2 === 0;
      const color = isEven ? CHECKER_COLOR_1 : CHECKER_COLOR_2;

      const x = col * CHECKER_SIZE;
      const y = row * CHECKER_SIZE;
      const width = Math.min(CHECKER_SIZE, totalWidth - x);
      const height = Math.min(CHECKER_SIZE, totalHeight - y);

      if (width > 0 && height > 0) {
        checkers.push(
          <Rect
            key={`checker-${row}-${col}`}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={color}
          />
        );
      }
    }
  }

  return checkers;
}

/**
 * PatternGridLines - Renders seam lines between quilt blocks
 *
 * This creates the visual structure of a quilt layout:
 * - Thin gray lines between cells (like seam lines)
 * - Darker border around the entire quilt
 * - Light background for empty areas
 */
export function PatternGridLines({
  rows,
  cols,
  cellSize,
  offsetX,
  offsetY,
}: PatternGridLinesProps) {
  const totalWidth = cols * cellSize;
  const totalHeight = rows * cellSize;

  // Generate seam lines (inner grid lines)
  const lines: JSX.Element[] = [];

  // Vertical seam lines
  for (let i = 1; i < cols; i++) {
    const x = i * cellSize;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, totalHeight]}
        stroke={SEAM_LINE_COLOR}
        strokeWidth={SEAM_LINE_WIDTH}
        listening={false}
      />
    );
  }

  // Horizontal seam lines
  for (let i = 1; i < rows; i++) {
    const y = i * cellSize;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, totalWidth, y]}
        stroke={SEAM_LINE_COLOR}
        strokeWidth={SEAM_LINE_WIDTH}
        listening={false}
      />
    );
  }

  // Generate checkerboard pattern
  const checkerboard = generateCheckerboard(totalWidth, totalHeight);

  return (
    <Group x={offsetX} y={offsetY} listening={false}>
      {/* Checkerboard pattern background (Photoshop-style transparency indicator) */}
      <Group clipX={0} clipY={0} clipWidth={totalWidth} clipHeight={totalHeight}>
        {checkerboard}
      </Group>

      {/* Seam lines between blocks */}
      {lines}

      {/* Quilt border */}
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        stroke={BORDER_COLOR}
        strokeWidth={BORDER_WIDTH}
        listening={false}
      />
    </Group>
  );
}
