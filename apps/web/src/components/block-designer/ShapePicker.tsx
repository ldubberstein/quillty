'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Shape option for the picker
 */
interface ShapeOption {
  id: 'square';
  label: string;
  icon: React.ReactNode;
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
  onSelectShape: (shapeType: 'square') => void;
  /** Callback when picker is dismissed */
  onDismiss: () => void;
}

/** Shape options for MVP (just Square for iteration 1.4) */
const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
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
    (shapeType: 'square') => {
      onSelectShape(shapeType);
    },
    [onSelectShape]
  );

  // Calculate position to keep picker within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 150),
    y: Math.min(position.y, window.innerHeight - 100),
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

      <div className="flex gap-1">
        {SHAPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleShapeClick(option.id)}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
