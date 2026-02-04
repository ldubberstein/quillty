'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePatternDesignerStore, useGridSize, useIsDirty } from '@quillty/core';
import { SizePicker } from '@/components/pattern-designer/SizePicker';

// Dynamic imports for components that use Konva
const PatternCanvas = dynamic(
  () => import('@/components/pattern-designer/PatternCanvas').then((mod) => mod.PatternCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    ),
  }
);

const BlockLibraryPanel = dynamic(
  () => import('@/components/pattern-designer/BlockLibraryPanel').then((mod) => mod.BlockLibraryPanel),
  { ssr: false }
);

export default function PatternDesignerPage() {
  const initPattern = usePatternDesignerStore((state) => state.initPattern);
  const pattern = usePatternDesignerStore((state) => state.pattern);
  const gridSize = useGridSize();
  const isDirty = useIsDirty();

  // Track if we're showing the size picker (on initial load)
  const [showSizePicker, setShowSizePicker] = useState(true);
  const hasInitialized = useRef(false);

  // Check if pattern is empty (just initialized)
  const isPatternEmpty = pattern.blockInstances.length === 0 && pattern.title === '';

  // On mount, check if we need to show size picker
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // If pattern already has content, don't show size picker
    if (!isPatternEmpty) {
      setShowSizePicker(false);
    }
  }, [isPatternEmpty]);

  // Handle size picker confirmation
  const handleSizeConfirm = useCallback(
    (rows: number, cols: number) => {
      initPattern({ rows, cols });
      setShowSizePicker(false);
    },
    [initPattern]
  );

  // Handle navigation back (with unsaved changes warning)
  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    // Navigate to home
    window.location.href = '/';
  }, [isDirty]);

  // Show size picker on initial load
  if (showSizePicker) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Back to home"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">New Pattern</h1>
          </div>
        </header>

        {/* Size Picker */}
        <main className="flex-1 flex items-center justify-center p-4">
          <SizePicker onConfirm={handleSizeConfirm} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Pattern Designer</h1>
          <div className="w-px h-6 bg-gray-200" />
          <span className="text-sm text-gray-500">
            {gridSize.rows}×{gridSize.cols} grid
          </span>
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
            title="Coming soon"
          >
            Save Draft
          </button>
        </div>
      </header>

      {/* Main Content: Two-sidebar layout (Figma pattern) */}
      <main className="flex-1 flex min-h-0">
        {/* Left Sidebar - Block Library */}
        <aside className="w-52 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <BlockLibraryPanel />
        </aside>

        {/* Center - Canvas (maximized for square-ish quilts) */}
        <div className="flex-1 min-w-0">
          <PatternCanvas />
        </div>

        {/* Right Sidebar - Colors/Tools (placeholder for now) */}
        <aside className="w-44 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Colors
          </h3>
          <p className="text-xs text-gray-400">
            Palette controls coming in iteration 2.6
          </p>
        </aside>
      </main>
    </div>
  );
}
