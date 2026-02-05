'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PanelLeft, PanelRight } from 'lucide-react';
import { useBlockDesignerStore, DEFAULT_GRID_SIZE } from '@quillty/core';
import { UndoRedoControls } from '@/components/block-designer/UndoRedoControls';
import { GridSizeSelector } from '@/components/block-designer/GridSizeSelector';
import { PreviewControls } from '@/components/block-designer/PreviewControls';
import { SaveControls } from '@/components/block-designer/SaveControls';
import { ShapeLibraryPanel } from '@/components/block-designer/ShapeLibraryPanel';
import { SidebarProvider } from '@/components/shared';

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
  const router = useRouter();
  const initBlock = useBlockDesignerStore((state) => state.initBlock);
  const block = useBlockDesignerStore((state) => state.block);
  const mode = useBlockDesignerStore((state) => state.mode);
  const [showShapePanel, setShowShapePanel] = useState(true);
  const [showFabricPanel, setShowFabricPanel] = useState(true);
  const hasInitialized = useRef(false);

  // Handle successful publish - navigate to the block detail page
  const handlePublished = useCallback((blockId: string) => {
    router.push(`/blocks/${blockId}`);
  }, [router]);

  // Initialize a new block on mount (only once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Only init if the block is empty (fresh start)
    if (block.shapes.length === 0 && block.title === '') {
      initBlock(DEFAULT_GRID_SIZE);
    }
  }, [initBlock, block.shapes.length, block.title]);

  const isPaintMode = mode === 'paint_mode';
  const isPreviewMode = mode === 'preview';
  const isPlacingShape = mode === 'placing_shape';
  const isPlacingFlyingGeese = mode === 'placing_flying_geese_second';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Left sidebar toggle */}
          <button
            onClick={() => setShowShapePanel((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showShapePanel
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label={showShapePanel ? 'Hide shapes panel' : 'Show shapes panel'}
            title={showShapePanel ? 'Hide shapes panel' : 'Show shapes panel'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

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
          <div className="w-px h-6 bg-gray-200" />
          <UndoRedoControls />
        </div>

        <div className="flex items-center gap-3">
          {/* Grid size selector */}
          <GridSizeSelector />

          {/* Preview mode controls */}
          <PreviewControls />

          {/* Sidebar toggle */}
          <button
            onClick={() => setShowFabricPanel((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showFabricPanel
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label={showFabricPanel ? 'Hide sidebar' : 'Show sidebar'}
            title={showFabricPanel ? 'Hide sidebar' : 'Show sidebar'}
          >
            <PanelRight className="w-5 h-5" />
          </button>

          {/* Save and Publish controls */}
          <SaveControls onPublished={handlePublished} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex relative">
        {/* Left Sidebar - Shapes Library */}
        {showShapePanel && (
          <aside className="w-48 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <ShapeLibraryPanel />
          </aside>
        )}

        {/* Canvas */}
        <div className="flex-1 min-w-0 relative">
          <BlockCanvas />
        </div>

        {/* Right Sidebar - Fabrics */}
        {showFabricPanel && (
          <aside className="w-48 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
            <SidebarProvider defaultPanels={['fabrics']} mode="multi">
              <FabricPanel />
            </SidebarProvider>
          </aside>
        )}
      </main>

      {/* Footer hint */}
      <footer className="px-4 py-2 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          {isPreviewMode
            ? 'Preview mode • Tap anywhere on the canvas to return to editing'
            : isPaintMode
              ? 'Tap shapes to paint them with the selected fabric'
              : isPlacingFlyingGeese
                ? 'Tap an adjacent cell to complete Flying Geese'
                : isPlacingShape
                  ? 'Tap cells to place shape • Click shape again to deselect'
                  : 'Select a shape from the left panel • Scroll to zoom • Drag to pan'}
        </p>
      </footer>
    </div>
  );
}
