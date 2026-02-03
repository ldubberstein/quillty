'use client';

import { Group, Line } from 'react-konva';
import { getFlyingGeeseTriangles, triangleToFlatPoints } from '@quillty/core';
import type { FlyingGeeseShape, Palette } from '@quillty/core';

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
  /** Callback when a triangle is clicked. isSecondary=true for sky triangles. */
  onClick?: (isSecondary: boolean) => void;
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
  // Get colors from palette for both fabric roles
  const gooseRole = palette.roles.find((r) => r.id === shape.fabricRole);
  const skyRole = palette.roles.find((r) => r.id === shape.secondaryFabricRole);
  const gooseColor = gooseRole?.color ?? '#CCCCCC';
  const skyColor = skyRole?.color ?? '#FFFFFF';

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

  // Click handlers for individual triangles
  const handleGooseClick = onClick ? () => onClick(false) : undefined;
  const handleSkyClick = onClick ? () => onClick(true) : undefined;

  return (
    <Group x={x + padding} y={y + padding}>
      {/* Sky triangles (background) - rendered first */}
      <Line
        points={sky1Points}
        fill={skyColor}
        closed
        onClick={handleSkyClick}
        onTap={handleSkyClick}
      />
      <Line
        points={sky2Points}
        fill={skyColor}
        closed
        onClick={handleSkyClick}
        onTap={handleSkyClick}
      />

      {/* Goose triangle (foreground) - rendered on top */}
      <Line
        points={goosePoints}
        fill={gooseColor}
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
