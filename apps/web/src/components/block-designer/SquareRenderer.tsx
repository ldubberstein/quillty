'use client';

import { Rect } from 'react-konva';
import type { SquareUnit, Palette } from '@quillty/core';

interface SquareRendererProps {
  /** The square unit to render */
  unit: SquareUnit;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset for the grid */
  offsetX: number;
  /** Y offset for the grid */
  offsetY: number;
  /** Palette for resolving fabric role colors */
  palette: Palette;
  /** Whether this unit is selected */
  isSelected?: boolean;
  /** Callback when unit is clicked */
  onClick?: () => void;
}

/**
 * SquareRenderer - Renders a square unit on the canvas
 *
 * Renders a filled rectangle at the unit's grid position using the
 * color from the palette for the unit's fabric role.
 */
export function SquareRenderer({
  unit,
  cellSize,
  offsetX,
  offsetY,
  palette,
  isSelected = false,
  onClick,
}: SquareRendererProps) {
  // Get color from palette for the fabric role
  const role = palette.roles.find((r) => r.id === unit.fabricRole);
  const fillColor = role?.color ?? '#CCCCCC';

  // Calculate pixel position
  const x = offsetX + unit.position.col * cellSize;
  const y = offsetY + unit.position.row * cellSize;

  // Small padding to show grid lines
  const padding = 1;
  const size = cellSize - padding * 2;

  // Darker gray outline to make shapes distinct from grid lines
  const outlineColor = '#9CA3AF'; // gray-400

  return (
    <Rect
      x={x + padding}
      y={y + padding}
      width={size}
      height={size}
      fill={fillColor}
      stroke={isSelected ? '#3B82F6' : outlineColor}
      strokeWidth={isSelected ? 3 : 1}
      onClick={onClick}
      onTap={onClick}
      // Make the shape feel interactive
      shadowColor={isSelected ? '#3B82F6' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={isSelected ? 0.5 : 0}
    />
  );
}
