'use client';

import { Rect } from 'react-konva';
import type { SquareShape, Palette } from '@quillty/core';

interface SquareRendererProps {
  /** The square shape to render */
  shape: SquareShape;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset for the grid */
  offsetX: number;
  /** Y offset for the grid */
  offsetY: number;
  /** Palette for resolving fabric role colors */
  palette: Palette;
  /** Whether this shape is selected */
  isSelected?: boolean;
  /** Callback when shape is clicked */
  onClick?: () => void;
}

/**
 * SquareRenderer - Renders a square shape on the canvas
 *
 * Renders a filled rectangle at the shape's grid position using the
 * color from the palette for the shape's fabric role.
 */
export function SquareRenderer({
  shape,
  cellSize,
  offsetX,
  offsetY,
  palette,
  isSelected = false,
  onClick,
}: SquareRendererProps) {
  // Get color from palette for the fabric role
  const role = palette.roles.find((r) => r.id === shape.fabricRole);
  const fillColor = role?.color ?? '#CCCCCC';

  // Calculate pixel position
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;

  // Small padding to show grid lines
  const padding = 1;
  const size = cellSize - padding * 2;

  return (
    <Rect
      x={x + padding}
      y={y + padding}
      width={size}
      height={size}
      fill={fillColor}
      stroke={isSelected ? '#3B82F6' : undefined}
      strokeWidth={isSelected ? 3 : 0}
      onClick={onClick}
      onTap={onClick}
      // Make the shape feel interactive
      shadowColor={isSelected ? '#3B82F6' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={isSelected ? 0.5 : 0}
    />
  );
}
