'use client';

import { useMemo } from 'react';
import { Stage, Layer, Rect, Line, Group } from 'react-konva';
import type { Palette, Shape, SquareShape, HstShape, FlyingGeeseShape } from '@quillty/core';

interface BlockThumbnailProps {
  /** Block's design data containing shapes */
  shapes: Shape[];
  /** Block's grid size (2, 3, or 4) */
  gridSize: number;
  /** Palette to use for rendering (pattern's palette) */
  palette: Palette;
  /** Size of the thumbnail in pixels */
  size?: number;
  /** Whether this block is selected in the library */
  isSelected?: boolean;
  /** Callback when thumbnail is clicked */
  onClick?: () => void;
}

/** Helper to get color for a fabric role from palette */
function getColor(palette: Palette, roleId: string): string {
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}

/** Render a square shape */
function renderSquare(
  shape: SquareShape,
  cellSize: number,
  palette: Palette,
  offsetX: number,
  offsetY: number
) {
  const color = getColor(palette, shape.fabricRole);
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;
  const padding = 0.5;

  return (
    <Rect
      key={shape.id}
      x={x + padding}
      y={y + padding}
      width={cellSize - padding * 2}
      height={cellSize - padding * 2}
      fill={color}
      stroke="#9CA3AF"
      strokeWidth={0.5}
      listening={false}
    />
  );
}

/** Render an HST shape */
function renderHst(
  shape: HstShape,
  cellSize: number,
  palette: Palette,
  offsetX: number,
  offsetY: number
) {
  const primaryColor = getColor(palette, shape.fabricRole);
  const secondaryColor = getColor(palette, shape.secondaryFabricRole);
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;
  const padding = 0.5;

  // Triangle points based on variant
  let primaryPoints: number[];
  let secondaryPoints: number[];

  switch (shape.variant) {
    case 'nw':
      primaryPoints = [padding, padding, cellSize - padding, padding, padding, cellSize - padding];
      secondaryPoints = [cellSize - padding, padding, cellSize - padding, cellSize - padding, padding, cellSize - padding];
      break;
    case 'ne':
      primaryPoints = [padding, padding, cellSize - padding, padding, cellSize - padding, cellSize - padding];
      secondaryPoints = [padding, padding, padding, cellSize - padding, cellSize - padding, cellSize - padding];
      break;
    case 'sw':
      primaryPoints = [padding, padding, padding, cellSize - padding, cellSize - padding, cellSize - padding];
      secondaryPoints = [padding, padding, cellSize - padding, padding, cellSize - padding, cellSize - padding];
      break;
    case 'se':
      primaryPoints = [cellSize - padding, padding, cellSize - padding, cellSize - padding, padding, cellSize - padding];
      secondaryPoints = [padding, padding, cellSize - padding, padding, padding, cellSize - padding];
      break;
  }

  return (
    <Group key={shape.id} x={x} y={y} listening={false}>
      <Line points={secondaryPoints} fill={secondaryColor} closed stroke="#9CA3AF" strokeWidth={0.5} />
      <Line points={primaryPoints} fill={primaryColor} closed stroke="#9CA3AF" strokeWidth={0.5} />
    </Group>
  );
}

/** Render a Flying Geese shape */
function renderFlyingGeese(
  shape: FlyingGeeseShape,
  cellSize: number,
  palette: Palette,
  offsetX: number,
  offsetY: number
) {
  const gooseColor = getColor(palette, shape.partFabricRoles.goose);
  const sky1Color = getColor(palette, shape.partFabricRoles.sky1);
  const sky2Color = getColor(palette, shape.partFabricRoles.sky2);
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;
  const padding = 0.5;

  const isHorizontal = shape.span.cols === 2;
  const width = isHorizontal ? cellSize * 2 : cellSize;
  const height = isHorizontal ? cellSize : cellSize * 2;

  let goosePoints: number[];
  let sky1Points: number[];
  let sky2Points: number[];

  switch (shape.direction) {
    case 'up':
      goosePoints = [width / 2, padding, padding, height - padding, width - padding, height - padding];
      sky1Points = [padding, padding, width / 2, padding, padding, height - padding];
      sky2Points = [width / 2, padding, width - padding, padding, width - padding, height - padding];
      break;
    case 'down':
      goosePoints = [width / 2, height - padding, padding, padding, width - padding, padding];
      sky1Points = [padding, padding, padding, height - padding, width / 2, height - padding];
      sky2Points = [width - padding, padding, width - padding, height - padding, width / 2, height - padding];
      break;
    case 'left':
      goosePoints = [padding, height / 2, width - padding, padding, width - padding, height - padding];
      sky1Points = [padding, padding, width - padding, padding, padding, height / 2];
      sky2Points = [padding, height / 2, width - padding, height - padding, padding, height - padding];
      break;
    case 'right':
      goosePoints = [width - padding, height / 2, padding, padding, padding, height - padding];
      sky1Points = [padding, padding, width - padding, padding, width - padding, height / 2];
      sky2Points = [padding, height - padding, width - padding, height - padding, width - padding, height / 2];
      break;
  }

  return (
    <Group key={shape.id} x={x} y={y} listening={false}>
      <Line points={sky1Points} fill={sky1Color} closed stroke="#9CA3AF" strokeWidth={0.5} />
      <Line points={sky2Points} fill={sky2Color} closed stroke="#9CA3AF" strokeWidth={0.5} />
      <Line points={goosePoints} fill={gooseColor} closed stroke="#9CA3AF" strokeWidth={0.5} />
    </Group>
  );
}

export function BlockThumbnail({
  shapes,
  gridSize,
  palette,
  size = 80,
  isSelected = false,
  onClick,
}: BlockThumbnailProps) {
  const cellSize = size / gridSize;

  // Memoize rendered shapes
  const renderedShapes = useMemo(() => {
    return shapes.map((shape) => {
      switch (shape.type) {
        case 'square':
          return renderSquare(shape as SquareShape, cellSize, palette, 0, 0);
        case 'hst':
          return renderHst(shape as HstShape, cellSize, palette, 0, 0);
        case 'flying_geese':
          return renderFlyingGeese(shape as FlyingGeeseShape, cellSize, palette, 0, 0);
        default:
          return null;
      }
    });
  }, [shapes, cellSize, palette]);

  return (
    <div
      className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
          : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Stage width={size} height={size}>
        <Layer>
          {/* Background */}
          <Rect x={0} y={0} width={size} height={size} fill="#F5F5F4" listening={false} />
          {/* Shapes */}
          {renderedShapes}
        </Layer>
      </Stage>
    </div>
  );
}
