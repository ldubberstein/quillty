'use client';

import { useRef } from 'react';
import { RotateCw, FlipHorizontal2, FlipVertical2, Trash2 } from 'lucide-react';
import { useClickOutsideDismiss } from '@/hooks/useClickOutsideDismiss';
import { useEscapeDismiss } from '@/hooks/useEscapeDismiss';

interface FloatingToolbarProps {
  /** Screen position where toolbar should appear */
  position: { x: number; y: number };
  /** Whether the shape can be rotated (HST, Flying Geese) */
  canRotate: boolean;
  /** Whether the shape can be flipped (HST, Flying Geese) */
  canFlip: boolean;
  /** Callback when rotate is clicked */
  onRotate: () => void;
  /** Callback when flip horizontal is clicked */
  onFlipHorizontal: () => void;
  /** Callback when flip vertical is clicked */
  onFlipVertical: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
  /** Callback when toolbar is dismissed (click outside or Escape) */
  onDismiss: () => void;
}

/**
 * FloatingToolbar - Toolbar that appears above selected shapes
 *
 * Provides quick actions for shape manipulation:
 * - Rotate 90° clockwise
 * - Flip horizontally
 * - Flip vertically
 * - Delete shape
 */
export function FloatingToolbar({
  position,
  canRotate,
  canFlip,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onDelete,
  onDismiss,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useClickOutsideDismiss(toolbarRef, onDismiss);
  useEscapeDismiss(onDismiss);

  // Calculate position to keep toolbar within viewport
  const adjustedPosition = {
    x: Math.max(80, Math.min(position.x, window.innerWidth - 80)),
    y: Math.max(50, position.y),
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
      role="toolbar"
      aria-label="Shape tools"
    >
      {/* Rotate 90° */}
      {canRotate && (
        <button
          onClick={onRotate}
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Rotate 90°"
          aria-label="Rotate 90 degrees"
        >
          <RotateCw className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Flip Horizontal */}
      {canFlip && (
        <button
          onClick={onFlipHorizontal}
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Flip horizontal"
          aria-label="Flip horizontal"
        >
          <FlipHorizontal2 className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Flip Vertical */}
      {canFlip && (
        <button
          onClick={onFlipVertical}
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Flip vertical"
          aria-label="Flip vertical"
        >
          <FlipVertical2 className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Divider */}
      {(canRotate || canFlip) && <div className="w-px bg-gray-200 my-1" />}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-10 h-10 rounded hover:bg-red-50 focus:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        title="Delete shape"
        aria-label="Delete shape"
      >
        <Trash2 className="w-5 h-5 text-red-600" />
      </button>
    </div>
  );
}
