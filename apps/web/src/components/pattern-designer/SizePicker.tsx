'use client';

import { useState, useCallback } from 'react';
import { MIN_GRID_SIZE, GRID_SIZE_WARNING_THRESHOLD, DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS } from '@quillty/core';

/** Maximum grid size for the size picker (lower than MAX_GRID_SIZE for UX) */
const PICKER_MAX_GRID_SIZE = 15;

interface SizePickerProps {
  /** Called when user confirms the grid size */
  onConfirm: (rows: number, cols: number) => void;
  /** Called when user cancels */
  onCancel?: () => void;
}

export function SizePicker({ onConfirm, onCancel }: SizePickerProps) {
  const [rows, setRows] = useState(DEFAULT_GRID_ROWS);
  const [cols, setCols] = useState(DEFAULT_GRID_COLS);

  const showWarning = rows > GRID_SIZE_WARNING_THRESHOLD || cols > GRID_SIZE_WARNING_THRESHOLD;

  const handleRowsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_GRID_SIZE && value <= PICKER_MAX_GRID_SIZE) {
      setRows(value);
    }
  }, []);

  const handleColsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_GRID_SIZE && value <= PICKER_MAX_GRID_SIZE) {
      setCols(value);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(rows, cols);
  }, [onConfirm, rows, cols]);

  // Generate preset options
  const presets = [
    { rows: 3, cols: 3, label: '3×3 (Small)' },
    { rows: 4, cols: 4, label: '4×4 (Standard)' },
    { rows: 5, cols: 5, label: '5×5 (Medium)' },
    { rows: 6, cols: 8, label: '6×8 (Throw)' },
    { rows: 8, cols: 10, label: '8×10 (Twin)' },
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Quilt Size</h2>
      <p className="text-sm text-gray-600 mb-6">
        Select how many blocks you want in your quilt pattern
      </p>

      {/* Preset buttons */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={`${preset.rows}x${preset.cols}`}
              onClick={() => {
                setRows(preset.rows);
                setCols(preset.cols);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                rows === preset.rows && cols === preset.cols
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom size inputs */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Custom Size
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="rows" className="text-xs text-gray-500 mb-1 block">
              Rows
            </label>
            <input
              id="rows"
              type="number"
              min={MIN_GRID_SIZE}
              max={PICKER_MAX_GRID_SIZE}
              value={rows}
              onChange={handleRowsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-medium"
            />
          </div>
          <span className="text-gray-400 text-2xl font-light mt-5">×</span>
          <div className="flex-1">
            <label htmlFor="cols" className="text-xs text-gray-500 mb-1 block">
              Columns
            </label>
            <input
              id="cols"
              type="number"
              min={MIN_GRID_SIZE}
              max={PICKER_MAX_GRID_SIZE}
              value={cols}
              onChange={handleColsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-medium"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {rows} rows × {cols} columns = {rows * cols} blocks total
        </p>
      </div>

      {/* Warning for large grids */}
      {showWarning && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Large grids may affect performance on some devices
          </p>
        </div>
      )}

      {/* Preview visualization */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview
        </label>
        <div className="flex justify-center">
          <div
            className="border-2 border-gray-300 bg-gray-50 rounded-lg overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              width: Math.min(240, cols * 24),
              height: Math.min(180, rows * 18),
              gap: 1,
            }}
          >
            {Array.from({ length: rows * cols }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Pattern
        </button>
      </div>
    </div>
  );
}
