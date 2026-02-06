'use client';

import { useMemo } from 'react';
import { Stage, Layer, Rect, Line, Group } from 'react-konva';
import type { Palette, Unit } from '@quillty/core';
import { getUnitTrianglesWithColors } from '@quillty/core';

interface BlockThumbnailProps {
  /** Block's design data containing units */
  units: Unit[];
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

/** Render a single unit using the registry-driven triangle renderer */
function renderUnitGeneric(
  unit: Unit,
  cellSize: number,
  palette: Palette,
  offsetX: number,
  offsetY: number
): JSX.Element {
  const triangles = getUnitTrianglesWithColors(unit, cellSize, palette);
  const x = offsetX + unit.position.col * cellSize;
  const y = offsetY + unit.position.row * cellSize;

  return (
    <Group key={unit.id} x={x} y={y} listening={false}>
      {triangles.map((tri, i) => (
        <Line key={i} points={tri.points} fill={tri.color} closed />
      ))}
    </Group>
  );
}

export function BlockThumbnail({
  units,
  gridSize,
  palette,
  size = 80,
  isSelected = false,
  onClick,
}: BlockThumbnailProps) {
  const cellSize = size / gridSize;

  // Memoize rendered units using registry-driven generic renderer
  const renderedUnits = useMemo(() => {
    return units.map((unit) => renderUnitGeneric(unit, cellSize, palette, 0, 0));
  }, [units, cellSize, palette]);

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
          {/* Units */}
          {renderedUnits}
        </Layer>
      </Stage>
    </div>
  );
}
