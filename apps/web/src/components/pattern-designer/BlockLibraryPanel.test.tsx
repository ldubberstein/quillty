/**
 * BlockLibraryPanel Component Tests
 *
 * Tests for the block library sidebar panel that allows
 * users to select blocks to place on the pattern canvas.
 *
 * Key Iteration 2.6 requirement:
 * - Library thumbnails use block's original previewPalette, NOT pattern's palette
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { FabricRoleId, Palette } from '@quillty/core';

// Mock store functions
const mockSelectLibraryBlock = vi.fn();
const mockCacheBlock = vi.fn();
const mockFillEmpty = vi.fn();
const mockClearSelections = vi.fn();
const mockSetPreviewingFillEmpty = vi.fn();

// Capture calls to BlockThumbnail
const thumbnailCalls: Array<{ palette: Palette; shapes: unknown[]; gridSize: number }> = [];

let mockSelectedLibraryBlockId: string | null = null;

// Mock block with its own palette (different from DEFAULT_PALETTE)
const mockBlockPalette: Palette = {
  id: 'block-original-palette',
  name: 'Block Original',
  roles: [
    { id: 'background' as FabricRoleId, name: 'Background', color: '#AABBCC' },
    { id: 'feature' as FabricRoleId, name: 'Feature', color: '#112233' },
    { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#445566' },
    { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#778899' },
  ],
};

const mockBlocks = [
  {
    id: 'block-1',
    name: 'Test Block 1',
    grid_size: 3,
    design_data: JSON.stringify({
      shapes: [{ id: 'shape-1', type: 'square', gridPosition: { row: 0, col: 0 }, fabricRoleId: 'feature' }],
      previewPalette: mockBlockPalette,
    }),
  },
  {
    id: 'block-2',
    name: 'Test Block 2',
    grid_size: 4,
    design_data: {
      shapes: [{ id: 'shape-2', type: 'square', gridPosition: { row: 0, col: 0 }, fabricRoleId: 'accent1' }],
      previewPalette: mockBlockPalette,
    },
  },
];

// Mock API response
let mockApiResponse: { data: typeof mockBlocks | null; isLoading: boolean; error: Error | null } = {
  data: mockBlocks,
  isLoading: false,
  error: null,
};

// Pattern's palette (should NOT be used for library thumbnails)
const mockPatternPalette: Palette = {
  id: 'pattern-palette',
  name: 'Pattern',
  roles: [
    { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
    { id: 'feature' as FabricRoleId, name: 'Feature', color: '#000000' },
    { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#FF0000' },
    { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#00FF00' },
  ],
};

vi.mock('next/dynamic', () => ({
  default: () => {
    // Return a component that captures props and renders a test element
    const MockComponent = ({ palette, shapes, gridSize }: { palette: Palette; shapes: unknown[]; gridSize: number }) => {
      thumbnailCalls.push({ palette, shapes, gridSize });
      return (
        <div data-testid="block-thumbnail" data-palette-id={palette.id} data-grid-size={gridSize}>
          Mock Thumbnail
        </div>
      );
    };
    return MockComponent;
  },
}));

vi.mock('@quillty/api', () => ({
  useMyPublishedBlocks: vi.fn(() => ({
    data: mockApiResponse.data ? { data: mockApiResponse.data } : undefined,
    isLoading: mockApiResponse.isLoading,
    error: mockApiResponse.error,
  })),
}));

vi.mock('@quillty/core', () => ({
  usePatternDesignerStore: vi.fn((selector) => {
    const state = {
      selectLibraryBlock: mockSelectLibraryBlock,
      cacheBlock: mockCacheBlock,
      fillEmpty: mockFillEmpty,
      clearSelections: mockClearSelections,
      setPreviewingFillEmpty: mockSetPreviewingFillEmpty,
    };
    return selector ? selector(state) : state;
  }),
  useSelectedLibraryBlockId: vi.fn(() => mockSelectedLibraryBlockId),
  usePatternPalette: vi.fn(() => mockPatternPalette),
  DEFAULT_PALETTE: {
    id: 'default-palette',
    name: 'Default',
    roles: [
      { id: 'background' as FabricRoleId, name: 'Background', color: '#F5F5DC' },
      { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#8B4513' },
      { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#D4AF37' },
    ],
  },
}));

// Import after mocks are set up
import { BlockLibraryPanel } from './BlockLibraryPanel';

describe('BlockLibraryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    thumbnailCalls.length = 0;
    mockSelectedLibraryBlockId = null;
    mockApiResponse = {
      data: mockBlocks,
      isLoading: false,
      error: null,
    };
  });

  describe('rendering', () => {
    it('renders the panel with Blocks heading', () => {
      render(<BlockLibraryPanel />);
      expect(screen.getByText('Blocks')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<BlockLibraryPanel />);
      expect(screen.getByText('My Blocks')).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });

    it('shows loading state when fetching blocks', () => {
      mockApiResponse = { data: null, isLoading: true, error: null };
      render(<BlockLibraryPanel />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows sign in link when not authenticated', () => {
      mockApiResponse = { data: null, isLoading: false, error: new Error('Unauthorized') };
      render(<BlockLibraryPanel />);
      expect(screen.getByText('Sign in to see your blocks')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('shows empty state when user has no blocks', () => {
      mockApiResponse = { data: [], isLoading: false, error: null };
      render(<BlockLibraryPanel />);
      expect(screen.getByText('No blocks yet')).toBeInTheDocument();
      expect(screen.getByText('Create a block')).toBeInTheDocument();
    });

    it('renders block thumbnails when blocks exist', () => {
      render(<BlockLibraryPanel />);
      expect(screen.getAllByTestId('block-thumbnail')).toHaveLength(2);
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
      expect(screen.getByText('Test Block 2')).toBeInTheDocument();
    });
  });

  describe('Iteration 2.6: block uses its own palette', () => {
    it('passes block previewPalette to BlockThumbnail, NOT pattern palette', () => {
      render(<BlockLibraryPanel />);

      // BlockThumbnail should be called with the block's own palette
      expect(thumbnailCalls.length).toBe(2);

      // Verify the palette passed is the block's original palette, not the pattern's
      const thumbnails = screen.getAllByTestId('block-thumbnail');
      thumbnails.forEach((thumbnail) => {
        // Each thumbnail should use the block's original palette
        expect(thumbnail).toHaveAttribute('data-palette-id', 'block-original-palette');
        // It should NOT use the pattern's palette
        expect(thumbnail).not.toHaveAttribute('data-palette-id', 'pattern-palette');
      });
    });

    it('parses design_data string correctly to extract previewPalette', () => {
      render(<BlockLibraryPanel />);

      // First block has stringified design_data
      expect(thumbnailCalls.length).toBeGreaterThan(0);

      // Check that palette was correctly extracted
      const firstCallPalette = thumbnailCalls[0].palette;
      expect(firstCallPalette.id).toBe('block-original-palette');
    });

    it('handles design_data as object (not string)', () => {
      render(<BlockLibraryPanel />);

      // Second block has design_data as object (not stringified)
      expect(thumbnailCalls.length).toBeGreaterThan(1);

      // Check second call
      const secondCallPalette = thumbnailCalls[1].palette;
      expect(secondCallPalette.id).toBe('block-original-palette');
    });

    it('falls back to DEFAULT_PALETTE when design_data is missing', () => {
      mockApiResponse = {
        data: [{ id: 'block-no-design', name: 'No Design Block', grid_size: 3, design_data: null }],
        isLoading: false,
        error: null,
      };
      render(<BlockLibraryPanel />);

      expect(thumbnailCalls.length).toBe(1);

      // Should fall back to default palette
      const palette = thumbnailCalls[0].palette;
      expect(palette.id).toBe('default-palette');
    });

    it('falls back to DEFAULT_PALETTE when design_data is invalid JSON', () => {
      mockApiResponse = {
        data: [{ id: 'block-bad-json', name: 'Bad JSON Block', grid_size: 3, design_data: 'not valid json' }],
        isLoading: false,
        error: null,
      };
      render(<BlockLibraryPanel />);

      expect(thumbnailCalls.length).toBe(1);

      // Should fall back to default palette
      const palette = thumbnailCalls[0].palette;
      expect(palette.id).toBe('default-palette');
    });
  });

  describe('block selection', () => {
    it('calls selectLibraryBlock when clicking a block', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Test Block 1'));
      expect(mockSelectLibraryBlock).toHaveBeenCalledWith('block-1');
    });

    it('caches block when selected', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Test Block 1'));
      expect(mockCacheBlock).toHaveBeenCalled();
    });

    it('highlights selected block', () => {
      mockSelectedLibraryBlockId = 'block-1';
      render(<BlockLibraryPanel />);

      // The container div for the selected block should have ring class
      const block1Container = screen.getByText('Test Block 1').closest('.p-2');
      expect(block1Container?.className).toContain('ring-2');
      expect(block1Container?.className).toContain('ring-blue-500');
    });

    it('shows action buttons when a block is selected', () => {
      mockSelectedLibraryBlockId = 'block-1';
      render(<BlockLibraryPanel />);

      expect(screen.getByText('Click slots to place')).toBeInTheDocument();
      expect(screen.getByText('Fill Empty')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('fill empty action', () => {
    beforeEach(() => {
      mockSelectedLibraryBlockId = 'block-1';
    });

    it('calls fillEmpty when Fill Empty button is clicked', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Fill Empty'));
      expect(mockFillEmpty).toHaveBeenCalled();
    });

    it('disables preview when Fill Empty is clicked', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Fill Empty'));
      expect(mockSetPreviewingFillEmpty).toHaveBeenCalledWith(false);
    });

    it('enables preview on Fill Empty hover', () => {
      render(<BlockLibraryPanel />);
      fireEvent.mouseEnter(screen.getByText('Fill Empty'));
      expect(mockSetPreviewingFillEmpty).toHaveBeenCalledWith(true);
    });

    it('disables preview when mouse leaves Fill Empty', () => {
      render(<BlockLibraryPanel />);
      fireEvent.mouseEnter(screen.getByText('Fill Empty'));
      fireEvent.mouseLeave(screen.getByText('Fill Empty'));
      expect(mockSetPreviewingFillEmpty).toHaveBeenLastCalledWith(false);
    });
  });

  describe('cancel selection', () => {
    beforeEach(() => {
      mockSelectedLibraryBlockId = 'block-1';
    });

    it('calls clearSelections when Cancel is clicked', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockClearSelections).toHaveBeenCalled();
    });

    it('disables preview when Cancel is clicked', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockSetPreviewingFillEmpty).toHaveBeenCalledWith(false);
    });
  });

  describe('tabs', () => {
    it('shows Saved tab placeholder content', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Saved'));
      expect(screen.getByText('Save blocks from the platform to use them here')).toBeInTheDocument();
    });

    it('shows Browse tab placeholder content', () => {
      render(<BlockLibraryPanel />);
      fireEvent.click(screen.getByText('Browse'));
      expect(screen.getByText('Browse community blocks')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
      render(<BlockLibraryPanel />);

      // My Blocks should be active by default
      const myBlocksTab = screen.getByText('My Blocks');
      expect(myBlocksTab.className).toContain('text-blue-600');

      // Switch to Saved tab
      fireEvent.click(screen.getByText('Saved'));
      expect(screen.getByText('Saved').className).toContain('text-blue-600');
      expect(screen.getByText('My Blocks').className).not.toContain('text-blue-600');
    });
  });
});
