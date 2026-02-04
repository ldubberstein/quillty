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

/** Checkerboard pattern for empty cells (Photoshop-style transparency indicator) */
const CHECKER_SIZE = 10; // Size of each checker square in pixels
const CHECKER_COLOR_1 = '#FFFFFF'; // White
const CHECKER_COLOR_2 = '#F3F4F6'; // Very light gray (gray-100)

/**
 * Generate checkerboard pattern rectangles
 * Creates a Photoshop-style transparency indicator pattern
 */
function generateCheckerboard(totalSize: number): JSX.Element[] {
  const checkers: JSX.Element[] = [];
  const count = Math.ceil(totalSize / CHECKER_SIZE);

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const isEven = (row + col) % 2 === 0;
      const color = isEven ? CHECKER_COLOR_1 : CHECKER_COLOR_2;

      // Calculate actual size (clip to totalSize bounds)
      const x = col * CHECKER_SIZE;
      const y = row * CHECKER_SIZE;
      const width = Math.min(CHECKER_SIZE, totalSize - x);
      const height = Math.min(CHECKER_SIZE, totalSize - y);

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

export function GridLines({ gridSize, cellSize, offsetX, offsetY }: GridLinesProps) {
  const totalSize = gridSize * cellSize;

  // Generate checkerboard pattern
  const checkerboard = generateCheckerboard(totalSize);

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
      {/* Shadow layer (separate to avoid clipping checkerboard) */}
      <Rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill="transparent"
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.1}
        shadowOffsetX={0}
        shadowOffsetY={4}
      />

      {/* Checkerboard pattern background */}
      <Group clipX={0} clipY={0} clipWidth={totalSize} clipHeight={totalSize}>
        {checkerboard}
      </Group>

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
