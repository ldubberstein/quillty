'use client';

import { Group, Line } from 'react-konva';
import { getQstTriangles, triangleToFlatPoints } from '@quillty/core';
import type { QstShape, Palette, QstPartId } from '@quillty/core';

interface QstRendererProps {
  /** The QST shape to render */
  shape: QstShape;
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
  /** Callback when a triangle part is clicked */
  onClick?: (partId: QstPartId) => void;
}

/**
 * QstRenderer - Renders a quarter-square triangle shape on the canvas
 *
 * Uses four Konva Line elements (filled polygons) to render the four
 * triangles with their respective colors from the palette.
 */
export function QstRenderer({
  shape,
  cellSize,
  offsetX,
  offsetY,
  palette,
  isSelected = false,
  onClick,
}: QstRendererProps) {
  // Get colors from palette for all four fabric roles
  const topRole = palette.roles.find((r) => r.id === shape.partFabricRoles.top);
  const rightRole = palette.roles.find((r) => r.id === shape.partFabricRoles.right);
  const bottomRole = palette.roles.find((r) => r.id === shape.partFabricRoles.bottom);
  const leftRole = palette.roles.find((r) => r.id === shape.partFabricRoles.left);

  const topColor = topRole?.color ?? '#CCCCCC';
  const rightColor = rightRole?.color ?? '#FFFFFF';
  const bottomColor = bottomRole?.color ?? '#CCCCCC';
  const leftColor = leftRole?.color ?? '#FFFFFF';

  // Calculate pixel position
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;

  // Small padding to show grid lines
  const padding = 1;
  const size = cellSize - padding * 2;

  // Get triangle geometry
  const triangles = getQstTriangles(size, size);
  const topPoints = triangleToFlatPoints(triangles.top);
  const rightPoints = triangleToFlatPoints(triangles.right);
  const bottomPoints = triangleToFlatPoints(triangles.bottom);
  const leftPoints = triangleToFlatPoints(triangles.left);

  // Click handlers for individual triangles
  const handleTopClick = onClick ? () => onClick('top') : undefined;
  const handleRightClick = onClick ? () => onClick('right') : undefined;
  const handleBottomClick = onClick ? () => onClick('bottom') : undefined;
  const handleLeftClick = onClick ? () => onClick('left') : undefined;

  // Darker gray outline to make shapes distinct from grid lines
  const outlineColor = '#9CA3AF'; // gray-400

  return (
    <Group x={x + padding} y={y + padding}>
      {/* Top triangle */}
      <Line
        points={topPoints}
        fill={topColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleTopClick}
        onTap={handleTopClick}
      />

      {/* Right triangle */}
      <Line
        points={rightPoints}
        fill={rightColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleRightClick}
        onTap={handleRightClick}
      />

      {/* Bottom triangle */}
      <Line
        points={bottomPoints}
        fill={bottomColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleBottomClick}
        onTap={handleBottomClick}
      />

      {/* Left triangle */}
      <Line
        points={leftPoints}
        fill={leftColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleLeftClick}
        onTap={handleLeftClick}
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
