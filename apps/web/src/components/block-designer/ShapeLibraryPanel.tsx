'use client';

import { useCallback } from 'react';
import { useBlockDesignerStore, useSelectedUnitType, type UnitSelectionType } from '@quillty/core';
import { UnitThumbnail, UNIT_OPTIONS, type UnitOption } from './ShapeThumbnail';

/**
 * Check if two unit selections are equal
 */
function isUnitSelectionEqual(
  a: UnitSelectionType | null,
  b: UnitSelectionType
): boolean {
  if (a === null) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'hst' && b.type === 'hst') {
    return a.variant === b.variant;
  }
  return true;
}

/**
 * ShapeLibraryPanel - Left sidebar panel for selecting units
 *
 * Users select a unit from this panel, then click on empty cells
 * in the canvas to place the unit.
 */
export function ShapeLibraryPanel() {
  const selectedUnitType = useSelectedUnitType();
  const selectUnitForPlacement = useBlockDesignerStore(
    (state) => state.selectUnitForPlacement
  );
  const clearUnitSelection = useBlockDesignerStore(
    (state) => state.clearUnitSelection
  );
  const mode = useBlockDesignerStore((state) => state.mode);

  const handleSelectUnit = useCallback(
    (option: UnitOption) => {
      // If clicking the same unit, deselect it
      if (isUnitSelectionEqual(selectedUnitType, option.selection)) {
        clearUnitSelection();
      } else {
        selectUnitForPlacement(option.selection);
      }
    },
    [selectedUnitType, selectUnitForPlacement, clearUnitSelection]
  );

  const handleCancel = useCallback(() => {
    clearUnitSelection();
  }, [clearUnitSelection]);

  const isPlacingMode = mode === 'placing_unit' || mode === 'placing_flying_geese_second';
  const isPlacingFlyingGeese = mode === 'placing_flying_geese_second';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Units
        </h3>
      </div>

      {/* Unit Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {UNIT_OPTIONS.map((option) => (
            <UnitThumbnail
              key={option.id}
              option={option}
              isSelected={isUnitSelectionEqual(selectedUnitType, option.selection)}
              onClick={() => handleSelectUnit(option)}
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
              : selectedUnitType?.type === 'flying_geese'
                ? 'Tap first cell, then adjacent cell'
                : 'Tap cells to place unit'}
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
