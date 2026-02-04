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
const BACKGROUND_COLOR = '#FAFAFA'; // Very light gray for empty cells

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

  return (
    <Group x={offsetX} y={offsetY} listening={false}>
      {/* Background for empty cells */}
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill={BACKGROUND_COLOR}
      />

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
