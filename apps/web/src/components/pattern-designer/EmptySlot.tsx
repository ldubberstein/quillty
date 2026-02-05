'use client';

import { Rect, Group, Line } from 'react-konva';
import { useCallback } from 'react';
import type Konva from 'konva';

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
  /** Whether this slot is highlighted (e.g., during placement mode) */
  isHighlighted?: boolean;
  /** Whether this slot is being hovered */
  isHovered?: boolean;
  /** Called when slot is clicked/tapped (shiftKey indicates if shift was held) */
  onClick?: (row: number, col: number, shiftKey: boolean) => void;
  /** Called when mouse enters slot */
  onMouseEnter?: (row: number, col: number) => void;
  /** Called when mouse leaves slot */
  onMouseLeave?: () => void;
}

export function EmptySlot({
  row,
  col,
  cellSize,
  offsetX,
  offsetY,
  isHighlighted = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EmptySlotProps) {
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onClick?.(row, col, shiftKey);
    },
    [onClick, row, col]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(row, col);
  }, [onMouseEnter, row, col]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.();
  }, [onMouseLeave]);

  // Determine fill color based on state
  // Hovered gets a stronger highlight than just being in placement mode
  const getFillColor = () => {
    if (isHovered && isHighlighted) {
      return 'rgba(59, 130, 246, 0.25)'; // Stronger blue when hovered
    }
    if (isHighlighted) {
      return 'rgba(59, 130, 246, 0.08)'; // Subtle blue when in placement mode
    }
    return 'transparent';
  };

  return (
    <Group x={x} y={y}>
      {/* Click target - full cell, edge-to-edge (no gaps, no rounded corners) */}
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill={getFillColor()}
        stroke={isHovered && isHighlighted ? '#3B82F6' : 'transparent'}
        strokeWidth={isHovered && isHighlighted ? 2 : 0}
        onClick={handleClick}
        onTap={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Plus icon in center - only visible when hovered in placement mode */}
      {isHovered && isHighlighted && (
        <Group listening={false} opacity={0.4}>
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
