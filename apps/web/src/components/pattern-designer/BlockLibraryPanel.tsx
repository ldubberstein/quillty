'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMyPublishedBlocks } from '@quillty/api';
import { usePatternDesignerStore, usePatternPalette, useSelectedLibraryBlockId } from '@quillty/core';
import type { Block as CoreBlock, Shape } from '@quillty/core';
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
  { id: 'platform', label: 'Platform' },
];

export function BlockLibraryPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('my-blocks');

  // Get pattern palette for rendering thumbnails
  const palette = usePatternPalette();
  const selectedLibraryBlockId = useSelectedLibraryBlockId();
  const selectLibraryBlock = usePatternDesignerStore((state) => state.selectLibraryBlock);
  const cacheBlock = usePatternDesignerStore((state) => state.cacheBlock);

  // Fetch user's published blocks
  const { data: blocksResponse, isLoading, error } = useMyPublishedBlocks();
  const blocks = blocksResponse?.data ?? [];

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelectBlock = useCallback(
    (block: Block) => {
      selectLibraryBlock(block.id);
      // Cache the block for rendering in the canvas
      cacheBlock(block as unknown as CoreBlock);
    },
    [selectLibraryBlock, cacheBlock]
  );

  // Parse design_data from block (stored as JSON in database)
  const getBlockShapes = (block: Block): Shape[] => {
    if (!block.design_data) return [];
    try {
      const designData =
        typeof block.design_data === 'string'
          ? JSON.parse(block.design_data)
          : block.design_data;
      return designData.shapes ?? [];
    } catch {
      return [];
    }
  };

  return (
    <div
      className={`bg-white border-t border-gray-200 transition-all duration-200 ${
        isExpanded ? 'h-44' : 'h-10'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleExpanded}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={isExpanded ? 'Collapse library' : 'Expand library'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">Block Library</span>
        </div>

        {/* Tabs */}
        {isExpanded && (
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)] overflow-hidden">
          {activeTab === 'my-blocks' && (
            <div className="h-full px-4 py-3 overflow-x-auto">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">Loading blocks...</div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-red-500">
                    Failed to load blocks. Please sign in.
                  </div>
                </div>
              )}

              {!isLoading && !error && blocks.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">No published blocks yet</p>
                    <a
                      href="/design/block"
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Create your first block
                    </a>
                  </div>
                </div>
              )}

              {!isLoading && !error && blocks.length > 0 && (
                <div className="flex gap-3 h-full items-center">
                  {blocks.map((block) => (
                    <div key={block.id} className="flex-shrink-0">
                      <BlockThumbnail
                        shapes={getBlockShapes(block)}
                        gridSize={block.grid_size || 3}
                        palette={palette}
                        size={80}
                        isSelected={selectedLibraryBlockId === block.id}
                        onClick={() => handleSelectBlock(block)}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-[80px]">
                        {block.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Saved blocks coming soon</p>
            </div>
          )}

          {activeTab === 'platform' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Platform blocks coming soon</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
