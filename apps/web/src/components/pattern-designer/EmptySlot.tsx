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
  const padding = 2;

  const handleClick = useCallback(() => {
    onClick?.(row, col);
  }, [onClick, row, col]);

  // Diagonal lines for hatching pattern
  const numLines = 5;
  const lineSpacing = cellSize / numLines;
  const lines: { points: number[] }[] = [];

  for (let i = 1; i < numLines; i++) {
    // Lines from bottom-left to top-right direction
    lines.push({
      points: [
        padding + i * lineSpacing, padding,
        padding, padding + i * lineSpacing,
      ],
    });
    lines.push({
      points: [
        cellSize - padding, padding + (numLines - i) * lineSpacing,
        padding + (numLines - i) * lineSpacing, cellSize - padding,
      ],
    });
  }

  return (
    <Group x={x} y={y}>
      {/* Background */}
      <Rect
        x={padding}
        y={padding}
        width={cellSize - padding * 2}
        height={cellSize - padding * 2}
        fill={isHighlighted ? 'rgba(59, 130, 246, 0.1)' : '#FAFAFA'}
        stroke={isHighlighted ? '#3B82F6' : '#E5E7EB'}
        strokeWidth={isHighlighted ? 2 : 1}
        dash={isHighlighted ? undefined : [4, 4]}
        cornerRadius={4}
        onClick={handleClick}
        onTap={handleClick}
      />

      {/* Hatching pattern (subtle) */}
      {!isHighlighted &&
        lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke="#E5E7EB"
            strokeWidth={1}
            opacity={0.5}
            listening={false}
          />
        ))}

      {/* Plus icon in center */}
      <Group listening={false} opacity={isHighlighted ? 0.8 : 0.3}>
        <Line
          points={[
            cellSize / 2 - 8, cellSize / 2,
            cellSize / 2 + 8, cellSize / 2,
          ]}
          stroke={isHighlighted ? '#3B82F6' : '#9CA3AF'}
          strokeWidth={2}
          lineCap="round"
        />
        <Line
          points={[
            cellSize / 2, cellSize / 2 - 8,
            cellSize / 2, cellSize / 2 + 8,
          ]}
          stroke={isHighlighted ? '#3B82F6' : '#9CA3AF'}
          strokeWidth={2}
          lineCap="round"
        />
      </Group>
    </Group>
  );
}
