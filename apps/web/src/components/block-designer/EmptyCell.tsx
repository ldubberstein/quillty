'use client';

import { Rect, Group, Line } from 'react-konva';
import { useCallback } from 'react';

interface EmptyCellProps {
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
  /** Whether this cell is highlighted (e.g., during placement mode) */
  isHighlighted?: boolean;
  /** Whether this cell is being hovered */
  isHovered?: boolean;
  /** Whether this cell is a valid target for Flying Geese second tap */
  isValidFlyingGeeseTarget?: boolean;
  /** Called when cell is clicked/tapped */
  onClick?: (row: number, col: number) => void;
  /** Called when mouse enters cell */
  onMouseEnter?: (row: number, col: number) => void;
  /** Called when mouse leaves cell */
  onMouseLeave?: () => void;
}

/**
 * EmptyCell - Konva component for rendering empty grid cells
 *
 * Provides visual feedback for placement mode:
 * - Subtle highlight when in placing mode
 * - Stronger highlight and border on hover
 * - Plus icon in center when hovered
 * - Special highlight for valid Flying Geese targets
 */
export function EmptyCell({
  row,
  col,
  cellSize,
  offsetX,
  offsetY,
  isHighlighted = false,
  isHovered = false,
  isValidFlyingGeeseTarget = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EmptyCellProps) {
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;

  const handleClick = useCallback(() => {
    onClick?.(row, col);
  }, [onClick, row, col]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(row, col);
  }, [onMouseEnter, row, col]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.();
  }, [onMouseLeave]);

  // Determine fill color based on state
  const getFillColor = () => {
    // Flying Geese valid target gets green highlight
    if (isValidFlyingGeeseTarget) {
      if (isHovered) {
        return 'rgba(34, 197, 94, 0.3)'; // Stronger green when hovered
      }
      return 'rgba(34, 197, 94, 0.15)'; // Subtle green
    }
    // Regular placement mode
    if (isHovered && isHighlighted) {
      return 'rgba(59, 130, 246, 0.25)'; // Stronger blue when hovered
    }
    if (isHighlighted) {
      return 'rgba(59, 130, 246, 0.08)'; // Subtle blue when in placement mode
    }
    return 'transparent';
  };

  // Determine stroke color
  const getStrokeColor = () => {
    if (isValidFlyingGeeseTarget && isHovered) {
      return '#22C55E'; // Green
    }
    if (isHovered && isHighlighted) {
      return '#3B82F6'; // Blue
    }
    return 'transparent';
  };

  const showPlusIcon = isHovered && (isHighlighted || isValidFlyingGeeseTarget);
  const iconColor = isValidFlyingGeeseTarget ? '#22C55E' : '#3B82F6';

  return (
    <Group x={x} y={y}>
      {/* Click target - full cell */}
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={(isHovered && (isHighlighted || isValidFlyingGeeseTarget)) ? 2 : 0}
        onClick={handleClick}
        onTap={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Plus icon in center - only visible when hovered in placement mode */}
      {showPlusIcon && (
        <Group listening={false} opacity={0.4}>
          <Line
            points={[
              cellSize / 2 - 10, cellSize / 2,
              cellSize / 2 + 10, cellSize / 2,
            ]}
            stroke={iconColor}
            strokeWidth={2}
            lineCap="round"
          />
          <Line
            points={[
              cellSize / 2, cellSize / 2 - 10,
              cellSize / 2, cellSize / 2 + 10,
            ]}
            stroke={iconColor}
            strokeWidth={2}
            lineCap="round"
          />
        </Group>
      )}
    </Group>
  );
}
