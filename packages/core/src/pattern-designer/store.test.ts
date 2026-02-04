/**
 * Pattern Designer Store Tests
 *
 * Tests for the Zustand store managing Pattern Designer state.
 * Focuses on core functionality including pattern management,
 * block placement, and block cache operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePatternDesignerStore } from './store';
import { DEFAULT_PALETTE } from '../block-designer/constants';
import type { Block } from '../block-designer/types';

// Helper to reset store state before each test
function resetStore() {
  usePatternDesignerStore.setState({
    pattern: {
      id: '',
      creatorId: '',
      title: '',
      description: null,
      hashtags: [],
      difficulty: 'beginner',
      category: null,
      gridSize: { rows: 4, cols: 4 },
      physicalSize: {
        widthInches: 48,
        heightInches: 48,
        blockSizeInches: 12,
      },
      palette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
      blockInstances: [],
      status: 'draft',
      isPremium: false,
      priceCents: null,
      publishedAt: null,
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    selectedBlockInstanceId: null,
    selectedLibraryBlockId: null,
    blockCache: {},
    mode: 'idle',
    isDirty: false,
    isPreviewingFillEmpty: false,
    previewingGridResize: null,
    gridResizePosition: 'end',
  });
}

// Mock block for testing
function createMockBlock(id: string): Block {
  return {
    id,
    creatorId: 'user-123',
    derivedFromBlockId: null,
    title: `Test Block ${id}`,
    description: null,
    hashtags: [],
    gridSize: 3,
    shapes: [],
    previewPalette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('PatternDesignerStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Pattern Management
  // ===========================================================================

  describe('initPattern', () => {
    it('creates a new pattern with specified grid size', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 5, cols: 6 });

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.gridSize.rows).toBe(5);
      expect(pattern.gridSize.cols).toBe(6);
      expect(pattern.blockInstances).toHaveLength(0);
      expect(pattern.status).toBe('draft');
    });

    it('resets all selection state', () => {
      const store = usePatternDesignerStore.getState();

      // Set up some state first
      store.selectLibraryBlock('block-123');

      // Now init a new pattern
      store.initPattern({ rows: 3, cols: 3 });

      const state = usePatternDesignerStore.getState();
      expect(state.selectedBlockInstanceId).toBeNull();
      expect(state.selectedLibraryBlockId).toBeNull();
      expect(state.mode).toBe('idle');
    });

    it('clears isDirty flag', () => {
      const store = usePatternDesignerStore.getState();

      // Mark as dirty
      usePatternDesignerStore.setState({ isDirty: true });

      // Init new pattern
      store.initPattern({ rows: 3, cols: 3 });

      expect(usePatternDesignerStore.getState().isDirty).toBe(false);
    });
  });

  // ===========================================================================
  // Block Cache (Record-based, not Map)
  // ===========================================================================

  describe('blockCache', () => {
    it('caches a block using Record syntax', () => {
      const store = usePatternDesignerStore.getState();
      const mockBlock = createMockBlock('block-1');

      store.cacheBlock(mockBlock);

      const cachedBlock = store.getCachedBlock('block-1');
      expect(cachedBlock).toBeDefined();
      expect(cachedBlock?.id).toBe('block-1');
      expect(cachedBlock?.title).toBe('Test Block block-1');
    });

    it('retrieves cached block by ID', () => {
      const store = usePatternDesignerStore.getState();
      const mockBlock1 = createMockBlock('block-1');
      const mockBlock2 = createMockBlock('block-2');

      store.cacheBlock(mockBlock1);
      store.cacheBlock(mockBlock2);

      expect(store.getCachedBlock('block-1')?.id).toBe('block-1');
      expect(store.getCachedBlock('block-2')?.id).toBe('block-2');
    });

    it('returns undefined for non-existent block', () => {
      const store = usePatternDesignerStore.getState();

      const result = store.getCachedBlock('non-existent');
      expect(result).toBeUndefined();
    });

    it('clears all cached blocks', () => {
      const store = usePatternDesignerStore.getState();
      store.cacheBlock(createMockBlock('block-1'));
      store.cacheBlock(createMockBlock('block-2'));

      store.clearBlockCache();

      expect(store.getCachedBlock('block-1')).toBeUndefined();
      expect(store.getCachedBlock('block-2')).toBeUndefined();
    });

    it('overwrites existing cached block with same ID', () => {
      const store = usePatternDesignerStore.getState();
      const block1 = createMockBlock('block-1');
      const block1Updated = { ...block1, title: 'Updated Title' };

      store.cacheBlock(block1);
      store.cacheBlock(block1Updated);

      expect(store.getCachedBlock('block-1')?.title).toBe('Updated Title');
    });
  });

  // ===========================================================================
  // Library Block Selection
  // ===========================================================================

  describe('selectLibraryBlock', () => {
    it('selects a library block and enters placing mode', () => {
      const store = usePatternDesignerStore.getState();

      store.selectLibraryBlock('block-123');

      const state = usePatternDesignerStore.getState();
      expect(state.selectedLibraryBlockId).toBe('block-123');
      expect(state.mode).toBe('placing_block');
    });

    it('clears canvas instance selection when selecting library block', () => {
      usePatternDesignerStore.setState({ selectedBlockInstanceId: 'instance-1' });

      usePatternDesignerStore.getState().selectLibraryBlock('block-123');

      expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBeNull();
    });
  });

  describe('clearSelections', () => {
    it('clears all selections and returns to idle mode', () => {
      const store = usePatternDesignerStore.getState();
      store.selectLibraryBlock('block-123');

      store.clearSelections();

      const state = usePatternDesignerStore.getState();
      expect(state.selectedLibraryBlockId).toBeNull();
      expect(state.selectedBlockInstanceId).toBeNull();
      expect(state.mode).toBe('idle');
    });
  });

  // ===========================================================================
  // Block Instance Placement
  // ===========================================================================

  describe('addBlockInstance', () => {
    it('adds a block instance at specified position', () => {
      const store = usePatternDesignerStore.getState();

      store.addBlockInstance('block-123', { row: 1, col: 2 });

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances).toHaveLength(1);
      expect(pattern.blockInstances[0].blockId).toBe('block-123');
      expect(pattern.blockInstances[0].position).toEqual({ row: 1, col: 2 });
    });

    it('creates instance with default rotation and flip values', () => {
      const store = usePatternDesignerStore.getState();

      store.addBlockInstance('block-123', { row: 0, col: 0 });

      const instance = usePatternDesignerStore.getState().pattern.blockInstances[0];
      expect(instance.rotation).toBe(0);
      expect(instance.flipHorizontal).toBe(false);
      expect(instance.flipVertical).toBe(false);
    });

    it('marks pattern as dirty after adding instance', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.addBlockInstance('block-123', { row: 0, col: 0 });

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('replaces existing instance when adding to occupied position', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 0, col: 0 });

      store.addBlockInstance('block-2', { row: 0, col: 0 });

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances).toHaveLength(1);
      expect(pattern.blockInstances[0].blockId).toBe('block-2');
    });
  });

  describe('isPositionOccupied', () => {
    it('returns false for empty position', () => {
      const store = usePatternDesignerStore.getState();

      expect(store.isPositionOccupied({ row: 0, col: 0 })).toBe(false);
    });

    it('returns true for occupied position', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 1, col: 2 });

      expect(store.isPositionOccupied({ row: 1, col: 2 })).toBe(true);
      expect(store.isPositionOccupied({ row: 0, col: 0 })).toBe(false);
    });
  });

  describe('removeBlockInstance', () => {
    it('removes a block instance by ID', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      store.removeBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
    });

    it('clears selection if removed instance was selected', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      store.selectBlockInstance(instanceId);

      store.removeBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBeNull();
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      usePatternDesignerStore.setState({ isDirty: false });

      store.removeBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('does nothing for non-existent instance', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const originalLength = usePatternDesignerStore.getState().pattern.blockInstances.length;

      store.removeBlockInstance('non-existent-id');

      expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(originalLength);
    });
  });

  // ===========================================================================
  // Block Instance Transformations
  // ===========================================================================

  describe('rotateBlockInstance', () => {
    it('cycles rotation through 0, 90, 180, 270', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      // Initial rotation is 0
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(0);

      store.rotateBlockInstance(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(90);

      store.rotateBlockInstance(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(180);

      store.rotateBlockInstance(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(270);

      store.rotateBlockInstance(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(0);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      usePatternDesignerStore.setState({ isDirty: false });

      store.rotateBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('does nothing for non-existent instance', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const originalRotation = usePatternDesignerStore.getState().pattern.blockInstances[0].rotation;

      store.rotateBlockInstance('non-existent-id');

      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(originalRotation);
    });
  });

  describe('flipBlockInstanceHorizontal', () => {
    it('toggles horizontal flip', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipHorizontal).toBe(false);

      store.flipBlockInstanceHorizontal(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipHorizontal).toBe(true);

      store.flipBlockInstanceHorizontal(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipHorizontal).toBe(false);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      usePatternDesignerStore.setState({ isDirty: false });

      store.flipBlockInstanceHorizontal(instanceId);

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });
  });

  describe('flipBlockInstanceVertical', () => {
    it('toggles vertical flip', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipVertical).toBe(false);

      store.flipBlockInstanceVertical(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipVertical).toBe(true);

      store.flipBlockInstanceVertical(instanceId);
      expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipVertical).toBe(false);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      usePatternDesignerStore.setState({ isDirty: false });

      store.flipBlockInstanceVertical(instanceId);

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });
  });

  // ===========================================================================
  // Palette
  // ===========================================================================

  describe('setRoleColor', () => {
    it('updates a palette role color', () => {
      const store = usePatternDesignerStore.getState();

      store.setRoleColor('background', '#FF0000');

      const { pattern } = usePatternDesignerStore.getState();
      const backgroundRole = pattern.palette.roles.find((r) => r.id === 'background');
      expect(backgroundRole?.color).toBe('#FF0000');
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.setRoleColor('background', '#FF0000');

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });
  });

  // ===========================================================================
  // Block Instance Selection (Iteration 2.4/2.5)
  // ===========================================================================

  describe('selectBlockInstance', () => {
    it('selects a placed block instance', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      store.selectBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBe(instanceId);
    });

    it('switches mode to editing_block when selecting an instance', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      store.selectBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().mode).toBe('editing_block');
    });

    it('clears library block selection when selecting an instance', () => {
      const store = usePatternDesignerStore.getState();
      store.selectLibraryBlock('library-block');
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;

      store.selectBlockInstance(instanceId);

      expect(usePatternDesignerStore.getState().selectedLibraryBlockId).toBeNull();
    });

    it('can deselect by passing null', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      store.selectBlockInstance(instanceId);

      store.selectBlockInstance(null);

      expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBeNull();
    });

    it('returns to idle mode when deselecting with no library block', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-123', { row: 0, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      store.selectBlockInstance(instanceId);

      store.selectBlockInstance(null);

      expect(usePatternDesignerStore.getState().mode).toBe('idle');
    });
  });

  // ===========================================================================
  // Fill Empty Preview (Iteration 2.4)
  // ===========================================================================

  describe('isPreviewingFillEmpty', () => {
    it('starts as false', () => {
      const state = usePatternDesignerStore.getState();
      expect(state.isPreviewingFillEmpty).toBe(false);
    });

    it('can be set to true via setPreviewingFillEmpty', () => {
      const store = usePatternDesignerStore.getState();

      store.setPreviewingFillEmpty(true);

      expect(usePatternDesignerStore.getState().isPreviewingFillEmpty).toBe(true);
    });

    it('can be toggled back to false', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingFillEmpty(true);

      store.setPreviewingFillEmpty(false);

      expect(usePatternDesignerStore.getState().isPreviewingFillEmpty).toBe(false);
    });
  });

  // ===========================================================================
  // Fill Operations
  // ===========================================================================

  describe('fillEmpty', () => {
    it('fills all empty slots with selected library block', () => {
      const store = usePatternDesignerStore.getState();
      // Set up 2x2 grid with one block placed
      store.initPattern({ rows: 2, cols: 2 });
      store.addBlockInstance('existing-block', { row: 0, col: 0 });

      // Select a library block and fill
      store.selectLibraryBlock('fill-block');
      const filledCount = store.fillEmpty();

      const { pattern } = usePatternDesignerStore.getState();
      expect(filledCount).toBe(3); // 2x2 = 4 slots, 1 was occupied, so 3 filled
      expect(pattern.blockInstances).toHaveLength(4);
    });

    it('returns 0 if no library block is selected', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 2, cols: 2 });

      const filledCount = store.fillEmpty();

      expect(filledCount).toBe(0);
      expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Grid Resize (Iteration 2.7)
  // ===========================================================================

  describe('gridResizePosition', () => {
    it('defaults to end', () => {
      expect(usePatternDesignerStore.getState().gridResizePosition).toBe('end');
    });

    it('can be changed to start', () => {
      const store = usePatternDesignerStore.getState();
      store.setGridResizePosition('start');
      expect(usePatternDesignerStore.getState().gridResizePosition).toBe('start');
    });

    it('can be changed back to end', () => {
      const store = usePatternDesignerStore.getState();
      store.setGridResizePosition('start');
      store.setGridResizePosition('end');
      expect(usePatternDesignerStore.getState().gridResizePosition).toBe('end');
    });
  });

  describe('addRow', () => {
    it('adds a row at the end by default', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });
      store.addBlockInstance('block-1', { row: 2, col: 0 });

      store.addRow();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.rows).toBe(4);
      // Block position should be unchanged
      expect(state.pattern.blockInstances[0].position.row).toBe(2);
    });

    it('adds a row at the start when position is start', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });
      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.setGridResizePosition('start');

      store.addRow();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.rows).toBe(4);
      // Block should be shifted down
      expect(state.pattern.blockInstances[0].position.row).toBe(1);
    });

    it('returns false when at max grid size', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 25, cols: 3 });

      const result = store.addRow();

      expect(result).toBe(false);
      expect(usePatternDesignerStore.getState().pattern.gridSize.rows).toBe(25);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      usePatternDesignerStore.setState({ isDirty: false });

      store.addRow();

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });
  });

  describe('removeRow', () => {
    it('removes a row from the end by default', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 4, cols: 3 });
      store.addBlockInstance('block-1', { row: 3, col: 0 }); // Block in last row

      store.removeRow();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.rows).toBe(3);
      // Block in last row should be removed
      expect(state.pattern.blockInstances).toHaveLength(0);
    });

    it('removes a row from the start when position is start', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 4, cols: 3 });
      store.addBlockInstance('block-1', { row: 0, col: 0 }); // Block in first row
      store.addBlockInstance('block-2', { row: 2, col: 0 }); // Block in row 2
      store.setGridResizePosition('start');

      store.removeRow();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.rows).toBe(3);
      // Block in first row should be removed
      expect(state.pattern.blockInstances).toHaveLength(1);
      // Remaining block should be shifted up
      expect(state.pattern.blockInstances[0].position.row).toBe(1);
    });

    it('returns false when at min grid size', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 2, cols: 3 });

      const result = store.removeRow();

      expect(result).toBe(false);
      expect(usePatternDesignerStore.getState().pattern.gridSize.rows).toBe(2);
    });

    it('clears selection if selected block was removed', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 4, cols: 3 });
      store.addBlockInstance('block-1', { row: 3, col: 0 });
      const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
      store.selectBlockInstance(instanceId);

      store.removeRow();

      expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBeNull();
    });
  });

  describe('addColumn', () => {
    it('adds a column at the end by default', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });
      store.addBlockInstance('block-1', { row: 0, col: 2 });

      store.addColumn();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.cols).toBe(4);
      // Block position should be unchanged
      expect(state.pattern.blockInstances[0].position.col).toBe(2);
    });

    it('adds a column at the start when position is start', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });
      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.setGridResizePosition('start');

      store.addColumn();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.cols).toBe(4);
      // Block should be shifted right
      expect(state.pattern.blockInstances[0].position.col).toBe(1);
    });

    it('returns false when at max grid size', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 25 });

      const result = store.addColumn();

      expect(result).toBe(false);
      expect(usePatternDesignerStore.getState().pattern.gridSize.cols).toBe(25);
    });
  });

  describe('removeColumn', () => {
    it('removes a column from the end by default', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 4 });
      store.addBlockInstance('block-1', { row: 0, col: 3 }); // Block in last column

      store.removeColumn();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.cols).toBe(3);
      // Block in last column should be removed
      expect(state.pattern.blockInstances).toHaveLength(0);
    });

    it('removes a column from the start when position is start', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 4 });
      store.addBlockInstance('block-1', { row: 0, col: 0 }); // Block in first column
      store.addBlockInstance('block-2', { row: 0, col: 2 }); // Block in column 2
      store.setGridResizePosition('start');

      store.removeColumn();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.gridSize.cols).toBe(3);
      // Block in first column should be removed
      expect(state.pattern.blockInstances).toHaveLength(1);
      // Remaining block should be shifted left
      expect(state.pattern.blockInstances[0].position.col).toBe(1);
    });

    it('returns false when at min grid size', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 2 });

      const result = store.removeColumn();

      expect(result).toBe(false);
      expect(usePatternDesignerStore.getState().pattern.gridSize.cols).toBe(2);
    });
  });

  describe('hasBlocksInRow', () => {
    it('returns true when row has blocks', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 2, col: 0 });

      expect(store.hasBlocksInRow(2)).toBe(true);
    });

    it('returns false when row is empty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 2, col: 0 });

      expect(store.hasBlocksInRow(0)).toBe(false);
      expect(store.hasBlocksInRow(1)).toBe(false);
      expect(store.hasBlocksInRow(3)).toBe(false);
    });
  });

  describe('hasBlocksInColumn', () => {
    it('returns true when column has blocks', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 0, col: 2 });

      expect(store.hasBlocksInColumn(2)).toBe(true);
    });

    it('returns false when column is empty', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 0, col: 2 });

      expect(store.hasBlocksInColumn(0)).toBe(false);
      expect(store.hasBlocksInColumn(1)).toBe(false);
      expect(store.hasBlocksInColumn(3)).toBe(false);
    });
  });

  describe('previewingGridResize', () => {
    it('defaults to null', () => {
      expect(usePatternDesignerStore.getState().previewingGridResize).toBeNull();
    });

    it('can be set to add-row', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingGridResize('add-row');
      expect(usePatternDesignerStore.getState().previewingGridResize).toBe('add-row');
    });

    it('can be set to remove-row', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingGridResize('remove-row');
      expect(usePatternDesignerStore.getState().previewingGridResize).toBe('remove-row');
    });

    it('can be set to add-col', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingGridResize('add-col');
      expect(usePatternDesignerStore.getState().previewingGridResize).toBe('add-col');
    });

    it('can be set to remove-col', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingGridResize('remove-col');
      expect(usePatternDesignerStore.getState().previewingGridResize).toBe('remove-col');
    });

    it('can be reset to null', () => {
      const store = usePatternDesignerStore.getState();
      store.setPreviewingGridResize('add-row');
      store.setPreviewingGridResize(null);
      expect(usePatternDesignerStore.getState().previewingGridResize).toBeNull();
    });
  });

});
