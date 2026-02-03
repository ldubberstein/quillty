'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

// Dynamic import for FabricPanel
const FabricPanel = dynamic(
  () => import('@/components/block-designer/FabricPanel').then((mod) => mod.FabricPanel),
  { ssr: false }
);

export default function BlockDesignerPage() {
  const initBlock = useBlockDesignerStore((state) => state.initBlock);
  const block = useBlockDesignerStore((state) => state.block);
  const mode = useBlockDesignerStore((state) => state.mode);
  const [showFabricPanel, setShowFabricPanel] = useState(true);

  // Initialize a new block on mount
  useEffect(() => {
    // Only init if the block has no shapes (fresh start)
    if (block.shapes.length === 0 && block.title === '') {
      initBlock(DEFAULT_GRID_SIZE);
    }
  }, [initBlock, block.shapes.length, block.title]);

  const isPaintMode = mode === 'paint_mode';

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

          {/* Fabric panel toggle */}
          <button
            onClick={() => setShowFabricPanel((prev) => !prev)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showFabricPanel
                ? 'text-white bg-blue-500 hover:bg-blue-600'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
            aria-label={showFabricPanel ? 'Hide fabric panel' : 'Show fabric panel'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                  clipRule="evenodd"
                />
              </svg>
              Fabrics
            </span>
          </button>

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

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex relative">
        {/* Canvas */}
        <div className="flex-1 min-w-0 relative">
          <BlockCanvas />
        </div>

        {/* Fabric Panel Sidebar */}
        {showFabricPanel && (
          <aside className="w-64 flex-shrink-0 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <FabricPanel />
          </aside>
        )}
      </main>

      {/* Footer hint */}
      <footer className="px-4 py-2 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          {isPaintMode
            ? 'Tap shapes to paint them with the selected fabric'
            : 'Tap a cell to add a shape • Scroll to zoom • Drag to pan'}
        </p>
      </footer>
    </div>
  );
}
