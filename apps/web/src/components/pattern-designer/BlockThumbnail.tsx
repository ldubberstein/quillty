'use client';

import { useMemo } from 'react';
import { Stage, Layer, Rect, Line, Group } from 'react-konva';
import type { Palette, Shape, SquareShape, HstShape, FlyingGeeseShape, QstShape } from '@quillty/core';

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

  return (
    <Rect
      key={shape.id}
      x={x}
      y={y}
      width={cellSize}
      height={cellSize}
      fill={color}
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

  // Triangle points based on variant (no padding for seamless appearance)
  let primaryPoints: number[];
  let secondaryPoints: number[];

  switch (shape.variant) {
    case 'nw':
      primaryPoints = [0, 0, cellSize, 0, 0, cellSize];
      secondaryPoints = [cellSize, 0, cellSize, cellSize, 0, cellSize];
      break;
    case 'ne':
      primaryPoints = [0, 0, cellSize, 0, cellSize, cellSize];
      secondaryPoints = [0, 0, 0, cellSize, cellSize, cellSize];
      break;
    case 'sw':
      primaryPoints = [0, 0, 0, cellSize, cellSize, cellSize];
      secondaryPoints = [0, 0, cellSize, 0, cellSize, cellSize];
      break;
    case 'se':
      primaryPoints = [cellSize, 0, cellSize, cellSize, 0, cellSize];
      secondaryPoints = [0, 0, cellSize, 0, 0, cellSize];
      break;
  }

  return (
    <Group key={shape.id} x={x} y={y} listening={false}>
      <Line points={secondaryPoints} fill={secondaryColor} closed />
      <Line points={primaryPoints} fill={primaryColor} closed />
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

  const isHorizontal = shape.span.cols === 2;
  const width = isHorizontal ? cellSize * 2 : cellSize;
  const height = isHorizontal ? cellSize : cellSize * 2;

  let goosePoints: number[];
  let sky1Points: number[];
  let sky2Points: number[];

  // No padding for seamless appearance
  switch (shape.direction) {
    case 'up':
      goosePoints = [width / 2, 0, 0, height, width, height];
      sky1Points = [0, 0, width / 2, 0, 0, height];
      sky2Points = [width / 2, 0, width, 0, width, height];
      break;
    case 'down':
      goosePoints = [width / 2, height, 0, 0, width, 0];
      sky1Points = [0, 0, 0, height, width / 2, height];
      sky2Points = [width, 0, width, height, width / 2, height];
      break;
    case 'left':
      goosePoints = [0, height / 2, width, 0, width, height];
      sky1Points = [0, 0, width, 0, 0, height / 2];
      sky2Points = [0, height / 2, width, height, 0, height];
      break;
    case 'right':
      goosePoints = [width, height / 2, 0, 0, 0, height];
      sky1Points = [0, 0, width, 0, width, height / 2];
      sky2Points = [0, height, width, height, width, height / 2];
      break;
  }

  return (
    <Group key={shape.id} x={x} y={y} listening={false}>
      <Line points={sky1Points} fill={sky1Color} closed />
      <Line points={sky2Points} fill={sky2Color} closed />
      <Line points={goosePoints} fill={gooseColor} closed />
    </Group>
  );
}

/** Render a QST (Quarter-Square Triangle) shape */
function renderQst(
  shape: QstShape,
  cellSize: number,
  palette: Palette,
  offsetX: number,
  offsetY: number
) {
  const topColor = getColor(palette, shape.partFabricRoles.top);
  const rightColor = getColor(palette, shape.partFabricRoles.right);
  const bottomColor = getColor(palette, shape.partFabricRoles.bottom);
  const leftColor = getColor(palette, shape.partFabricRoles.left);
  const x = offsetX + shape.position.col * cellSize;
  const y = offsetY + shape.position.row * cellSize;

  // Center point
  const cx = cellSize / 2;
  const cy = cellSize / 2;

  // Triangle points for each quarter (no padding for seamless appearance)
  const topPoints = [0, 0, cellSize, 0, cx, cy];
  const rightPoints = [cellSize, 0, cellSize, cellSize, cx, cy];
  const bottomPoints = [cellSize, cellSize, 0, cellSize, cx, cy];
  const leftPoints = [0, cellSize, 0, 0, cx, cy];

  return (
    <Group key={shape.id} x={x} y={y} listening={false}>
      <Line points={topPoints} fill={topColor} closed />
      <Line points={rightPoints} fill={rightColor} closed />
      <Line points={bottomPoints} fill={bottomColor} closed />
      <Line points={leftPoints} fill={leftColor} closed />
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
        case 'qst':
          return renderQst(shape as QstShape, cellSize, palette, 0, 0);
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
