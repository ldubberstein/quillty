'use client';

import { useCallback } from 'react';
import {
  usePatternDesignerStore,
  useGridSize,
  useCanAddRow,
  useCanRemoveRow,
  useCanAddColumn,
  useCanRemoveColumn,
  useIsGridLarge,
  useGridResizePosition,
} from '@quillty/core';

/**
 * GridSizePanel - Right sidebar panel for grid resize controls
 *
 * Shows current grid size with simple +/- steppers for rows and columns.
 * A toggle controls whether additions happen at start (top/left) or end (bottom/right).
 * Hovering on +/- buttons shows a ghost preview on the actual canvas.
 */
export function GridSizePanel() {
  const gridSize = useGridSize();
  const gridResizePosition = useGridResizePosition();
  const addRow = usePatternDesignerStore((state) => state.addRow);
  const removeRow = usePatternDesignerStore((state) => state.removeRow);
  const addColumn = usePatternDesignerStore((state) => state.addColumn);
  const removeColumn = usePatternDesignerStore((state) => state.removeColumn);
  const hasBlocksInRow = usePatternDesignerStore((state) => state.hasBlocksInRow);
  const hasBlocksInColumn = usePatternDesignerStore((state) => state.hasBlocksInColumn);
  const setGridResizePosition = usePatternDesignerStore((state) => state.setGridResizePosition);
  const setPreviewingGridResize = usePatternDesignerStore((state) => state.setPreviewingGridResize);

  const canAddRow = useCanAddRow();
  const canRemoveRow = useCanRemoveRow();
  const canAddColumn = useCanAddColumn();
  const canRemoveColumn = useCanRemoveColumn();
  const isGridLarge = useIsGridLarge();

  // Row handlers
  const handleAddRow = useCallback(() => {
    addRow();
  }, [addRow]);

  const handleRemoveRow = useCallback(() => {
    const rowToRemove = gridResizePosition === 'start' ? 0 : gridSize.rows - 1;
    if (hasBlocksInRow(rowToRemove)) {
      const position = gridResizePosition === 'start' ? 'top' : 'bottom';
      const confirmed = window.confirm(`This will delete blocks in the ${position} row. Continue?`);
      if (!confirmed) return;
    }
    removeRow();
  }, [removeRow, hasBlocksInRow, gridSize.rows, gridResizePosition]);

  // Column handlers
  const handleAddColumn = useCallback(() => {
    addColumn();
  }, [addColumn]);

  const handleRemoveColumn = useCallback(() => {
    const colToRemove = gridResizePosition === 'start' ? 0 : gridSize.cols - 1;
    if (hasBlocksInColumn(colToRemove)) {
      const position = gridResizePosition === 'start' ? 'left' : 'right';
      const confirmed = window.confirm(`This will delete blocks in the ${position} column. Continue?`);
      if (!confirmed) return;
    }
    removeColumn();
  }, [removeColumn, hasBlocksInColumn, gridSize.cols, gridResizePosition]);

  // Preview handlers
  const clearPreview = useCallback(() => {
    setPreviewingGridResize(null);
  }, [setPreviewingGridResize]);

  return (
    <div className="p-3 border-t border-gray-200">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Grid Size
      </h3>

      {isGridLarge && (
        <p className="text-xs text-amber-600 mb-3">
          Large grids may affect performance
        </p>
      )}

      {/* Row stepper */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-600 w-16">Rows</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRemoveRow}
            onMouseEnter={() => canRemoveRow && setPreviewingGridResize('remove-row')}
            onMouseLeave={clearPreview}
            disabled={!canRemoveRow}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`Remove ${gridResizePosition === 'start' ? 'top' : 'bottom'} row`}
            aria-label="Remove row"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-800 tabular-nums">
            {gridSize.rows}
          </span>
          <button
            onClick={handleAddRow}
            onMouseEnter={() => canAddRow && setPreviewingGridResize('add-row')}
            onMouseLeave={clearPreview}
            disabled={!canAddRow}
            className="w-7 h-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`Add row at ${gridResizePosition === 'start' ? 'top' : 'bottom'}`}
            aria-label="Add row"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Column stepper */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-600 w-16">Columns</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRemoveColumn}
            onMouseEnter={() => canRemoveColumn && setPreviewingGridResize('remove-col')}
            onMouseLeave={clearPreview}
            disabled={!canRemoveColumn}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`Remove ${gridResizePosition === 'start' ? 'left' : 'right'} column`}
            aria-label="Remove column"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-800 tabular-nums">
            {gridSize.cols}
          </span>
          <button
            onClick={handleAddColumn}
            onMouseEnter={() => canAddColumn && setPreviewingGridResize('add-col')}
            onMouseLeave={clearPreview}
            disabled={!canAddColumn}
            className="w-7 h-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`Add column at ${gridResizePosition === 'start' ? 'left' : 'right'}`}
            aria-label="Add column"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Position toggle */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Add/remove at:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setGridResizePosition('start')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              gridResizePosition === 'start'
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Start
            <span className="block text-[10px] opacity-70">(top/left)</span>
          </button>
          <button
            onClick={() => setGridResizePosition('end')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              gridResizePosition === 'end'
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            End
            <span className="block text-[10px] opacity-70">(bottom/right)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
