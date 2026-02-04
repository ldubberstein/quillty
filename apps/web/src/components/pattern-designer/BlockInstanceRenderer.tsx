'use client';

import { useMemo } from 'react';
import { Group, Rect, Line } from 'react-konva';
import type {
  BlockInstance,
  Palette,
  Shape,
  SquareShape,
  HstShape,
  FlyingGeeseShape,
} from '@quillty/core';

interface BlockInstanceRendererProps {
  /** The block instance to render */
  instance: BlockInstance;
  /** The block's shapes (from cached block data) */
  shapes: Shape[];
  /** Block's grid size (2, 3, or 4) */
  blockGridSize: number;
  /** Pattern's palette for colors */
  palette: Palette;
  /** Size of each cell in the pattern grid (in pixels) */
  cellSize: number;
  /** X offset for the pattern grid */
  offsetX: number;
  /** Y offset for the pattern grid */
  offsetY: number;
  /** Whether this instance is selected */
  isSelected?: boolean;
  /** Callback when instance is clicked */
  onClick?: (instanceId: string) => void;
}

/** Helper to get color for a fabric role from palette */
function getColor(palette: Palette, roleId: string): string {
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}

/** Render a square shape */
function renderSquare(
  shape: SquareShape,
  unitSize: number,
  palette: Palette
): JSX.Element {
  const color = getColor(palette, shape.fabricRole);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;
  const padding = 0.5;

  return (
    <Rect
      key={shape.id}
      x={x + padding}
      y={y + padding}
      width={unitSize - padding * 2}
      height={unitSize - padding * 2}
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
  unitSize: number,
  palette: Palette
): JSX.Element {
  const primaryColor = getColor(palette, shape.fabricRole);
  const secondaryColor = getColor(palette, shape.secondaryFabricRole);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;
  const padding = 0.5;

  let primaryPoints: number[];
  let secondaryPoints: number[];

  switch (shape.variant) {
    case 'nw':
      primaryPoints = [padding, padding, unitSize - padding, padding, padding, unitSize - padding];
      secondaryPoints = [unitSize - padding, padding, unitSize - padding, unitSize - padding, padding, unitSize - padding];
      break;
    case 'ne':
      primaryPoints = [padding, padding, unitSize - padding, padding, unitSize - padding, unitSize - padding];
      secondaryPoints = [padding, padding, padding, unitSize - padding, unitSize - padding, unitSize - padding];
      break;
    case 'sw':
      primaryPoints = [padding, padding, padding, unitSize - padding, unitSize - padding, unitSize - padding];
      secondaryPoints = [padding, padding, unitSize - padding, padding, unitSize - padding, unitSize - padding];
      break;
    case 'se':
      primaryPoints = [unitSize - padding, padding, unitSize - padding, unitSize - padding, padding, unitSize - padding];
      secondaryPoints = [padding, padding, unitSize - padding, padding, padding, unitSize - padding];
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
  unitSize: number,
  palette: Palette
): JSX.Element {
  const gooseColor = getColor(palette, shape.partFabricRoles.goose);
  const sky1Color = getColor(palette, shape.partFabricRoles.sky1);
  const sky2Color = getColor(palette, shape.partFabricRoles.sky2);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;
  const padding = 0.5;

  const isHorizontal = shape.span.cols === 2;
  const width = isHorizontal ? unitSize * 2 : unitSize;
  const height = isHorizontal ? unitSize : unitSize * 2;

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

/**
 * BlockInstanceRenderer - Renders a placed block instance on the pattern canvas
 *
 * Handles:
 * - Positioning within the pattern grid
 * - Rotation (0, 90, 180, 270 degrees)
 * - Horizontal and vertical flipping
 * - Selection highlight
 */
export function BlockInstanceRenderer({
  instance,
  shapes,
  blockGridSize,
  palette,
  cellSize,
  offsetX,
  offsetY,
  isSelected = false,
  onClick,
}: BlockInstanceRendererProps) {
  // Calculate the position of this block instance on the canvas
  const blockX = offsetX + instance.position.col * cellSize;
  const blockY = offsetY + instance.position.row * cellSize;

  // Size of each shape unit within the block
  const unitSize = cellSize / blockGridSize;

  // Apply transformations: rotation and flip
  // Konva uses rotation in degrees, centered on the group
  const rotation = instance.rotation;
  const scaleX = instance.flipHorizontal ? -1 : 1;
  const scaleY = instance.flipVertical ? -1 : 1;

  // When rotating/flipping, we need to adjust the offset to keep the block in place
  // The transform origin is at (0, 0) by default, so we offset to the center
  const transformOffsetX = cellSize / 2;
  const transformOffsetY = cellSize / 2;

  // Render all shapes
  const renderedShapes = useMemo(() => {
    return shapes.map((shape) => {
      switch (shape.type) {
        case 'square':
          return renderSquare(shape as SquareShape, unitSize, palette);
        case 'hst':
          return renderHst(shape as HstShape, unitSize, palette);
        case 'flying_geese':
          return renderFlyingGeese(shape as FlyingGeeseShape, unitSize, palette);
        default:
          return null;
      }
    });
  }, [shapes, unitSize, palette]);

  const handleClick = () => {
    onClick?.(instance.id);
  };

  return (
    <Group
      x={blockX + transformOffsetX}
      y={blockY + transformOffsetY}
      offsetX={transformOffsetX}
      offsetY={transformOffsetY}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Background for the block cell */}
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill="#FAFAFA"
        listening={true}
      />

      {/* Render shapes */}
      {renderedShapes}

      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={cellSize}
          height={cellSize}
          stroke="#3B82F6"
          strokeWidth={3}
          fill="transparent"
          listening={false}
        />
      )}
    </Group>
  );
}
