'use client';

import { useMemo } from 'react';
import { Group, Rect, Line } from 'react-konva';
import type {
  BlockInstance,
  Palette,
  PaletteOverrides,
  Unit,
} from '@quillty/core';
import { getUnitTrianglesWithColors } from '@quillty/core';

interface BlockInstanceRendererProps {
  /** The block instance to render */
  instance: BlockInstance;
  /** The block's units (from cached block data) */
  units: Unit[];
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

/** Render a single unit using the registry-driven triangle renderer */
function renderUnitGeneric(
  unit: Unit,
  unitSize: number,
  palette: Palette,
  instanceOverrides?: PaletteOverrides
): JSX.Element {
  const triangles = getUnitTrianglesWithColors(unit, unitSize, palette, instanceOverrides);
  const x = unit.position.col * unitSize;
  const y = unit.position.row * unitSize;

  return (
    <Group key={unit.id} x={x} y={y} listening={false}>
      {triangles.map((tri, i) => (
        <Line key={i} points={tri.points} fill={tri.color} closed />
      ))}
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
  units,
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

  // Size of each unit within the block
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

  // Render all units using registry-driven generic renderer
  const renderedUnits = useMemo(() => {
    return units.map((unit) => renderUnitGeneric(unit, unitSize, palette, instance.paletteOverrides));
  }, [units, unitSize, palette, instance.paletteOverrides]);

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

      {/* Render units */}
      {renderedUnits}

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
