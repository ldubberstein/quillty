'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, AlertTriangle, X } from 'lucide-react';
import { useBlockDesignerStore, useBlockGridSize, GRID_SIZES, type GridSize, type Shape } from '@quillty/core';

interface ConfirmationDialogProps {
  newSize: GridSize;
  shapesToRemove: Shape[];
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({ newSize, shapesToRemove, onConfirm, onCancel }: ConfirmationDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  const shapeCount = shapesToRemove.length;
  const shapeWord = shapeCount === 1 ? 'shape' : 'shapes';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Remove Shapes?</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600">
            Changing to a {newSize}×{newSize} grid will remove{' '}
            <span className="font-medium text-gray-900">{shapeCount} {shapeWord}</span>{' '}
            that {shapeCount === 1 ? 'is' : 'are'} outside the new grid bounds.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            You can undo this action if needed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Remove & Resize
          </button>
        </div>
      </div>
    </div>
  );
}

export function GridSizeSelector() {
  const gridSize = useBlockGridSize();
  const setGridSize = useBlockDesignerStore((state) => state.setGridSize);
  const getShapesOutOfBounds = useBlockDesignerStore((state) => state.getShapesOutOfBounds);

  const [isOpen, setIsOpen] = useState(false);
  const [pendingSize, setPendingSize] = useState<GridSize | null>(null);
  const [shapesToRemove, setShapesToRemove] = useState<Shape[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelectSize = useCallback((size: GridSize) => {
    if (size === gridSize) {
      setIsOpen(false);
      return;
    }

    // Check if any shapes would be removed
    const outOfBounds = getShapesOutOfBounds(size);

    if (outOfBounds.length > 0) {
      // Show confirmation dialog
      setPendingSize(size);
      setShapesToRemove(outOfBounds);
      setIsOpen(false);
    } else {
      // No shapes affected, apply immediately
      setGridSize(size);
      setIsOpen(false);
    }
  }, [gridSize, getShapesOutOfBounds, setGridSize]);

  const handleConfirmResize = useCallback(() => {
    if (pendingSize !== null) {
      setGridSize(pendingSize);
      setPendingSize(null);
      setShapesToRemove([]);
    }
  }, [pendingSize, setGridSize]);

  const handleCancelResize = useCallback(() => {
    setPendingSize(null);
    setShapesToRemove([]);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Change grid size"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span>{gridSize}×{gridSize} grid</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[100px]"
            role="listbox"
            aria-label="Grid size options"
          >
            {GRID_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => handleSelectSize(size)}
                className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 transition-colors ${
                  size === gridSize ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={size === gridSize}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {pendingSize !== null && shapesToRemove.length > 0 && (
        <ConfirmationDialog
          newSize={pendingSize}
          shapesToRemove={shapesToRemove}
          onConfirm={handleConfirmResize}
          onCancel={handleCancelResize}
        />
      )}
    </>
  );
}
