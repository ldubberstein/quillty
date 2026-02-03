'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect } from 'react';
import { useBlockDesignerStore, DEFAULT_GRID_SIZE } from '@quillty/core';

// Dynamic import for BlockCanvas (Konva requires browser APIs)
const BlockCanvas = dynamic(
  () => import('@/components/block-designer/BlockCanvas').then((mod) => mod.BlockCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    ),
  }
);

export default function BlockDesignerPage() {
  const initBlock = useBlockDesignerStore((state) => state.initBlock);
  const block = useBlockDesignerStore((state) => state.block);

  // Initialize a new block on mount
  useEffect(() => {
    // Only init if the block has no shapes (fresh start)
    if (block.shapes.length === 0 && block.title === '') {
      initBlock(DEFAULT_GRID_SIZE);
    }
  }, [initBlock, block.shapes.length, block.title]);

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
          <h1 className="text-lg font-semibold text-gray-900">Block Designer</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid size indicator */}
          <span className="text-sm text-gray-500">
            {block.gridSize}×{block.gridSize} grid
          </span>

          {/* Placeholder buttons */}
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled
          >
            Save Draft
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            disabled
          >
            Publish
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 min-h-0 relative">
        <BlockCanvas />
      </main>

      {/* Footer hint */}
      <footer className="px-4 py-2 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          Tap a cell to add a shape • Scroll to zoom • Drag to pan
        </p>
      </footer>
    </div>
  );
}
