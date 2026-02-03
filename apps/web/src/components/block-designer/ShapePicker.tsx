'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { HstVariant } from '@quillty/core';

/**
 * Shape selection types
 */
export type ShapeSelection =
  | { type: 'square' }
  | { type: 'hst'; variant: HstVariant }
  | { type: 'flying_geese' };

/**
 * Shape option for the picker
 */
interface ShapeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  selection: ShapeSelection;
  wide?: boolean; // If true, button is 2x width (for shapes like Flying Geese)
}

/**
 * Shape picker position (screen coordinates)
 */
interface PickerPosition {
  x: number;
  y: number;
}

interface ShapePickerProps {
  /** Screen position where picker should appear */
  position: PickerPosition;
  /** Callback when a shape is selected */
  onSelectShape: (selection: ShapeSelection) => void;
  /** Callback when picker is dismissed */
  onDismiss: () => void;
}

/** Shape options for MVP - Square and 4 HST variants */
const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'square',
    label: 'Square',
    selection: { type: 'square' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    id: 'hst-nw',
    label: '◸',
    selection: { type: 'hst', variant: 'nw' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        {/* Primary triangle (top-left) - dark */}
        <polygon points="3,3 21,3 3,21" fill="currentColor" />
        {/* Secondary triangle (bottom-right) - light */}
        <polygon points="21,3 21,21 3,21" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'hst-ne',
    label: '◹',
    selection: { type: 'hst', variant: 'ne' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        {/* Primary triangle (top-right) - dark */}
        <polygon points="3,3 21,3 21,21" fill="currentColor" />
        {/* Secondary triangle (bottom-left) - light */}
        <polygon points="3,3 21,21 3,21" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'hst-sw',
    label: '◺',
    selection: { type: 'hst', variant: 'sw' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        {/* Primary triangle (bottom-left) - dark */}
        <polygon points="3,3 3,21 21,21" fill="currentColor" />
        {/* Secondary triangle (top-right) - light */}
        <polygon points="3,3 21,3 21,21" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'hst-se',
    label: '◿',
    selection: { type: 'hst', variant: 'se' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        {/* Primary triangle (bottom-right) - dark */}
        <polygon points="21,3 21,21 3,21" fill="currentColor" />
        {/* Secondary triangle (top-left) - light */}
        <polygon points="3,3 21,3 3,21" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'flying-geese',
    label: 'Geese',
    selection: { type: 'flying_geese' },
    wide: true, // Flying Geese button is 2x1 to match shape
    icon: (
      <svg viewBox="0 0 48 24" className="w-12 h-6">
        {/* Flying Geese icon - horizontal 2x1 orientation */}
        {/* Center goose triangle pointing right */}
        <polygon points="3,3 45,12 3,21" fill="currentColor" />
        {/* Top sky triangle */}
        <polygon points="3,3 45,3 45,12" fill="#E5E7EB" />
        {/* Bottom sky triangle */}
        <polygon points="3,21 45,12 45,21" fill="#E5E7EB" />
      </svg>
    ),
  },
];

/**
 * ShapePicker - Popup for selecting which shape to place
 *
 * Appears near the tap point when user taps an empty cell.
 * For iteration 1.4, only shows "Square" option.
 */
export function ShapePicker({ position, onSelectShape, onDismiss }: ShapePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    // Use a small delay to prevent immediate dismissal from the same click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onDismiss]);

  // Handle escape key to dismiss
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const handleShapeClick = useCallback(
    (selection: ShapeSelection) => {
      onSelectShape(selection);
    },
    [onSelectShape]
  );

  // Calculate position to keep picker within viewport
  // Picker is wider now (~450px with 6 buttons) so increase margin
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 250),
    y: Math.min(position.y, window.innerHeight - 120),
  };

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
      role="menu"
      aria-label="Shape picker"
    >
      {/* Arrow pointing down */}
      <div
        className="absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"
        style={{
          left: '50%',
          bottom: '-6px',
          marginLeft: '-6px',
        }}
      />

      <div className="flex gap-2">
        {SHAPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleShapeClick(option.selection)}
            className={`flex flex-col items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              option.wide ? 'w-28 h-16' : 'w-16 h-16'
            }`}
            role="menuitem"
            aria-label={`Add ${option.label}`}
          >
            <span className="text-gray-700">{option.icon}</span>
            <span className="text-xs text-gray-600 mt-1">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
