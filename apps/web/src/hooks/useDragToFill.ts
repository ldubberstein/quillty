import { useCallback, useRef, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { GridPosition } from '@quillty/core';

/**
 * Options for the useDragToFill hook
 */
export interface UseDragToFillOptions {
  /** Function to convert Konva stage coords to grid position */
  stageToGrid: (x: number, y: number) => GridPosition | null;
  /** Function to check if a cell is occupied */
  isCellOccupied: (pos: GridPosition) => boolean;
  /** Callback when drag completes with cells to fill */
  onDragComplete: (cells: GridPosition[]) => void;
  /** Whether drag-to-fill is currently enabled */
  enabled: boolean;
}

/**
 * Return value from useDragToFill hook
 */
export interface UseDragToFillReturn {
  /** Handler for mousedown on Stage */
  handleMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  /** Handler for mousemove on Stage */
  handleMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  /** Handler for mouseup on Stage/window */
  handleMouseUp: () => void;
  /** Current cells being previewed (for rendering) */
  draggedCells: GridPosition[];
  /** Whether a drag is in progress */
  isDragging: boolean;
}

/**
 * Generate position key for Set deduplication
 */
function posKey(pos: GridPosition): string {
  return `${pos.row},${pos.col}`;
}

/**
 * Parse position key back to GridPosition
 */
function parseKey(key: string): GridPosition {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

/**
 * Interpolate cells between two positions using Bresenham's line algorithm.
 * This ensures no cells are missed even with fast mouse movement.
 */
function interpolateCells(from: GridPosition, to: GridPosition): GridPosition[] {
  const cells: GridPosition[] = [];
  const dx = Math.abs(to.col - from.col);
  const dy = Math.abs(to.row - from.row);
  const sx = from.col < to.col ? 1 : -1;
  const sy = from.row < to.row ? 1 : -1;
  let err = dx - dy;
  let { row, col } = from;

  while (true) {
    cells.push({ row, col });
    if (row === to.row && col === to.col) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      col += sx;
    }
    if (e2 < dx) {
      err += dx;
      row += sy;
    }
  }
  return cells;
}

/**
 * Hook for drag-to-fill functionality on a grid canvas.
 *
 * Enables users to click and drag across empty cells to fill them
 * with the selected shape/block. Uses Bresenham's algorithm to
 * ensure no cells are missed during fast mouse movement.
 *
 * @example
 * ```tsx
 * const { handleMouseDown, handleMouseMove, handleMouseUp, draggedCells, isDragging } = useDragToFill({
 *   stageToGrid,
 *   isCellOccupied,
 *   onDragComplete: (cells) => addShapesBatch(cells, selectedShapeType),
 *   enabled: isPlacingShape,
 * });
 * ```
 */
export function useDragToFill({
  stageToGrid,
  isCellOccupied,
  onDragComplete,
  enabled,
}: UseDragToFillOptions): UseDragToFillReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCells, setDraggedCells] = useState<GridPosition[]>([]);
  const lastPosRef = useRef<GridPosition | null>(null);
  const cellSetRef = useRef<Set<string>>(new Set());

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!enabled) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const gridPos = stageToGrid(pos.x, pos.y);
      if (!gridPos || isCellOccupied(gridPos)) return;

      // Start drag
      setIsDragging(true);
      cellSetRef.current = new Set([posKey(gridPos)]);
      setDraggedCells([gridPos]);
      lastPosRef.current = gridPos;

      // Prevent stage drag during fill
      e.cancelBubble = true;
    },
    [enabled, stageToGrid, isCellOccupied]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isDragging) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const gridPos = stageToGrid(pos.x, pos.y);
      if (!gridPos) return;

      const lastPos = lastPosRef.current;
      if (!lastPos) return;

      // Interpolate cells between last and current position
      const newCells = interpolateCells(lastPos, gridPos);
      let changed = false;

      for (const cell of newCells) {
        const key = posKey(cell);
        if (!cellSetRef.current.has(key) && !isCellOccupied(cell)) {
          cellSetRef.current.add(key);
          changed = true;
        }
      }

      if (changed) {
        setDraggedCells(Array.from(cellSetRef.current).map(parseKey));
      }

      lastPosRef.current = gridPos;
    },
    [isDragging, stageToGrid, isCellOccupied]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    const cells = Array.from(cellSetRef.current).map(parseKey);

    if (cells.length > 0) {
      onDragComplete(cells);
    }

    // Reset state
    setIsDragging(false);
    setDraggedCells([]);
    cellSetRef.current.clear();
    lastPosRef.current = null;
  }, [isDragging, onDragComplete]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    draggedCells,
    isDragging,
  };
}
