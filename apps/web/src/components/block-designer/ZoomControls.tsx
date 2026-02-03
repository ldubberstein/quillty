'use client';

import { useCallback } from 'react';

interface ZoomControlsProps {
  /** Current scale (1 = 100%) */
  scale: number;
  /** Minimum allowed scale */
  minScale?: number;
  /** Maximum allowed scale */
  maxScale?: number;
  /** Called when zoom in button clicked */
  onZoomIn: () => void;
  /** Called when zoom out button clicked */
  onZoomOut: () => void;
  /** Called when fit button clicked */
  onZoomFit: () => void;
  /** Called when zoom changes */
  onZoomChange: (scale: number) => void;
}

/** Preset zoom levels */
const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

export function ZoomControls({
  scale,
  minScale = 0.25,
  maxScale = 3,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomChange,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);

  // Filter presets to only show valid options within bounds
  const validPresets = ZOOM_PRESETS.filter((p) => p >= minScale && p <= maxScale);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        onZoomChange(value);
      }
    },
    [onZoomChange]
  );

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Zoom Level Dropdown */}
      <select
        value={scale}
        onChange={handleSelectChange}
        className="h-10 px-2 min-w-[80px] text-center text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
        aria-label="Zoom level"
      >
        {validPresets.map((preset) => (
          <option key={preset} value={preset}>
            {Math.round(preset * 100)}%
          </option>
        ))}
        {!validPresets.includes(scale) && (
          <option value={scale}>{percentage}%</option>
        )}
      </select>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Fit to Screen */}
      <button
        onClick={onZoomFit}
        className="h-10 px-3 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        aria-label="Fit to screen"
        title="Fit to screen"
      >
        Fit
      </button>
    </div>
  );
}
