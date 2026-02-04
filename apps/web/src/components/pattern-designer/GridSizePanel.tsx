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
} from '@quillty/core';

/**
 * GridSizePanel - Right sidebar panel for grid resize controls
 *
 * Shows current grid size and provides +/- buttons for rows and columns.
 * Hovering over buttons shows a ghost preview of the added/removed row/column.
 */
export function GridSizePanel() {
  const gridSize = useGridSize();
  const addRow = usePatternDesignerStore((state) => state.addRow);
  const removeRow = usePatternDesignerStore((state) => state.removeRow);
  const addColumn = usePatternDesignerStore((state) => state.addColumn);
  const removeColumn = usePatternDesignerStore((state) => state.removeColumn);
  const hasBlocksInRow = usePatternDesignerStore((state) => state.hasBlocksInRow);
  const hasBlocksInColumn = usePatternDesignerStore((state) => state.hasBlocksInColumn);
  const setPreviewingGridResize = usePatternDesignerStore((state) => state.setPreviewingGridResize);

  const canAddRow = useCanAddRow();
  const canRemoveRow = useCanRemoveRow();
  const canAddColumn = useCanAddColumn();
  const canRemoveColumn = useCanRemoveColumn();
  const isGridLarge = useIsGridLarge();

  // Row handlers
  const handleAddRowTop = useCallback(() => {
    addRow('top');
  }, [addRow]);

  const handleAddRowBottom = useCallback(() => {
    addRow('bottom');
  }, [addRow]);

  const handleRemoveRowTop = useCallback(() => {
    if (hasBlocksInRow(0)) {
      const confirmed = window.confirm('This will delete blocks in the top row. Continue?');
      if (!confirmed) return;
    }
    removeRow('top');
  }, [removeRow, hasBlocksInRow]);

  const handleRemoveRowBottom = useCallback(() => {
    if (hasBlocksInRow(gridSize.rows - 1)) {
      const confirmed = window.confirm('This will delete blocks in the bottom row. Continue?');
      if (!confirmed) return;
    }
    removeRow('bottom');
  }, [removeRow, hasBlocksInRow, gridSize.rows]);

  // Column handlers
  const handleAddColumnLeft = useCallback(() => {
    addColumn('left');
  }, [addColumn]);

  const handleAddColumnRight = useCallback(() => {
    addColumn('right');
  }, [addColumn]);

  const handleRemoveColumnLeft = useCallback(() => {
    if (hasBlocksInColumn(0)) {
      const confirmed = window.confirm('This will delete blocks in the left column. Continue?');
      if (!confirmed) return;
    }
    removeColumn('left');
  }, [removeColumn, hasBlocksInColumn]);

  const handleRemoveColumnRight = useCallback(() => {
    if (hasBlocksInColumn(gridSize.cols - 1)) {
      const confirmed = window.confirm('This will delete blocks in the right column. Continue?');
      if (!confirmed) return;
    }
    removeColumn('right');
  }, [removeColumn, hasBlocksInColumn, gridSize.cols]);

  // Preview handlers
  const handlePreview = useCallback(
    (preview: 'row-top' | 'row-bottom' | 'col-left' | 'col-right' | null) => {
      setPreviewingGridResize(preview);
    },
    [setPreviewingGridResize]
  );

  return (
    <div className="p-3 border-t border-gray-200">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Grid Size
      </h3>

      {/* Current size display */}
      <div className="text-center mb-4">
        <span className="text-2xl font-semibold text-gray-800">
          {gridSize.rows} × {gridSize.cols}
        </span>
        <p className="text-xs text-gray-400 mt-1">rows × columns</p>
      </div>

      {isGridLarge && (
        <p className="text-xs text-amber-600 mb-3 text-center">
          Large grids may affect performance
        </p>
      )}

      {/* Row controls */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Rows</p>
        <div className="flex gap-2">
          {/* Add/remove at top */}
          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={handleAddRowTop}
              onMouseEnter={() => canAddRow && handlePreview('row-top')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canAddRow}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Add row at top"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Top
            </button>
            <button
              onClick={handleRemoveRowTop}
              onMouseEnter={() => canRemoveRow && handlePreview('row-top')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canRemoveRow}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Remove top row"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Top
            </button>
          </div>

          {/* Add/remove at bottom */}
          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={handleAddRowBottom}
              onMouseEnter={() => canAddRow && handlePreview('row-bottom')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canAddRow}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Add row at bottom"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Bottom
            </button>
            <button
              onClick={handleRemoveRowBottom}
              onMouseEnter={() => canRemoveRow && handlePreview('row-bottom')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canRemoveRow}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Remove bottom row"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Bottom
            </button>
          </div>
        </div>
      </div>

      {/* Column controls */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Columns</p>
        <div className="flex gap-2">
          {/* Add/remove at left */}
          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={handleAddColumnLeft}
              onMouseEnter={() => canAddColumn && handlePreview('col-left')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canAddColumn}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Add column at left"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Left
            </button>
            <button
              onClick={handleRemoveColumnLeft}
              onMouseEnter={() => canRemoveColumn && handlePreview('col-left')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canRemoveColumn}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Remove left column"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Left
            </button>
          </div>

          {/* Add/remove at right */}
          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={handleAddColumnRight}
              onMouseEnter={() => canAddColumn && handlePreview('col-right')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canAddColumn}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Add column at right"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Right
            </button>
            <button
              onClick={handleRemoveColumnRight}
              onMouseEnter={() => canRemoveColumn && handlePreview('col-right')}
              onMouseLeave={() => handlePreview(null)}
              disabled={!canRemoveColumn}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Remove right column"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Right
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
