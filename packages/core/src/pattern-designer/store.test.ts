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
import { createUndoManagerState } from './history/undoManager';

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
      borderConfig: null,
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
    selectedBorderId: null,
    blockCache: {},
    mode: 'idle',
    isDirty: false,
    isPreviewingFillEmpty: false,
    previewingGridResize: null,
    gridResizePosition: 'end',
    undoManager: createUndoManagerState(),
    placementRotation: 0,
    rangeFillAnchor: null,
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

  describe('addBlockInstancesBatch', () => {
    it('adds multiple block instances at specified positions', () => {
      const store = usePatternDesignerStore.getState();
      const positions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ];

      const ids = store.addBlockInstancesBatch('block-123', positions);

      const { pattern } = usePatternDesignerStore.getState();
      expect(ids).toHaveLength(3);
      expect(pattern.blockInstances).toHaveLength(3);
      expect(pattern.blockInstances.every((b) => b.blockId === 'block-123')).toBe(true);
    });

    it('returns empty array for empty positions', () => {
      const store = usePatternDesignerStore.getState();

      const ids = store.addBlockInstancesBatch('block-123', []);

      expect(ids).toHaveLength(0);
      expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
    });

    it('places blocks at correct positions', () => {
      const store = usePatternDesignerStore.getState();
      const positions = [
        { row: 0, col: 2 },
        { row: 2, col: 1 },
      ];

      store.addBlockInstancesBatch('block-123', positions);

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances[0].position).toEqual({ row: 0, col: 2 });
      expect(pattern.blockInstances[1].position).toEqual({ row: 2, col: 1 });
    });

    it('generates unique IDs for each instance', () => {
      const store = usePatternDesignerStore.getState();
      const positions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];

      const ids = store.addBlockInstancesBatch('block-123', positions);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('replaces existing instances at occupied positions', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('old-block', { row: 0, col: 0 });

      store.addBlockInstancesBatch('new-block', [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ]);

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances).toHaveLength(2);
      expect(pattern.blockInstances.find((b) => b.position.row === 0 && b.position.col === 0)?.blockId).toBe('new-block');
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.addBlockInstancesBatch('block-123', [{ row: 0, col: 0 }]);

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('uses specified rotation', () => {
      const store = usePatternDesignerStore.getState();

      store.addBlockInstancesBatch('block-123', [{ row: 0, col: 0 }, { row: 0, col: 1 }], 90);

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances.every((b) => b.rotation === 90)).toBe(true);
    });

    it('uses default rotation of 0', () => {
      const store = usePatternDesignerStore.getState();

      store.addBlockInstancesBatch('block-123', [{ row: 0, col: 0 }]);

      const { pattern } = usePatternDesignerStore.getState();
      expect(pattern.blockInstances[0].rotation).toBe(0);
    });

    it('sets default flip values to false', () => {
      const store = usePatternDesignerStore.getState();

      store.addBlockInstancesBatch('block-123', [{ row: 0, col: 0 }]);

      const instance = usePatternDesignerStore.getState().pattern.blockInstances[0];
      expect(instance.flipHorizontal).toBe(false);
      expect(instance.flipVertical).toBe(false);
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

  describe('addRole', () => {
    it('adds a new role with auto-generated ID', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      const newId = store.addRole();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.palette.roles.length).toBe(initialCount + 1);
      expect(newId).toBeTruthy();
      expect(state.pattern.palette.roles.find((r) => r.id === newId)).toBeDefined();
    });

    it('uses provided name when specified', () => {
      const store = usePatternDesignerStore.getState();

      const newId = store.addRole('My Custom Color');

      const state = usePatternDesignerStore.getState();
      const newRole = state.pattern.palette.roles.find((r) => r.id === newId);
      expect(newRole?.name).toBe('My Custom Color');
    });

    it('uses provided color when specified', () => {
      const store = usePatternDesignerStore.getState();

      const newId = store.addRole('Custom', '#ABCDEF');

      const state = usePatternDesignerStore.getState();
      const newRole = state.pattern.palette.roles.find((r) => r.id === newId);
      expect(newRole?.color).toBe('#ABCDEF');
    });

    it('generates unique IDs', () => {
      const store = usePatternDesignerStore.getState();

      const id1 = store.addRole('Test 1');
      const id2 = store.addRole('Test 2');
      const id3 = store.addRole('Test 3');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('returns empty string when at maximum roles', () => {
      const store = usePatternDesignerStore.getState();

      // Add roles until max (12 total, start with 4)
      for (let i = 0; i < 8; i++) {
        store.addRole(`Extra ${i}`);
      }

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(12);

      const result = store.addRole('Over limit');
      expect(result).toBe('');
      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(12);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.addRole();

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('can be undone', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      store.addRole('To be undone');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount + 1);

      store.undo();

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount);
    });

    it('can be redone after undo', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      const newId = store.addRole('Redo test');
      store.undo();

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount);

      store.redo();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.palette.roles.length).toBe(initialCount + 1);
      expect(state.pattern.palette.roles.find((r) => r.id === newId)).toBeDefined();
    });
  });

  describe('removeRole', () => {
    it('removes a role from the palette', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      store.removeRole('accent2');

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.palette.roles.length).toBe(initialCount - 1);
      expect(state.pattern.palette.roles.find((r) => r.id === 'accent2')).toBeUndefined();
    });

    it('does nothing when trying to remove last role', () => {
      const store = usePatternDesignerStore.getState();

      // Remove all but one role
      store.removeRole('accent2');
      store.removeRole('accent1');
      store.removeRole('feature');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(1);

      // Try to remove the last one
      store.removeRole('background');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(1);
    });

    it('does nothing when role not found', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      store.removeRole('non-existent-role');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount);
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.removeRole('accent2');

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('can be undone', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      store.removeRole('accent2');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount - 1);

      store.undo();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.palette.roles.length).toBe(initialCount);
      expect(state.pattern.palette.roles.find((r) => r.id === 'accent2')).toBeDefined();
    });

    it('can be redone after undo', () => {
      const store = usePatternDesignerStore.getState();
      const initialCount = store.pattern.palette.roles.length;

      store.removeRole('accent2');
      store.undo();

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(initialCount);

      store.redo();

      const state = usePatternDesignerStore.getState();
      expect(state.pattern.palette.roles.length).toBe(initialCount - 1);
      expect(state.pattern.palette.roles.find((r) => r.id === 'accent2')).toBeUndefined();
    });
  });

  describe('renameRole', () => {
    it('renames a role', () => {
      const store = usePatternDesignerStore.getState();

      store.renameRole('background', 'Main Fabric');

      const state = usePatternDesignerStore.getState();
      const bgRole = state.pattern.palette.roles.find((r) => r.id === 'background');
      expect(bgRole?.name).toBe('Main Fabric');
    });

    it('does nothing if role not found', () => {
      const store = usePatternDesignerStore.getState();
      const before = store.pattern.palette.roles.map((r) => ({ ...r }));

      store.renameRole('non-existent', 'New Name');

      const after = usePatternDesignerStore.getState().pattern.palette.roles;
      for (let i = 0; i < before.length; i++) {
        expect(after[i].name).toBe(before[i].name);
      }
    });

    it('marks pattern as dirty', () => {
      const store = usePatternDesignerStore.getState();
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);

      store.renameRole('background', 'New Name');

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);
    });

    it('can be undone', () => {
      const store = usePatternDesignerStore.getState();
      const originalName = store.pattern.palette.roles.find((r) => r.id === 'background')?.name;

      store.renameRole('background', 'Renamed');

      expect(
        usePatternDesignerStore.getState().pattern.palette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe('Renamed');

      store.undo();

      expect(
        usePatternDesignerStore.getState().pattern.palette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe(originalName);
    });

    it('can be redone after undo', () => {
      const store = usePatternDesignerStore.getState();

      store.renameRole('background', 'Renamed');
      store.undo();
      store.redo();

      expect(
        usePatternDesignerStore.getState().pattern.palette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe('Renamed');
    });
  });

  describe('canRemoveRole', () => {
    it('returns true when more than one role exists', () => {
      const store = usePatternDesignerStore.getState();

      expect(store.canRemoveRole()).toBe(true);
    });

    it('returns false when only one role exists', () => {
      const store = usePatternDesignerStore.getState();

      // Remove all but one role
      store.removeRole('accent2');
      store.removeRole('accent1');
      store.removeRole('feature');

      expect(usePatternDesignerStore.getState().pattern.palette.roles.length).toBe(1);
      expect(usePatternDesignerStore.getState().canRemoveRole()).toBe(false);
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

  // ===========================================================================
  // Iteration 2.8: Save & Publish Selectors
  // ===========================================================================

  describe('emptySlotCount (computed)', () => {
    it('returns total slots when grid is empty', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });

      const state = usePatternDesignerStore.getState();
      const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
      const emptySlots = totalSlots - state.pattern.blockInstances.length;

      expect(emptySlots).toBe(9); // 3x3 = 9 slots, all empty
    });

    it('returns correct count when some slots are filled', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 3, cols: 3 });
      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.addBlockInstance('block-2', { row: 1, col: 1 });

      const state = usePatternDesignerStore.getState();
      const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
      const emptySlots = totalSlots - state.pattern.blockInstances.length;

      expect(emptySlots).toBe(7); // 9 - 2 = 7 empty
    });

    it('returns 0 when all slots are filled', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 2, cols: 2 });

      // Fill all slots
      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.addBlockInstance('block-2', { row: 0, col: 1 });
      store.addBlockInstance('block-3', { row: 1, col: 0 });
      store.addBlockInstance('block-4', { row: 1, col: 1 });

      const state = usePatternDesignerStore.getState();
      const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
      const emptySlots = totalSlots - state.pattern.blockInstances.length;

      expect(emptySlots).toBe(0);
    });
  });

  describe('canPublish (computed)', () => {
    it('returns false when grid has empty slots', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 2, cols: 2 });

      // Only fill some slots
      store.addBlockInstance('block-1', { row: 0, col: 0 });

      const state = usePatternDesignerStore.getState();
      const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
      const filledSlots = state.pattern.blockInstances.length;
      const canPublish = filledSlots === totalSlots;

      expect(canPublish).toBe(false);
    });

    it('returns true when all slots are filled (title validated in modal)', () => {
      const store = usePatternDesignerStore.getState();
      store.initPattern({ rows: 2, cols: 2 });

      // Fill all slots - no title needed for canPublish
      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.addBlockInstance('block-2', { row: 0, col: 1 });
      store.addBlockInstance('block-3', { row: 1, col: 0 });
      store.addBlockInstance('block-4', { row: 1, col: 1 });

      const state = usePatternDesignerStore.getState();
      const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
      const filledSlots = state.pattern.blockInstances.length;
      const canPublish = filledSlots === totalSlots;

      expect(canPublish).toBe(true);
    });
  });

  describe('markAsSaved', () => {
    it('clears isDirty flag', () => {
      const store = usePatternDesignerStore.getState();
      store.addBlockInstance('block-1', { row: 0, col: 0 });

      expect(usePatternDesignerStore.getState().isDirty).toBe(true);

      store.markAsSaved();

      expect(usePatternDesignerStore.getState().isDirty).toBe(false);
    });

    it('sets pattern ID when provided', () => {
      const store = usePatternDesignerStore.getState();

      expect(usePatternDesignerStore.getState().pattern.id).toBe('');

      store.markAsSaved('pattern-123');

      expect(usePatternDesignerStore.getState().pattern.id).toBe('pattern-123');
    });

    it('does not change pattern ID when not provided', () => {
      const store = usePatternDesignerStore.getState();
      store.markAsSaved('pattern-123');

      expect(usePatternDesignerStore.getState().pattern.id).toBe('pattern-123');

      store.addBlockInstance('block-1', { row: 0, col: 0 });
      store.markAsSaved(); // No ID provided

      expect(usePatternDesignerStore.getState().pattern.id).toBe('pattern-123');
      expect(usePatternDesignerStore.getState().isDirty).toBe(false);
    });
  });

  // ===========================================================================
  // Undo/Redo
  // ===========================================================================

  describe('undo/redo', () => {
    describe('canUndo/canRedo', () => {
      it('canUndo returns false initially', () => {
        const store = usePatternDesignerStore.getState();
        expect(store.canUndo()).toBe(false);
      });

      it('canRedo returns false initially', () => {
        const store = usePatternDesignerStore.getState();
        expect(store.canRedo()).toBe(false);
      });

      it('canUndo returns true after an action', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        expect(store.canUndo()).toBe(true);
      });

      it('canRedo returns true after undo', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.undo();
        expect(store.canRedo()).toBe(true);
      });
    });

    describe('addBlockInstance undo/redo', () => {
      it('undoes addBlockInstance', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(1);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
      });

      it('redoes addBlockInstance', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.undo();
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);

        store.redo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(1);
        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].blockId).toBe('block-1');
      });
    });

    describe('removeBlockInstance undo/redo', () => {
      it('undoes removeBlockInstance', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.removeBlockInstance(instanceId);
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(1);
        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].id).toBe(instanceId);
      });

      it('redoes removeBlockInstance', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.removeBlockInstance(instanceId);
        store.undo();
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(1);

        store.redo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
      });
    });

    describe('updateBlockInstance undo/redo', () => {
      it('undoes rotation change', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.rotateBlockInstance(instanceId);
        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(90);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].rotation).toBe(0);
      });

      it('undoes flip horizontal', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.flipBlockInstanceHorizontal(instanceId);
        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipHorizontal).toBe(true);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipHorizontal).toBe(false);
      });

      it('undoes flip vertical', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.flipBlockInstanceVertical(instanceId);
        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipVertical).toBe(true);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances[0].flipVertical).toBe(false);
      });
    });

    describe('setRoleColor undo/redo', () => {
      it('undoes palette color change', () => {
        const store = usePatternDesignerStore.getState();
        const originalColor = usePatternDesignerStore.getState().pattern.palette.roles.find(r => r.id === 'background')?.color;
        store.setRoleColor('background', '#FF0000');
        expect(usePatternDesignerStore.getState().pattern.palette.roles.find(r => r.id === 'background')?.color).toBe('#FF0000');

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.palette.roles.find(r => r.id === 'background')?.color).toBe(originalColor);
      });

      it('redoes palette color change', () => {
        const store = usePatternDesignerStore.getState();
        store.setRoleColor('background', '#FF0000');
        store.undo();

        store.redo();

        expect(usePatternDesignerStore.getState().pattern.palette.roles.find(r => r.id === 'background')?.color).toBe('#FF0000');
      });
    });

    describe('batch operations undo/redo', () => {
      it('undoes batch addBlockInstancesBatch as single operation', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstancesBatch('block-1', [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 0 },
        ]);
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(3);

        store.undo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
      });

      it('redoes batch addBlockInstancesBatch as single operation', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstancesBatch('block-1', [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ]);
        store.undo();

        store.redo();

        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(2);
      });
    });

    describe('multiple undo/redo cycles', () => {
      it('supports multiple undo operations in sequence', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.addBlockInstance('block-2', { row: 1, col: 0 });
        store.addBlockInstance('block-3', { row: 2, col: 0 });
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(3);

        store.undo();
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(2);

        store.undo();
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(1);

        store.undo();
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(0);
      });

      it('new action clears redo stack', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.undo();
        expect(store.canRedo()).toBe(true);

        store.addBlockInstance('block-2', { row: 1, col: 0 });
        expect(store.canRedo()).toBe(false);
      });
    });

    describe('undo clears selection if instance removed', () => {
      it('clears selection when undoing addBlockInstance removes selected instance', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId = usePatternDesignerStore.getState().pattern.blockInstances[0].id;
        store.selectBlockInstance(instanceId);
        expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBe(instanceId);

        store.undo();

        expect(usePatternDesignerStore.getState().selectedBlockInstanceId).toBeNull();
      });
    });

    describe('initPattern and loadPattern reset undo history', () => {
      it('initPattern clears undo history', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        expect(store.canUndo()).toBe(true);

        store.initPattern({ rows: 3, cols: 3 });

        expect(store.canUndo()).toBe(false);
      });

      it('loadPattern clears undo history', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        expect(store.canUndo()).toBe(true);

        store.loadPattern({
          id: 'loaded-pattern',
          creatorId: '',
          title: 'Loaded',
          description: null,
          hashtags: [],
          difficulty: 'beginner',
          category: null,
          gridSize: { rows: 3, cols: 3 },
          physicalSize: { widthInches: 36, heightInches: 36, blockSizeInches: 12 },
          palette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
          blockInstances: [],
          borderConfig: null,
          status: 'draft',
          isPremium: false,
          priceCents: null,
          publishedAt: null,
          thumbnailUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        expect(store.canUndo()).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Placement Rotation
  // ===========================================================================

  describe('placementRotation', () => {
    describe('rotatePlacementClockwise', () => {
      it('cycles rotation 0 -> 90 -> 180 -> 270 -> 0', () => {
        const store = usePatternDesignerStore.getState();
        expect(store.placementRotation).toBe(0);

        store.rotatePlacementClockwise();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(90);

        store.rotatePlacementClockwise();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(180);

        store.rotatePlacementClockwise();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(270);

        store.rotatePlacementClockwise();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(0);
      });
    });

    describe('resetPlacementRotation', () => {
      it('resets rotation to 0', () => {
        const store = usePatternDesignerStore.getState();
        store.rotatePlacementClockwise(); // 90
        store.rotatePlacementClockwise(); // 180
        expect(usePatternDesignerStore.getState().placementRotation).toBe(180);

        store.resetPlacementRotation();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(0);
      });
    });

    describe('selectLibraryBlock resets placementRotation', () => {
      it('resets rotation when selecting a new block', () => {
        const store = usePatternDesignerStore.getState();
        store.selectLibraryBlock('block-1');
        store.rotatePlacementClockwise(); // 90
        expect(usePatternDesignerStore.getState().placementRotation).toBe(90);

        store.selectLibraryBlock('block-2');
        expect(usePatternDesignerStore.getState().placementRotation).toBe(0);
      });

      it('resets rotation when deselecting block (null)', () => {
        const store = usePatternDesignerStore.getState();
        store.selectLibraryBlock('block-1');
        store.rotatePlacementClockwise(); // 90
        expect(usePatternDesignerStore.getState().placementRotation).toBe(90);

        store.selectLibraryBlock(null);
        expect(usePatternDesignerStore.getState().placementRotation).toBe(0);
      });
    });

    describe('clearSelections resets placementRotation', () => {
      it('resets rotation when clearing selections', () => {
        const store = usePatternDesignerStore.getState();
        store.selectLibraryBlock('block-1');
        store.rotatePlacementClockwise(); // 90
        expect(usePatternDesignerStore.getState().placementRotation).toBe(90);

        store.clearSelections();
        expect(usePatternDesignerStore.getState().placementRotation).toBe(0);
      });
    });

    describe('addBlockInstance uses placementRotation', () => {
      it('places block with specified rotation', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 }, 90);

        const instance = usePatternDesignerStore.getState().pattern.blockInstances[0];
        expect(instance.rotation).toBe(90);
      });

      it('defaults to rotation 0 if not specified', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstance('block-1', { row: 0, col: 0 });

        const instance = usePatternDesignerStore.getState().pattern.blockInstances[0];
        expect(instance.rotation).toBe(0);
      });
    });

    describe('addBlockInstancesBatch uses placementRotation', () => {
      it('places all blocks with specified rotation', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstancesBatch('block-1', [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 0 },
        ], 180);

        const instances = usePatternDesignerStore.getState().pattern.blockInstances;
        expect(instances).toHaveLength(3);
        expect(instances[0].rotation).toBe(180);
        expect(instances[1].rotation).toBe(180);
        expect(instances[2].rotation).toBe(180);
      });

      it('defaults to rotation 0 if not specified', () => {
        const store = usePatternDesignerStore.getState();
        store.addBlockInstancesBatch('block-1', [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ]);

        const instances = usePatternDesignerStore.getState().pattern.blockInstances;
        expect(instances[0].rotation).toBe(0);
        expect(instances[1].rotation).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Range Fill Anchor
  // ===========================================================================

  describe('rangeFillAnchor', () => {
    describe('setRangeFillAnchor', () => {
      it('sets the anchor position', () => {
        const store = usePatternDesignerStore.getState();
        expect(store.rangeFillAnchor).toBeNull();

        store.setRangeFillAnchor({ row: 2, col: 3 });

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toEqual({
          row: 2,
          col: 3,
        });
      });

      it('updates existing anchor position', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });
        store.setRangeFillAnchor({ row: 5, col: 5 });

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toEqual({
          row: 5,
          col: 5,
        });
      });

      it('clears anchor when set to null', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(usePatternDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.setRangeFillAnchor(null);

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('getRangeFillPositions', () => {
      it('returns only end position when no anchor is set', () => {
        const store = usePatternDesignerStore.getState();

        const positions = store.getRangeFillPositions({ row: 2, col: 2 });

        expect(positions).toEqual([{ row: 2, col: 2 }]);
      });

      it('returns rectangular range when anchor is set', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });

        const positions = store.getRangeFillPositions({ row: 1, col: 1 });

        expect(positions).toHaveLength(4);
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 0, col: 1 });
        expect(positions).toContainEqual({ row: 1, col: 0 });
        expect(positions).toContainEqual({ row: 1, col: 1 });
      });

      it('returns positions in row-major order', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });

        const positions = store.getRangeFillPositions({ row: 2, col: 2 });

        // Should be ordered row by row, column by column
        expect(positions[0]).toEqual({ row: 0, col: 0 });
        expect(positions[1]).toEqual({ row: 0, col: 1 });
        expect(positions[2]).toEqual({ row: 0, col: 2 });
        expect(positions[3]).toEqual({ row: 1, col: 0 });
      });

      it('filters out occupied positions', () => {
        const store = usePatternDesignerStore.getState();
        // Add a block at (0, 1)
        store.addBlockInstance('block-123', { row: 0, col: 1 });

        store.setRangeFillAnchor({ row: 0, col: 0 });

        const positions = store.getRangeFillPositions({ row: 1, col: 1 });

        // Should have 3 positions, not 4 (0,1 is occupied)
        expect(positions).toHaveLength(3);
        expect(positions).not.toContainEqual({ row: 0, col: 1 });
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 1, col: 0 });
        expect(positions).toContainEqual({ row: 1, col: 1 });
      });

      it('handles same start and end position', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 2, col: 2 });

        const positions = store.getRangeFillPositions({ row: 2, col: 2 });

        expect(positions).toHaveLength(1);
        expect(positions[0]).toEqual({ row: 2, col: 2 });
      });

      it('handles reversed direction (end before start)', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 2, col: 2 });

        const positions = store.getRangeFillPositions({ row: 0, col: 0 });

        expect(positions).toHaveLength(9);
        // Should include all cells regardless of direction
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 2, col: 2 });
      });

      it('handles horizontal range (same row)', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 0 });

        const positions = store.getRangeFillPositions({ row: 1, col: 3 });

        expect(positions).toHaveLength(4);
        positions.forEach((pos) => {
          expect(pos.row).toBe(1);
        });
      });

      it('handles vertical range (same column)', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 2 });

        const positions = store.getRangeFillPositions({ row: 3, col: 2 });

        expect(positions).toHaveLength(4);
        positions.forEach((pos) => {
          expect(pos.col).toBe(2);
        });
      });

      it('returns empty array when anchor position is now occupied', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });
        // Occupy all cells in the range
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.addBlockInstance('block-2', { row: 0, col: 1 });
        store.addBlockInstance('block-3', { row: 1, col: 0 });
        store.addBlockInstance('block-4', { row: 1, col: 1 });

        const positions = store.getRangeFillPositions({ row: 1, col: 1 });

        expect(positions).toHaveLength(0);
      });
    });

    describe('clearSelections clears rangeFillAnchor', () => {
      it('clears anchor when clearing selections', () => {
        const store = usePatternDesignerStore.getState();
        store.selectLibraryBlock('block-1');
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(usePatternDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.clearSelections();

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('initPattern clears rangeFillAnchor', () => {
      it('clears anchor when initializing new pattern', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(usePatternDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.initPattern({ rows: 3, cols: 3 });

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('loadPattern clears rangeFillAnchor', () => {
      it('clears anchor when loading a pattern', () => {
        const store = usePatternDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(usePatternDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.loadPattern({
          id: 'pattern-1',
          creatorId: 'user-1',
          title: 'Test Pattern',
          description: null,
          hashtags: [],
          difficulty: 'beginner',
          category: null,
          gridSize: { rows: 3, cols: 3 },
          physicalSize: {
            widthInches: 36,
            heightInches: 36,
            blockSizeInches: 12,
          },
          palette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
          blockInstances: [],
          borderConfig: null,
          status: 'draft',
          isPremium: false,
          priceCents: null,
          publishedAt: null,
          thumbnailUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        expect(usePatternDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('integration with batch placement', () => {
      it('enables shift-click workflow: place -> set anchor -> range fill', () => {
        const store = usePatternDesignerStore.getState();

        // First click places block and sets anchor
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.setRangeFillAnchor({ row: 0, col: 0 });

        // Shift+click at (2, 2) would fill the range
        const positions = store.getRangeFillPositions({ row: 2, col: 2 });
        // (0,0) is already occupied, so should have 8 empty positions
        expect(positions).toHaveLength(8);

        // Batch place at those positions
        store.addBlockInstancesBatch('block-1', positions);

        // Should now have 9 blocks total
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(9);
      });

      it('supports chaining: multiple range fills in sequence', () => {
        const store = usePatternDesignerStore.getState();

        // First range: (0,0) to (1,1)
        store.addBlockInstance('block-1', { row: 0, col: 0 });
        store.setRangeFillAnchor({ row: 0, col: 0 });
        const positions1 = store.getRangeFillPositions({ row: 1, col: 1 });
        store.addBlockInstancesBatch('block-1', positions1);
        store.setRangeFillAnchor({ row: 1, col: 1 }); // Update anchor

        // First range should have 4 blocks
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(4);

        // Second range: (1,1) to (2,2) - anchor is now (1,1)
        const positions2 = store.getRangeFillPositions({ row: 2, col: 2 });
        // (1,1) is occupied, so should fill (1,2), (2,1), (2,2)
        expect(positions2).toHaveLength(3);

        store.addBlockInstancesBatch('block-1', positions2);
        store.setRangeFillAnchor({ row: 2, col: 2 });

        // Total should be 7 blocks
        expect(usePatternDesignerStore.getState().pattern.blockInstances).toHaveLength(7);
      });
    });
  });

  // ===========================================================================
  // Linked Override Colors (Phase 7)
  // ===========================================================================

  describe('linked override colors', () => {
    describe('addRole', () => {
      it('does not create duplicate colors in palette', () => {
        const store = usePatternDesignerStore.getState();
        const initialRoleCount = store.pattern.palette.roles.length;

        // Add a new color
        const firstId = store.addRole('Test Color', '#abcdef');
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);

        // Try to add the same color again (should return existing ID, not create duplicate)
        const secondId = store.addRole('Another Name', '#ABCDEF'); // Different case
        expect(secondId).toBe(firstId);
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);
      });

      it('allows adding different colors', () => {
        const store = usePatternDesignerStore.getState();
        const initialRoleCount = store.pattern.palette.roles.length;

        store.addRole('Color 1', '#111111');
        store.addRole('Color 2', '#222222');

        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 2);
      });
    });

    describe('setInstanceRoleColor', () => {
      it('auto-adds override color to palette as variant color', () => {
        const store = usePatternDesignerStore.getState();

        // Add a block instance
        const instanceId = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const initialRoleCount = store.pattern.palette.roles.length;

        // Set an override with a new color
        store.setInstanceRoleColor(instanceId, 'accent1', '#987654');

        // Color should be added to palette immediately with isVariantColor flag
        const { palette } = usePatternDesignerStore.getState().pattern;
        expect(palette.roles).toHaveLength(initialRoleCount + 1);
        const variantRole = palette.roles.find((r) => r.color.toLowerCase() === '#987654');
        expect(variantRole).toBeDefined();
        expect(variantRole?.isVariantColor).toBe(true);
      });

      it('does not add color to palette if it already exists', () => {
        const store = usePatternDesignerStore.getState();

        // Add a block instance
        const instanceId = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const existingColor = store.pattern.palette.roles[0].color;
        const initialRoleCount = store.pattern.palette.roles.length;

        // Set an override with an existing color
        store.setInstanceRoleColor(instanceId, 'accent1', existingColor);

        // Palette should not have new role
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount);
      });

      it('removes variant color from palette when no longer used', () => {
        const store = usePatternDesignerStore.getState();

        // Add a block instance
        const instanceId = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const initialRoleCount = store.pattern.palette.roles.length;

        // Set an override with a new color
        store.setInstanceRoleColor(instanceId, 'accent1', '#987654');
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);

        // Change to a different color - the old color should be removed
        store.setInstanceRoleColor(instanceId, 'accent1', '#abcdef');
        const { palette } = usePatternDesignerStore.getState().pattern;
        expect(palette.roles).toHaveLength(initialRoleCount + 1);
        expect(palette.roles.some((r) => r.color.toLowerCase() === '#987654')).toBe(false);
        expect(palette.roles.some((r) => r.color.toLowerCase() === '#abcdef')).toBe(true);
      });

      it('keeps variant color in palette if still used by other instances', () => {
        const store = usePatternDesignerStore.getState();

        // Add two block instances
        const instanceId1 = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId2 = store.addBlockInstance('block-1', { row: 0, col: 1 });
        const initialRoleCount = store.pattern.palette.roles.length;

        // Set both to same custom color
        const sharedColor = '#987654';
        store.setInstanceRoleColor(instanceId1, 'accent1', sharedColor);
        store.setInstanceRoleColor(instanceId2, 'accent1', sharedColor);
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);

        // Change first instance to different color
        store.setInstanceRoleColor(instanceId1, 'accent1', '#abcdef');

        // Original color should still be in palette (used by second instance)
        const { palette } = usePatternDesignerStore.getState().pattern;
        expect(palette.roles).toHaveLength(initialRoleCount + 2);
        expect(palette.roles.some((r) => r.color.toLowerCase() === '#987654')).toBe(true);
      });

      it('removes variant color from palette when instance is deleted', () => {
        const store = usePatternDesignerStore.getState();

        // Add a block instance with a custom color
        const instanceId = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const initialRoleCount = store.pattern.palette.roles.length;

        // Set an override with a new color
        store.setInstanceRoleColor(instanceId, 'accent1', '#987654');
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);

        // Delete the instance
        store.removeBlockInstance(instanceId);

        // Variant color should be removed from palette
        const { palette } = usePatternDesignerStore.getState().pattern;
        expect(palette.roles).toHaveLength(initialRoleCount);
        expect(palette.roles.some((r) => r.color.toLowerCase() === '#987654')).toBe(false);
      });

      it('keeps variant color in palette when one of multiple instances is deleted', () => {
        const store = usePatternDesignerStore.getState();

        // Add two block instances with same custom color
        const instanceId1 = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId2 = store.addBlockInstance('block-1', { row: 0, col: 1 });
        const initialRoleCount = store.pattern.palette.roles.length;

        const sharedColor = '#987654';
        store.setInstanceRoleColor(instanceId1, 'accent1', sharedColor);
        store.setInstanceRoleColor(instanceId2, 'accent1', sharedColor);
        expect(usePatternDesignerStore.getState().pattern.palette.roles).toHaveLength(initialRoleCount + 1);

        // Delete first instance
        store.removeBlockInstance(instanceId1);

        // Color should still be in palette (used by second instance)
        const { palette } = usePatternDesignerStore.getState().pattern;
        expect(palette.roles).toHaveLength(initialRoleCount + 1);
        expect(palette.roles.some((r) => r.color.toLowerCase() === '#987654')).toBe(true);
      });
    });

    describe('setRoleColor', () => {
      it('cascades palette color change to matching overrides', () => {
        const store = usePatternDesignerStore.getState();

        // Add block instances
        const instanceId1 = store.addBlockInstance('block-1', { row: 0, col: 0 });
        const instanceId2 = store.addBlockInstance('block-1', { row: 0, col: 1 });

        // Set overrides with the same color
        const sharedColor = '#123456';
        store.setInstanceRoleColor(instanceId1, 'accent1', sharedColor);
        store.setInstanceRoleColor(instanceId2, 'accent2', sharedColor);

        // Find the role with our color
        const roleWithColor = usePatternDesignerStore.getState().pattern.palette.roles.find(
          (r) => r.color.toLowerCase() === sharedColor.toLowerCase()
        );
        expect(roleWithColor).toBeDefined();

        // Change that palette color
        const newColor = '#fedcba';
        store.setRoleColor(roleWithColor!.id, newColor);

        // Both overrides should be updated to the new color
        const { blockInstances } = usePatternDesignerStore.getState().pattern;
        const instance1 = blockInstances.find((i) => i.id === instanceId1);
        const instance2 = blockInstances.find((i) => i.id === instanceId2);

        expect(instance1?.paletteOverrides?.['accent1'].toLowerCase()).toBe(newColor.toLowerCase());
        expect(instance2?.paletteOverrides?.['accent2'].toLowerCase()).toBe(newColor.toLowerCase());
      });

      it('does not affect overrides with different colors', () => {
        const store = usePatternDesignerStore.getState();

        // Add block instance
        const instanceId = store.addBlockInstance('block-1', { row: 0, col: 0 });

        // Set override with a unique color
        const uniqueColor = '#aabbcc';
        store.setInstanceRoleColor(instanceId, 'accent1', uniqueColor);

        // Change a different palette color
        const existingRole = store.pattern.palette.roles[0];
        store.setRoleColor(existingRole.id, '#000000');

        // Our unique override should be unchanged
        const { blockInstances } = usePatternDesignerStore.getState().pattern;
        const instance = blockInstances.find((i) => i.id === instanceId);

        expect(instance?.paletteOverrides?.['accent1'].toLowerCase()).toBe(uniqueColor.toLowerCase());
      });
    });
  });

});
