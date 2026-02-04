'use client';

import { useCallback } from 'react';
import { useBlockDesignerStore, useSelectedShapeType, type ShapeSelectionType } from '@quillty/core';
import { ShapeThumbnail, SHAPE_OPTIONS, type ShapeOption } from './ShapeThumbnail';

/**
 * Check if two shape selections are equal
 */
function isShapeSelectionEqual(
  a: ShapeSelectionType | null,
  b: ShapeSelectionType
): boolean {
  if (a === null) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'hst' && b.type === 'hst') {
    return a.variant === b.variant;
  }
  return true;
}

/**
 * ShapeLibraryPanel - Left sidebar panel for selecting shapes
 *
 * Users select a shape from this panel, then click on empty cells
 * in the canvas to place the shape.
 */
export function ShapeLibraryPanel() {
  const selectedShapeType = useSelectedShapeType();
  const selectShapeForPlacement = useBlockDesignerStore(
    (state) => state.selectShapeForPlacement
  );
  const clearShapeSelection = useBlockDesignerStore(
    (state) => state.clearShapeSelection
  );
  const mode = useBlockDesignerStore((state) => state.mode);

  const handleSelectShape = useCallback(
    (option: ShapeOption) => {
      // If clicking the same shape, deselect it
      if (isShapeSelectionEqual(selectedShapeType, option.selection)) {
        clearShapeSelection();
      } else {
        selectShapeForPlacement(option.selection);
      }
    },
    [selectedShapeType, selectShapeForPlacement, clearShapeSelection]
  );

  const handleCancel = useCallback(() => {
    clearShapeSelection();
  }, [clearShapeSelection]);

  const isPlacingMode = mode === 'placing_shape' || mode === 'placing_flying_geese_second';
  const isPlacingFlyingGeese = mode === 'placing_flying_geese_second';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Shapes
        </h3>
      </div>

      {/* Shape Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {SHAPE_OPTIONS.map((option) => (
            <ShapeThumbnail
              key={option.id}
              option={option}
              isSelected={isShapeSelectionEqual(selectedShapeType, option.selection)}
              onClick={() => handleSelectShape(option)}
            />
          ))}
        </div>
      </div>

      {/* Selection Feedback */}
      {isPlacingMode && (
        <div className="border-t border-gray-100 px-3 py-2 bg-blue-50 space-y-2">
          <p className="text-xs text-blue-700 text-center">
            {isPlacingFlyingGeese
              ? 'Tap an adjacent cell to complete'
              : selectedShapeType?.type === 'flying_geese'
                ? 'Tap first cell, then adjacent cell'
                : 'Tap cells to place shape'}
          </p>
          <button
            onClick={handleCancel}
            className="w-full px-2 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
