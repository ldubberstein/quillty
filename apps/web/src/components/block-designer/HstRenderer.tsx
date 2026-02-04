'use client';

import { Group, Line } from 'react-konva';
import { getHstTriangles, triangleToFlatPoints } from '@quillty/core';
import type { HstShape, Palette } from '@quillty/core';

interface HstRendererProps {
  /** The HST shape to render */
  shape: HstShape;
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
  /** Callback when a triangle part is clicked ('primary' or 'secondary') */
  onClick?: (partId: 'primary' | 'secondary') => void;
}

/**
 * HstRenderer - Renders a half-square triangle shape on the canvas
 *
 * Uses two Konva Line elements (filled polygons) to render the primary
 * and secondary triangles with their respective colors from the palette.
 */
export function HstRenderer({
  shape,
  cellSize,
  offsetX,
  offsetY,
  palette,
  isSelected = false,
  onClick,
}: HstRendererProps) {
  // Get colors from palette for both fabric roles
  const primaryRole = palette.roles.find((r) => r.id === shape.fabricRole);
  const secondaryRole = palette.roles.find((r) => r.id === shape.secondaryFabricRole);
  const primaryColor = primaryRole?.color ?? '#CCCCCC';
  const secondaryColor = secondaryRole?.color ?? '#FFFFFF';

  // Calculate pixel position
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;

  // Small padding to show grid lines
  const padding = 1;
  const size = cellSize - padding * 2;

  // Get triangle geometry for this variant
  const triangles = getHstTriangles(shape.variant, size, size);
  const primaryPoints = triangleToFlatPoints(triangles.primary);
  const secondaryPoints = triangleToFlatPoints(triangles.secondary);

  // Click handlers for individual triangles
  const handlePrimaryClick = onClick ? () => onClick('primary') : undefined;
  const handleSecondaryClick = onClick ? () => onClick('secondary') : undefined;

  // Darker gray outline to make shapes distinct from grid lines
  const outlineColor = '#9CA3AF'; // gray-400

  return (
    <Group x={x + padding} y={y + padding}>
      {/* Secondary triangle (background) - rendered first */}
      <Line
        points={secondaryPoints}
        fill={secondaryColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleSecondaryClick}
        onTap={handleSecondaryClick}
      />

      {/* Primary triangle (foreground) - rendered on top */}
      <Line
        points={primaryPoints}
        fill={primaryColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handlePrimaryClick}
        onTap={handlePrimaryClick}
      />

      {/* Selection overlay */}
      {isSelected && (
        <Line
          points={[0, 0, size, 0, size, size, 0, size]}
          closed
          stroke="#3B82F6"
          strokeWidth={3}
          fill="transparent"
          shadowColor="#3B82F6"
          shadowBlur={8}
          shadowOpacity={0.5}
        />
      )}
    </Group>
  );
}
