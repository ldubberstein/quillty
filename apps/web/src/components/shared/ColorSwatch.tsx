'use client';

import { useCallback, useState, useRef, useEffect } from 'react';

/** Size variants for the color swatch */
export type ColorSwatchSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ColorSwatchSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export interface ColorSwatchProps {
  /** The color to display (hex format) */
  color: string;
  /** Size of the swatch */
  size?: ColorSwatchSize;
  /** Whether the swatch is selected (shows ring) */
  selected?: boolean;
  /** Called when color is changed via picker */
  onChange?: (color: string) => void;
  /** Called when swatch is clicked (for selection mode) */
  onClick?: (e: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the button */
  'aria-label'?: string;
}

/**
 * ColorSwatch - A reusable color button with optional color picker
 *
 * Used in both Pattern Designer and Block Designer for:
 * - Fabric role color editing
 * - Border fabric selection
 * - Collapsed panel color previews
 */
export function ColorSwatch({
  color,
  size = 'md',
  selected = false,
  onChange,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: ColorSwatchProps) {
  const [isEditing, setIsEditing] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Open color picker when editing starts
  useEffect(() => {
    if (isEditing && colorInputRef.current) {
      colorInputRef.current.click();
    }
  }, [isEditing]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        onClick(e);
      }
      if (onChange && !e.defaultPrevented) {
        e.stopPropagation();
        setIsEditing(true);
      }
    },
    [onClick, onChange]
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const handlePickerClose = useCallback(() => {
    setIsEditing(false);
  }, []);

  const sizeClass = SIZE_CLASSES[size];
  const selectedClass = selected
    ? 'ring-2 ring-blue-500 ring-offset-1 scale-110'
    : '';
  const interactiveClass = (onClick || onChange)
    ? 'hover:scale-105 cursor-pointer'
    : '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={`
          ${sizeClass}
          rounded
          border-2 border-gray-300
          shadow-sm
          transition-transform
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${selectedClass}
          ${interactiveClass}
          ${className}
        `}
        style={{ backgroundColor: color }}
        aria-label={ariaLabel}
      />
      {isEditing && onChange && (
        <input
          ref={colorInputRef}
          type="color"
          value={color}
          onChange={handleColorChange}
          onBlur={handlePickerClose}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      )}
    </div>
  );
}
