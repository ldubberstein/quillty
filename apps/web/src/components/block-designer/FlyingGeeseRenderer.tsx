'use client';

import { Group, Line } from 'react-konva';
import { getFlyingGeeseTriangles, triangleToFlatPoints } from '@quillty/core';
import type { FlyingGeeseShape, FlyingGeesePartId, Palette } from '@quillty/core';

interface FlyingGeeseRendererProps {
  /** The Flying Geese shape to render */
  shape: FlyingGeeseShape;
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
  onClick?: (partId: FlyingGeesePartId) => void;
}

/**
 * FlyingGeeseRenderer - Renders a Flying Geese shape on the canvas
 *
 * Flying Geese spans 2 cells and consists of:
 * - A center triangle (the "goose") - uses primary fabric role
 * - Two side triangles (the "sky") - uses secondary fabric role
 */
export function FlyingGeeseRenderer({
  shape,
  cellSize,
  offsetX,
  offsetY,
  palette,
  isSelected = false,
  onClick,
}: FlyingGeeseRendererProps) {
  // Get colors from palette for each part's fabric role
  const gooseRole = palette.roles.find((r) => r.id === shape.partFabricRoles.goose);
  const sky1Role = palette.roles.find((r) => r.id === shape.partFabricRoles.sky1);
  const sky2Role = palette.roles.find((r) => r.id === shape.partFabricRoles.sky2);
  const gooseColor = gooseRole?.color ?? '#CCCCCC';
  const sky1Color = sky1Role?.color ?? '#FFFFFF';
  const sky2Color = sky2Role?.color ?? '#FFFFFF';

  // Calculate pixel position
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;

  // Small padding to show grid lines
  const padding = 1;

  // Calculate total size based on span (2 cells in one direction)
  const isHorizontal = shape.span.cols === 2;
  const totalWidth = (isHorizontal ? 2 : 1) * cellSize - padding * 2;
  const totalHeight = (isHorizontal ? 1 : 2) * cellSize - padding * 2;

  // Get triangle geometry for this direction
  const triangles = getFlyingGeeseTriangles(shape.direction, totalWidth, totalHeight);
  const goosePoints = triangleToFlatPoints(triangles.goose);
  const sky1Points = triangleToFlatPoints(triangles.sky1);
  const sky2Points = triangleToFlatPoints(triangles.sky2);

  // Click handlers for individual triangles (each part independently)
  const handleGooseClick = onClick ? () => onClick('goose') : undefined;
  const handleSky1Click = onClick ? () => onClick('sky1') : undefined;
  const handleSky2Click = onClick ? () => onClick('sky2') : undefined;

  // Light gray outline to make shapes visible even when same color as background
  const outlineColor = '#D1D5DB';

  return (
    <Group x={x + padding} y={y + padding}>
      {/* Sky triangles - each independently colorable */}
      <Line
        points={sky1Points}
        fill={sky1Color}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleSky1Click}
        onTap={handleSky1Click}
      />
      <Line
        points={sky2Points}
        fill={sky2Color}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleSky2Click}
        onTap={handleSky2Click}
      />

      {/* Goose triangle (foreground) - rendered on top */}
      <Line
        points={goosePoints}
        fill={gooseColor}
        stroke={outlineColor}
        strokeWidth={1}
        closed
        onClick={handleGooseClick}
        onTap={handleGooseClick}
      />

      {/* Selection overlay */}
      {isSelected && (
        <Line
          points={[0, 0, totalWidth, 0, totalWidth, totalHeight, 0, totalHeight]}
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
