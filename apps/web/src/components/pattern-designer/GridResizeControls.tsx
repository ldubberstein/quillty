'use client';

import { useCallback, useState } from 'react';
import {
  usePatternDesignerStore,
  useGridSize,
  useCanAddRow,
  useCanRemoveRow,
  useCanAddColumn,
  useCanRemoveColumn,
  useIsGridLarge,
} from '@quillty/core';

interface GridResizeControlsProps {
  /** Position of the grid on canvas (pixels from left) */
  gridLeft: number;
  /** Position of the grid on canvas (pixels from top) */
  gridTop: number;
  /** Width of the grid (pixels) */
  gridWidth: number;
  /** Height of the grid (pixels) */
  gridHeight: number;
}

type Edge = 'top' | 'bottom' | 'left' | 'right';

/**
 * GridResizeControls - Hover-reveal buttons for adding/removing rows and columns
 *
 * Follows the Notion pattern:
 * - Buttons appear on hover near grid edges
 * - + button to add row/column at that edge
 * - - button to remove row/column at that edge
 */
export function GridResizeControls({
  gridLeft,
  gridTop,
  gridWidth,
  gridHeight,
}: GridResizeControlsProps) {
  const gridSize = useGridSize();
  const addRow = usePatternDesignerStore((state) => state.addRow);
  const removeRow = usePatternDesignerStore((state) => state.removeRow);
  const addColumn = usePatternDesignerStore((state) => state.addColumn);
  const removeColumn = usePatternDesignerStore((state) => state.removeColumn);
  const hasBlocksInRow = usePatternDesignerStore((state) => state.hasBlocksInRow);
  const hasBlocksInColumn = usePatternDesignerStore((state) => state.hasBlocksInColumn);

  const canAddRow = useCanAddRow();
  const canRemoveRow = useCanRemoveRow();
  const canAddColumn = useCanAddColumn();
  const canRemoveColumn = useCanRemoveColumn();
  const isGridLarge = useIsGridLarge();

  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);

  // Handlers for adding/removing
  const handleAddRowTop = useCallback(() => {
    if (addRow('top') && isGridLarge) {
      // Could show a toast warning here
    }
  }, [addRow, isGridLarge]);

  const handleAddRowBottom = useCallback(() => {
    if (addRow('bottom') && isGridLarge) {
      // Could show a toast warning here
    }
  }, [addRow, isGridLarge]);

  const handleRemoveRowTop = useCallback(() => {
    if (hasBlocksInRow(0)) {
      const confirmed = window.confirm(
        'This will delete blocks in the top row. Continue?'
      );
      if (!confirmed) return;
    }
    removeRow('top');
  }, [removeRow, hasBlocksInRow]);

  const handleRemoveRowBottom = useCallback(() => {
    if (hasBlocksInRow(gridSize.rows - 1)) {
      const confirmed = window.confirm(
        'This will delete blocks in the bottom row. Continue?'
      );
      if (!confirmed) return;
    }
    removeRow('bottom');
  }, [removeRow, hasBlocksInRow, gridSize.rows]);

  const handleAddColumnLeft = useCallback(() => {
    if (addColumn('left') && isGridLarge) {
      // Could show a toast warning here
    }
  }, [addColumn, isGridLarge]);

  const handleAddColumnRight = useCallback(() => {
    if (addColumn('right') && isGridLarge) {
      // Could show a toast warning here
    }
  }, [addColumn, isGridLarge]);

  const handleRemoveColumnLeft = useCallback(() => {
    if (hasBlocksInColumn(0)) {
      const confirmed = window.confirm(
        'This will delete blocks in the left column. Continue?'
      );
      if (!confirmed) return;
    }
    removeColumn('left');
  }, [removeColumn, hasBlocksInColumn]);

  const handleRemoveColumnRight = useCallback(() => {
    if (hasBlocksInColumn(gridSize.cols - 1)) {
      const confirmed = window.confirm(
        'This will delete blocks in the right column. Continue?'
      );
      if (!confirmed) return;
    }
    removeColumn('right');
  }, [removeColumn, hasBlocksInColumn, gridSize.cols]);

  // Button size and spacing
  const buttonSize = 28;
  const buttonGap = 4;
  const edgeOffset = 8; // Distance from grid edge

  return (
    <>
      {/* Top edge controls */}
      <div
        className="absolute flex items-center justify-center gap-1 transition-opacity duration-150"
        style={{
          left: gridLeft + gridWidth / 2 - (buttonSize + buttonGap + buttonSize) / 2,
          top: gridTop - buttonSize - edgeOffset,
          opacity: hoveredEdge === 'top' ? 1 : 0,
          pointerEvents: hoveredEdge === 'top' ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleRemoveRowTop}
          disabled={!canRemoveRow}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Remove top row"
          aria-label="Remove top row"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleAddRowTop}
          disabled={!canAddRow}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Add row at top"
          aria-label="Add row at top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Top hover zone */}
      <div
        className="absolute"
        style={{
          left: gridLeft,
          top: gridTop - 40,
          width: gridWidth,
          height: 40,
        }}
        onMouseEnter={() => setHoveredEdge('top')}
        onMouseLeave={() => setHoveredEdge(null)}
      />

      {/* Bottom edge controls */}
      <div
        className="absolute flex items-center justify-center gap-1 transition-opacity duration-150"
        style={{
          left: gridLeft + gridWidth / 2 - (buttonSize + buttonGap + buttonSize) / 2,
          top: gridTop + gridHeight + edgeOffset,
          opacity: hoveredEdge === 'bottom' ? 1 : 0,
          pointerEvents: hoveredEdge === 'bottom' ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleAddRowBottom}
          disabled={!canAddRow}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Add row at bottom"
          aria-label="Add row at bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleRemoveRowBottom}
          disabled={!canRemoveRow}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Remove bottom row"
          aria-label="Remove bottom row"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Bottom hover zone */}
      <div
        className="absolute"
        style={{
          left: gridLeft,
          top: gridTop + gridHeight,
          width: gridWidth,
          height: 40,
        }}
        onMouseEnter={() => setHoveredEdge('bottom')}
        onMouseLeave={() => setHoveredEdge(null)}
      />

      {/* Left edge controls */}
      <div
        className="absolute flex flex-col items-center justify-center gap-1 transition-opacity duration-150"
        style={{
          left: gridLeft - buttonSize - edgeOffset,
          top: gridTop + gridHeight / 2 - (buttonSize + buttonGap + buttonSize) / 2,
          opacity: hoveredEdge === 'left' ? 1 : 0,
          pointerEvents: hoveredEdge === 'left' ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleRemoveColumnLeft}
          disabled={!canRemoveColumn}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Remove left column"
          aria-label="Remove left column"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleAddColumnLeft}
          disabled={!canAddColumn}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Add column at left"
          aria-label="Add column at left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Left hover zone */}
      <div
        className="absolute"
        style={{
          left: gridLeft - 40,
          top: gridTop,
          width: 40,
          height: gridHeight,
        }}
        onMouseEnter={() => setHoveredEdge('left')}
        onMouseLeave={() => setHoveredEdge(null)}
      />

      {/* Right edge controls */}
      <div
        className="absolute flex flex-col items-center justify-center gap-1 transition-opacity duration-150"
        style={{
          left: gridLeft + gridWidth + edgeOffset,
          top: gridTop + gridHeight / 2 - (buttonSize + buttonGap + buttonSize) / 2,
          opacity: hoveredEdge === 'right' ? 1 : 0,
          pointerEvents: hoveredEdge === 'right' ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleAddColumnRight}
          disabled={!canAddColumn}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Add column at right"
          aria-label="Add column at right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleRemoveColumnRight}
          disabled={!canRemoveColumn}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Remove right column"
          aria-label="Remove right column"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Right hover zone */}
      <div
        className="absolute"
        style={{
          left: gridLeft + gridWidth,
          top: gridTop,
          width: 40,
          height: gridHeight,
        }}
        onMouseEnter={() => setHoveredEdge('right')}
        onMouseLeave={() => setHoveredEdge(null)}
      />
    </>
  );
}
