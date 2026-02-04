'use client';

import { Rect, Group, Line } from 'react-konva';
import { useCallback } from 'react';

interface EmptySlotProps {
  /** Row position in grid */
  row: number;
  /** Column position in grid */
  col: number;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset for the grid */
  offsetX: number;
  /** Y offset for the grid */
  offsetY: number;
  /** Whether this slot is highlighted (e.g., during placement) */
  isHighlighted?: boolean;
  /** Called when slot is clicked/tapped */
  onClick?: (row: number, col: number) => void;
}

export function EmptySlot({
  row,
  col,
  cellSize,
  offsetX,
  offsetY,
  isHighlighted = false,
  onClick,
}: EmptySlotProps) {
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;

  const handleClick = useCallback(() => {
    onClick?.(row, col);
  }, [onClick, row, col]);

  return (
    <Group x={x} y={y}>
      {/* Click target - full cell, edge-to-edge (no gaps, no rounded corners) */}
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill={isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent'}
        stroke={isHighlighted ? '#3B82F6' : 'transparent'}
        strokeWidth={isHighlighted ? 2 : 0}
        onClick={handleClick}
        onTap={handleClick}
      />

      {/* Plus icon in center - only visible when highlighted */}
      {isHighlighted && (
        <Group listening={false} opacity={0.6}>
          <Line
            points={[
              cellSize / 2 - 10, cellSize / 2,
              cellSize / 2 + 10, cellSize / 2,
            ]}
            stroke="#3B82F6"
            strokeWidth={2}
            lineCap="round"
          />
          <Line
            points={[
              cellSize / 2, cellSize / 2 - 10,
              cellSize / 2, cellSize / 2 + 10,
            ]}
            stroke="#3B82F6"
            strokeWidth={2}
            lineCap="round"
          />
        </Group>
      )}
    </Group>
  );
}
