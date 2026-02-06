'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMyPublishedBlocks } from '@quillty/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  usePatternDesignerStore,
  useSelectedLibraryBlockId,
  useBlockInstances,
  usePatternPalette,
  DEFAULT_PALETTE,
  migrateUnits,
} from '@quillty/core';
import type { Block as CoreBlock, Unit, Palette, PaletteOverrides } from '@quillty/core';
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

// =============================================================================
// "In This Pattern" Section - Shows blocks with color variants
// =============================================================================

interface VariantItemProps {
  block: CoreBlock;
  overrides: PaletteOverrides;
  index: number;
  palette: Palette;
  onSelect: (blockId: string, overrides: PaletteOverrides) => void;
}

function VariantItem({ block, overrides, index, palette, onSelect }: VariantItemProps) {
  // Create merged palette for preview (pattern palette + overrides)
  const mergedPalette = useMemo(
    () => ({
      roles: palette.roles.map((role) => ({
        ...role,
        color: overrides[role.id] ?? role.color,
      })),
    }),
    [palette, overrides]
  );

  const handleClick = () => {
    onSelect(block.id, overrides);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 w-full"
      title={`Variant ${index + 1}`}
    >
      <BlockThumbnail
        units={block.units}
        gridSize={block.gridSize}
        palette={mergedPalette}
        size={32}
      />
      <span className="text-xs text-gray-500">Variant {index + 1}</span>
      <span className="w-2 h-2 rounded-full bg-purple-500 ml-auto" title="Custom colors" />
    </button>
  );
}

interface BlockWithVariantsProps {
  blockId: string;
}

function BlockInPattern({ blockId }: BlockWithVariantsProps) {
  const block = usePatternDesignerStore((s) => s.blockCache[blockId]);
  const selectLibraryBlock = usePatternDesignerStore((s) => s.selectLibraryBlock);
  const selectVariantForPlacement = usePatternDesignerStore((s) => s.selectVariantForPlacement);
  const selectedLibraryBlockId = useSelectedLibraryBlockId();
  const palette = usePatternPalette();

  // Get variants - memoize the serialized key to prevent unnecessary re-renders
  const blockInstances = useBlockInstances();
  const variants = useMemo(() => {
    const instances = blockInstances.filter(
      (i) => i.blockId === blockId && i.paletteOverrides
    );
    const uniqueOverrides = new Map<string, PaletteOverrides>();
    for (const instance of instances) {
      if (instance.paletteOverrides && Object.keys(instance.paletteOverrides).length > 0) {
        const key = JSON.stringify(instance.paletteOverrides);
        uniqueOverrides.set(key, instance.paletteOverrides);
      }
    }
    return Array.from(uniqueOverrides.values());
  }, [blockInstances, blockId]);

  // Debounce variants to prevent flicker during rapid color changes (100ms)
  // Serialize to string for stable comparison, then parse back
  const variantsKey = useMemo(() => JSON.stringify(variants), [variants]);
  const debouncedKey = useDebouncedValue(variantsKey, 100);
  const debouncedVariants = useMemo<PaletteOverrides[]>(() => {
    try {
      return JSON.parse(debouncedKey);
    } catch {
      return [];
    }
  }, [debouncedKey]);

  // Don't render if block isn't cached or has no units
  if (!block || !block.units) return null;

  const isSelected = selectedLibraryBlockId === blockId;

  const handleSelectBlock = () => {
    selectLibraryBlock(blockId);
  };

  const handleSelectVariant = useCallback(
    (variantBlockId: string, overrides: PaletteOverrides) => {
      selectVariantForPlacement(variantBlockId, overrides);
    },
    [selectVariantForPlacement]
  );

  return (
    <div className="space-y-1">
      {/* Parent block (pattern palette) - clickable to select for placement */}
      <button
        onClick={handleSelectBlock}
        className={`flex items-center gap-2 px-1 py-1 rounded w-full hover:bg-gray-100 ${
          isSelected ? 'bg-blue-50 ring-1 ring-blue-500' : ''
        }`}
      >
        <BlockThumbnail
          units={block.units}
          gridSize={block.gridSize}
          palette={palette}
          size={40}
        />
        <span className="text-xs text-gray-600 truncate flex-1 text-left">{block.title}</span>
      </button>

      {/* Variants (with overrides) - shown if any exist, debounced to prevent flicker */}
      {debouncedVariants.length > 0 && (
        <div className="ml-4 space-y-1">
          {debouncedVariants.map((overrides, i) => (
            <VariantItem
              key={JSON.stringify(overrides)}
              block={block}
              overrides={overrides}
              index={i + 1}
              palette={palette}
              onSelect={handleSelectVariant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InThisPatternSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const blockInstances = useBlockInstances();
  const blockCache = usePatternDesignerStore((s) => s.blockCache);

  // Get unique blocks used in pattern
  const uniqueBlockIds = useMemo(() => {
    return [...new Set(blockInstances.map((i) => i.blockId))];
  }, [blockInstances]);

  // Don't render if no blocks in pattern
  if (uniqueBlockIds.length === 0) return null;

  // Don't render if blocks aren't cached yet
  const hasAllBlocksCached = uniqueBlockIds.every((id) => blockCache[id]);
  if (!hasAllBlocksCached) return null;

  return (
    <div className="border-b border-gray-100">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>In This Pattern</span>
        <span className="ml-auto text-gray-400">{uniqueBlockIds.length}</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {uniqueBlockIds.map((blockId) => (
            <BlockInPattern key={blockId} blockId={blockId} />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // Parse design_data from block (stored as JSON in database)
  const parseBlockDesignData = useCallback((block: Block): { units: Unit[]; previewPalette: Palette } => {
    if (!block.design_data) {
      return { units: [], previewPalette: DEFAULT_PALETTE };
    }
    try {
      const designData =
        typeof block.design_data === 'string'
          ? JSON.parse(block.design_data)
          : block.design_data;
      return {
        // Support legacy format where units were stored as "shapes"
        units: migrateUnits(designData.units ?? designData.shapes ?? []),
        previewPalette: designData.previewPalette ?? DEFAULT_PALETTE,
      };
    } catch {
      return { units: [], previewPalette: DEFAULT_PALETTE };
    }
  }, []);

  const handleSelectBlock = useCallback(
    (block: Block) => {
      selectLibraryBlock(block.id);
      // Transform API block to CoreBlock format for caching
      const { units, previewPalette } = parseBlockDesignData(block);
      const coreBlock: CoreBlock = {
        id: block.id,
        creatorId: block.creator_id || '',
        derivedFromBlockId: null,
        title: block.name,
        description: null,
        hashtags: [],
        gridSize: block.grid_size || 3,
        units,
        previewPalette,
        fabricRequirements: [],
        cuttingInstructions: [],
        createdAt: block.created_at || new Date().toISOString(),
        updatedAt: block.updated_at || new Date().toISOString(),
      };
      cacheBlock(coreBlock);
    },
    [selectLibraryBlock, cacheBlock, parseBlockDesignData]
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


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Blocks
        </h3>
      </div>

      {/* "In This Pattern" section - shows blocks with color variants */}
      <InThisPatternSection />

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
                  const { units, previewPalette } = parseBlockDesignData(block);
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
                          units={units}
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
