'use client';

import { useMemo } from 'react';
import { Group, Rect, Line } from 'react-konva';
import type {
  BlockInstance,
  Palette,
  PaletteOverrides,
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

/**
 * Helper to get color for a fabric role
 * Checks instance overrides first, then falls back to pattern palette
 */
function getColor(
  palette: Palette,
  roleId: string,
  instanceOverrides?: PaletteOverrides
): string {
  // Check instance override first
  if (instanceOverrides?.[roleId]) {
    return instanceOverrides[roleId];
  }
  // Fall back to pattern palette
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}

/** Render a square shape */
function renderSquare(
  shape: SquareShape,
  unitSize: number,
  palette: Palette,
  instanceOverrides?: PaletteOverrides
): JSX.Element {
  const color = getColor(palette, shape.fabricRole, instanceOverrides);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;

  return (
    <Rect
      key={shape.id}
      x={x}
      y={y}
      width={unitSize}
      height={unitSize}
      fill={color}
      listening={false}
    />
  );
}

/** Render an HST shape */
function renderHst(
  shape: HstShape,
  unitSize: number,
  palette: Palette,
  instanceOverrides?: PaletteOverrides
): JSX.Element {
  const primaryColor = getColor(palette, shape.fabricRole, instanceOverrides);
  const secondaryColor = getColor(palette, shape.secondaryFabricRole, instanceOverrides);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;

  // Triangle points based on variant (no padding for seamless appearance)
  let primaryPoints: number[];
  let secondaryPoints: number[];

  switch (shape.variant) {
    case 'nw':
      primaryPoints = [0, 0, unitSize, 0, 0, unitSize];
      secondaryPoints = [unitSize, 0, unitSize, unitSize, 0, unitSize];
      break;
    case 'ne':
      primaryPoints = [0, 0, unitSize, 0, unitSize, unitSize];
      secondaryPoints = [0, 0, 0, unitSize, unitSize, unitSize];
      break;
    case 'sw':
      primaryPoints = [0, 0, 0, unitSize, unitSize, unitSize];
      secondaryPoints = [0, 0, unitSize, 0, unitSize, unitSize];
      break;
    case 'se':
      primaryPoints = [unitSize, 0, unitSize, unitSize, 0, unitSize];
      secondaryPoints = [0, 0, unitSize, 0, 0, unitSize];
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
  unitSize: number,
  palette: Palette,
  instanceOverrides?: PaletteOverrides
): JSX.Element {
  const gooseColor = getColor(palette, shape.partFabricRoles.goose, instanceOverrides);
  const sky1Color = getColor(palette, shape.partFabricRoles.sky1, instanceOverrides);
  const sky2Color = getColor(palette, shape.partFabricRoles.sky2, instanceOverrides);
  const x = shape.position.col * unitSize;
  const y = shape.position.row * unitSize;

  const isHorizontal = shape.span.cols === 2;
  const width = isHorizontal ? unitSize * 2 : unitSize;
  const height = isHorizontal ? unitSize : unitSize * 2;

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

  // Check if this instance has color overrides
  const hasOverrides = instance.paletteOverrides && Object.keys(instance.paletteOverrides).length > 0;

  // Render all shapes
  const renderedShapes = useMemo(() => {
    return shapes.map((shape) => {
      switch (shape.type) {
        case 'square':
          return renderSquare(shape as SquareShape, unitSize, palette, instance.paletteOverrides);
        case 'hst':
          return renderHst(shape as HstShape, unitSize, palette, instance.paletteOverrides);
        case 'flying_geese':
          return renderFlyingGeese(shape as FlyingGeeseShape, unitSize, palette, instance.paletteOverrides);
        default:
          return null;
      }
    });
  }, [shapes, unitSize, palette, instance.paletteOverrides]);

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

      {/* Override indicator - purple dot for blocks with custom colors */}
      {hasOverrides && (
        <Group x={cellSize - 12} y={4} listening={false}>
          <Rect
            width={8}
            height={8}
            fill="#8B5CF6"
            cornerRadius={4}
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        </Group>
      )}
    </Group>
  );
}
