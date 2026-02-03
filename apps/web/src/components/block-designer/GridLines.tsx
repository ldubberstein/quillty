'use client';

import { Group, Rect, Line } from 'react-konva';
import type { GridSize } from '@quillty/core';

interface GridLinesProps {
  /** Grid size (2, 3, or 4) */
  gridSize: GridSize;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset for centering */
  offsetX: number;
  /** Y offset for centering */
  offsetY: number;
}

/** Grid line styling */
const GRID_LINE_COLOR = '#D1D5DB'; // gray-300
const GRID_LINE_WIDTH = 1;
const GRID_BORDER_COLOR = '#6B7280'; // gray-500
const GRID_BORDER_WIDTH = 2;
const GRID_BG_COLOR = '#FFFFFF';

export function GridLines({ gridSize, cellSize, offsetX, offsetY }: GridLinesProps) {
  const totalSize = gridSize * cellSize;

  // Generate grid lines
  const lines: JSX.Element[] = [];

  // Vertical lines (inner)
  for (let i = 1; i < gridSize; i++) {
    const x = i * cellSize;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, totalSize]}
        stroke={GRID_LINE_COLOR}
        strokeWidth={GRID_LINE_WIDTH}
      />
    );
  }

  // Horizontal lines (inner)
  for (let i = 1; i < gridSize; i++) {
    const y = i * cellSize;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, totalSize, y]}
        stroke={GRID_LINE_COLOR}
        strokeWidth={GRID_LINE_WIDTH}
      />
    );
  }

  return (
    <Group x={offsetX} y={offsetY}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill={GRID_BG_COLOR}
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.1}
        shadowOffsetX={0}
        shadowOffsetY={4}
      />

      {/* Inner grid lines */}
      {lines}

      {/* Border */}
      <Rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        stroke={GRID_BORDER_COLOR}
        strokeWidth={GRID_BORDER_WIDTH}
      />
    </Group>
  );
}
