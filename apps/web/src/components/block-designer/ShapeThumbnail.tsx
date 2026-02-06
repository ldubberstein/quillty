'use client';

import type { UnitSelectionType } from '@quillty/core';

/**
 * Unit option for the library panel
 */
export interface UnitOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  selection: UnitSelectionType;
  wide?: boolean;
}

/**
 * All available unit options for the library
 */
export const UNIT_OPTIONS: UnitOption[] = [
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
        <polygon points="3,3 21,3 3,21" fill="currentColor" />
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
        <polygon points="3,3 21,3 21,21" fill="currentColor" />
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
        <polygon points="3,3 3,21 21,21" fill="currentColor" />
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
        <polygon points="21,3 21,21 3,21" fill="currentColor" />
        <polygon points="3,3 21,3 3,21" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'qst',
    label: 'QST',
    selection: { type: 'qst' },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        {/* 4 triangles meeting at center */}
        <polygon points="3,3 21,3 12,12" fill="currentColor" />
        <polygon points="21,3 21,21 12,12" fill="#E5E7EB" />
        <polygon points="21,21 3,21 12,12" fill="currentColor" />
        <polygon points="3,21 3,3 12,12" fill="#E5E7EB" />
      </svg>
    ),
  },
  {
    id: 'flying-geese',
    label: 'Geese',
    selection: { type: 'flying_geese' },
    wide: true,
    icon: (
      <svg viewBox="0 0 48 24" className="w-12 h-6">
        <polygon points="3,3 45,12 3,21" fill="currentColor" />
        <polygon points="3,3 45,3 45,12" fill="#E5E7EB" />
        <polygon points="3,21 45,12 45,21" fill="#E5E7EB" />
      </svg>
    ),
  },
];

interface UnitThumbnailProps {
  option: UnitOption;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * UnitThumbnail - Individual unit button for the library panel
 */
export function UnitThumbnail({ option, isSelected, onClick }: UnitThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-md transition-colors ${
        option.wide ? 'col-span-2' : ''
      } ${
        isSelected
          ? 'bg-blue-50 ring-2 ring-blue-500 text-blue-700'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
      }`}
      style={{
        height: option.wide ? '48px' : '56px',
        minWidth: option.wide ? '100%' : undefined,
      }}
      aria-label={`Select ${option.label}`}
      aria-pressed={isSelected}
    >
      <span>{option.icon}</span>
      <span className="text-xs mt-0.5">{option.label}</span>
    </button>
  );
}

// Backwards-compatible re-exports
/** @deprecated Use UnitOption instead */
export type ShapeOption = UnitOption;
/** @deprecated Use UNIT_OPTIONS instead */
export const SHAPE_OPTIONS = UNIT_OPTIONS;
/** @deprecated Use UnitThumbnail instead */
export const ShapeThumbnail = UnitThumbnail;
