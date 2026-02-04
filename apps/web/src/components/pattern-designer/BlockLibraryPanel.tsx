'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMyPublishedBlocks } from '@quillty/api';
import { usePatternDesignerStore, useSelectedLibraryBlockId, DEFAULT_PALETTE } from '@quillty/core';
import type { Block as CoreBlock, Shape, Palette } from '@quillty/core';
import type { Block } from '@quillty/api';

// Dynamic import for BlockThumbnail (uses Konva)
const BlockThumbnail = dynamic(
  () => import('./BlockThumbnail').then((mod) => mod.BlockThumbnail),
  { ssr: false }
);

type TabId = 'my-blocks' | 'saved' | 'platform';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'my-blocks', label: 'My Blocks' },
  { id: 'saved', label: 'Saved' },
  { id: 'platform', label: 'Browse' },
];

/**
 * BlockLibraryPanel - Vertical sidebar for selecting blocks to place
 *
 * Follows the Figma/Canva pattern:
 * - Left sidebar with assets (blocks) to drag/click onto canvas
 * - Tabs for different block sources
 * - Blocks shown in a grid layout
 */
export function BlockLibraryPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('my-blocks');

  const selectedLibraryBlockId = useSelectedLibraryBlockId();
  const selectLibraryBlock = usePatternDesignerStore((state) => state.selectLibraryBlock);
  const cacheBlock = usePatternDesignerStore((state) => state.cacheBlock);
  const fillEmpty = usePatternDesignerStore((state) => state.fillEmpty);
  const clearSelections = usePatternDesignerStore((state) => state.clearSelections);
  const setPreviewingFillEmpty = usePatternDesignerStore((state) => state.setPreviewingFillEmpty);

  // Fetch user's published blocks
  const { data: blocksResponse, isLoading, error } = useMyPublishedBlocks();
  const blocks = blocksResponse?.data ?? [];

  const handleSelectBlock = useCallback(
    (block: Block) => {
      selectLibraryBlock(block.id);
      // Cache the block for rendering in the canvas
      cacheBlock(block as unknown as CoreBlock);
    },
    [selectLibraryBlock, cacheBlock]
  );

  const handleFillEmpty = useCallback(() => {
    setPreviewingFillEmpty(false);
    fillEmpty();
  }, [fillEmpty, setPreviewingFillEmpty]);

  const handleCancelSelection = useCallback(() => {
    setPreviewingFillEmpty(false);
    clearSelections();
  }, [clearSelections, setPreviewingFillEmpty]);

  const handleFillEmptyMouseEnter = useCallback(() => {
    setPreviewingFillEmpty(true);
  }, [setPreviewingFillEmpty]);

  const handleFillEmptyMouseLeave = useCallback(() => {
    setPreviewingFillEmpty(false);
  }, [setPreviewingFillEmpty]);

  // Parse design_data from block (stored as JSON in database)
  const getBlockDesignData = (block: Block): { shapes: Shape[]; previewPalette: Palette } => {
    if (!block.design_data) {
      return { shapes: [], previewPalette: DEFAULT_PALETTE };
    }
    try {
      const designData =
        typeof block.design_data === 'string'
          ? JSON.parse(block.design_data)
          : block.design_data;
      return {
        shapes: designData.shapes ?? [],
        previewPalette: designData.previewPalette ?? DEFAULT_PALETTE,
      };
    } catch {
      return { shapes: [], previewPalette: DEFAULT_PALETTE };
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Blocks
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'my-blocks' && (
          <>
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="text-xs text-gray-500">Loading...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 mb-2">Sign in to see your blocks</p>
                <a
                  href="/api/auth/signin"
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Sign in
                </a>
              </div>
            )}

            {!isLoading && !error && blocks.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 mb-2">No blocks yet</p>
                <a
                  href="/design/block"
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Create a block
                </a>
              </div>
            )}

            {!isLoading && !error && blocks.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block) => {
                  const { shapes, previewPalette } = getBlockDesignData(block);
                  return (
                    <div
                      key={block.id}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        selectedLibraryBlockId === block.id
                          ? 'bg-blue-50 ring-2 ring-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectBlock(block)}
                    >
                      <div className="flex justify-center">
                        <BlockThumbnail
                          shapes={shapes}
                          gridSize={block.grid_size || 3}
                          palette={previewPalette}
                          size={70}
                          isSelected={false}
                          onClick={() => handleSelectBlock(block)}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center truncate">
                        {block.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-gray-400 text-center">
              Save blocks from the platform to use them here
            </p>
          </div>
        )}

        {activeTab === 'platform' && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-gray-400 text-center">
              Browse community blocks
            </p>
          </div>
        )}
      </div>

      {/* Selected block actions */}
      {selectedLibraryBlockId && (
        <div className="border-t border-gray-100 px-3 py-2 bg-blue-50 space-y-2">
          <p className="text-xs text-blue-700 text-center">
            Click slots to place
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleFillEmpty}
              onMouseEnter={handleFillEmptyMouseEnter}
              onMouseLeave={handleFillEmptyMouseLeave}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Fill Empty
            </button>
            <button
              onClick={handleCancelSelection}
              className="p-1.5 text-gray-600 bg-white hover:bg-gray-100 rounded border border-gray-200 transition-colors"
              aria-label="Cancel selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
