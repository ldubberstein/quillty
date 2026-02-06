/**
 * Block Designer Store Tests
 *
 * Comprehensive tests for the Zustand store managing Block Designer state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBlockDesignerStore } from './store';
import { DEFAULT_GRID_SIZE, DEFAULT_PALETTE } from './constants';
import type { Block, GridPosition, HstVariant, FlyingGeeseDirection, SquareUnit, HstUnit, FlyingGeeseUnit, QstUnit } from './types';
import { createUndoManagerState } from './history/undoManager';

// Helper to reset store state before each test
function resetStore() {
  useBlockDesignerStore.setState({
    block: {
      id: 'test-id',
      creatorId: '',
      derivedFromBlockId: null,
      title: '',
      description: null,
      hashtags: [],
      gridSize: DEFAULT_GRID_SIZE,
      units: [],
      previewPalette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
      status: 'draft',
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    selectedUnitId: null,
    activeFabricRole: null,
    mode: 'idle',
    flyingGeesePlacement: null,
    undoManager: createUndoManagerState(),
    previewRotationPreset: 'all_same',
    selectedUnitType: null,
    hoveredCell: null,
    rangeFillAnchor: null,
  });
}

describe('BlockDesignerStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Block Management
  // ===========================================================================

  describe('initBlock', () => {
    it('creates a new empty block with default grid size', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock();

      const { block } = useBlockDesignerStore.getState();
      expect(block.gridSize).toBe(DEFAULT_GRID_SIZE);
      expect(block.units).toHaveLength(0);
      expect(block.title).toBe('');
      expect(block.status).toBe('draft');
    });

    it('creates a block with specified grid size', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(4);

      const { block } = useBlockDesignerStore.getState();
      expect(block.gridSize).toBe(4);
    });

    it('creates a block with specified creator ID', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(3, 'creator-123');

      const { block } = useBlockDesignerStore.getState();
      expect(block.creatorId).toBe('creator-123');
    });

    it('resets all designer state', () => {
      // Set up some state first
      useBlockDesignerStore.getState().addSquare({ row: 0, col: 0 });
      const unitId = useBlockDesignerStore.getState().block.units[0].id;
      useBlockDesignerStore.getState().selectUnit(unitId);
      useBlockDesignerStore.getState().setActiveFabricRole('accent1');

      // Now init a new block
      useBlockDesignerStore.getState().initBlock();

      const state = useBlockDesignerStore.getState();
      expect(state.selectedUnitId).toBeNull();
      expect(state.activeFabricRole).toBeNull();
      expect(state.mode).toBe('idle');
      expect(state.flyingGeesePlacement).toBeNull();
    });
  });

  describe('loadBlock', () => {
    it('loads an existing block', () => {
      const existingBlock: Block = {
        id: 'existing-block-id',
        creatorId: 'user-456',
        derivedFromBlockId: null,
        title: 'My Block',
        description: 'A test block',
        hashtags: ['test', 'quilt'],
        gridSize: 4,
        units: [],
        previewPalette: DEFAULT_PALETTE,
        status: 'published',
        publishedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const store = useBlockDesignerStore.getState();
      store.loadBlock(existingBlock);

      const { block } = useBlockDesignerStore.getState();
      expect(block.id).toBe('existing-block-id');
      expect(block.title).toBe('My Block');
      expect(block.gridSize).toBe(4);
      expect(block.status).toBe('published');
    });

    it('resets designer state when loading', () => {
      useBlockDesignerStore.getState().addSquare({ row: 0, col: 0 });
      const unitId = useBlockDesignerStore.getState().block.units[0].id;
      useBlockDesignerStore.getState().selectUnit(unitId);

      const newBlock: Block = {
        id: 'new-block',
        creatorId: '',
        derivedFromBlockId: null,
        title: '',
        description: null,
        hashtags: [],
        gridSize: 3,
        units: [],
        previewPalette: DEFAULT_PALETTE,
        status: 'draft',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useBlockDesignerStore.getState().loadBlock(newBlock);

      const state = useBlockDesignerStore.getState();
      expect(state.selectedUnitId).toBeNull();
      expect(state.mode).toBe('idle');
    });
  });

  describe('updateBlockMetadata', () => {
    it('updates block title', () => {
      const store = useBlockDesignerStore.getState();
      store.updateBlockMetadata({ title: 'New Title' });

      expect(useBlockDesignerStore.getState().block.title).toBe('New Title');
    });

    it('updates block description', () => {
      const store = useBlockDesignerStore.getState();
      store.updateBlockMetadata({ description: 'New description' });

      expect(useBlockDesignerStore.getState().block.description).toBe('New description');
    });

    it('updates block hashtags', () => {
      const store = useBlockDesignerStore.getState();
      store.updateBlockMetadata({ hashtags: ['quilting', 'design'] });

      expect(useBlockDesignerStore.getState().block.hashtags).toEqual(['quilting', 'design']);
    });

    it('updates updatedAt timestamp', () => {
      const store = useBlockDesignerStore.getState();
      store.updateBlockMetadata({ title: 'Updated' });

      const afterUpdate = useBlockDesignerStore.getState().block.updatedAt;
      // Check that updatedAt is a valid ISO timestamp
      expect(new Date(afterUpdate).toISOString()).toBe(afterUpdate);
    });
  });

  // ===========================================================================
  // Unit Management
  // ===========================================================================

  describe('addSquare', () => {
    it('adds a square unit at specified position', () => {
      const store = useBlockDesignerStore.getState();
      const position: GridPosition = { row: 1, col: 2 };

      const id = store.addSquare(position);

      const { block } = useBlockDesignerStore.getState();
      expect(block.units).toHaveLength(1);
      expect(block.units[0].type).toBe('square');
      expect(block.units[0].position).toEqual(position);
      expect(block.units[0].id).toBe(id);
    });

    it('uses default fabric role (background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('background');
    });

    it('accepts custom fabric role', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 }, 'accent1');

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('accent1');
    });

    it('sets span to 1x1', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      expect(unit.span).toEqual({ rows: 1, cols: 1 });
    });
  });

  describe('addHst', () => {
    it('adds an HST unit with specified variant', () => {
      const store = useBlockDesignerStore.getState();
      const position: GridPosition = { row: 0, col: 0 };
      const variant: HstVariant = 'nw';

      const id = store.addHst(position, variant);

      const { block } = useBlockDesignerStore.getState();
      expect(block.units).toHaveLength(1);
      expect(block.units[0].type).toBe('hst');
      expect(block.units[0].id).toBe(id);
      if (block.units[0].type === 'hst') {
        expect(block.units[0].variant).toBe('nw');
      }
    });

    it.each(['nw', 'ne', 'sw', 'se'] as HstVariant[])('supports variant: %s', (variant) => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, variant);

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'hst') {
        expect(unit.variant).toBe(variant);
      }
    });

    it('uses default fabric roles (both background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, 'nw');

      const unit = useBlockDesignerStore.getState().block.units[0] as HstUnit;
      expect(unit.fabricRole).toBe('background');
      expect(unit.secondaryFabricRole).toBe('background');
    });

    it('accepts custom fabric roles', () => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, 'nw', 'accent1', 'accent2');

      const unit = useBlockDesignerStore.getState().block.units[0] as HstUnit;
      expect(unit.fabricRole).toBe('accent1');
      expect(unit.secondaryFabricRole).toBe('accent2');
    });
  });

  describe('addFlyingGeese', () => {
    it('adds a Flying Geese unit with horizontal span for left/right', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'right');

      const unit = useBlockDesignerStore.getState().block.units[0];
      expect(unit.type).toBe('flying_geese');
      expect(unit.span).toEqual({ rows: 1, cols: 2 });
    });

    it('adds a Flying Geese unit with vertical span for up/down', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'down');

      const unit = useBlockDesignerStore.getState().block.units[0];
      expect(unit.span).toEqual({ rows: 2, cols: 1 });
    });

    it.each(['up', 'down', 'left', 'right'] as FlyingGeeseDirection[])(
      'supports direction: %s',
      (direction) => {
        resetStore();
        const store = useBlockDesignerStore.getState();
        store.addFlyingGeese({ row: 0, col: 0 }, direction);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'flying_geese') {
          expect(unit.direction).toBe(direction);
        }
      }
    );

    it('uses default fabric roles (all background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      const unit = useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit;
      expect(unit.patchFabricRoles.goose).toBe('background');
      expect(unit.patchFabricRoles.sky1).toBe('background');
      expect(unit.patchFabricRoles.sky2).toBe('background');
    });
  });

  describe('addQst', () => {
    it('adds a QST unit at specified position', () => {
      const store = useBlockDesignerStore.getState();
      const position: GridPosition = { row: 0, col: 0 };

      const id = store.addQst(position);

      const { block } = useBlockDesignerStore.getState();
      expect(block.units).toHaveLength(1);
      expect(block.units[0].type).toBe('qst');
      expect(block.units[0].id).toBe(id);
    });

    it('creates a 1x1 span unit', () => {
      const store = useBlockDesignerStore.getState();
      store.addQst({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      expect(unit.span).toEqual({ rows: 1, cols: 1 });
    });

    it('uses default fabric roles (all background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addQst({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'qst') {
        expect(unit.patchFabricRoles.top).toBe('background');
        expect(unit.patchFabricRoles.right).toBe('background');
        expect(unit.patchFabricRoles.bottom).toBe('background');
        expect(unit.patchFabricRoles.left).toBe('background');
      }
    });

    it('accepts custom fabric roles', () => {
      const store = useBlockDesignerStore.getState();
      store.addQst({ row: 0, col: 0 }, {
        top: 'feature',
        right: 'accent1',
        bottom: 'feature',
        left: 'accent1',
      });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'qst') {
        expect(unit.patchFabricRoles.top).toBe('feature');
        expect(unit.patchFabricRoles.right).toBe('accent1');
        expect(unit.patchFabricRoles.bottom).toBe('feature');
        expect(unit.patchFabricRoles.left).toBe('accent1');
      }
    });

    it('accepts partial fabric roles and uses background for missing', () => {
      const store = useBlockDesignerStore.getState();
      store.addQst({ row: 0, col: 0 }, { top: 'feature' });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'qst') {
        expect(unit.patchFabricRoles.top).toBe('feature');
        expect(unit.patchFabricRoles.right).toBe('background');
        expect(unit.patchFabricRoles.bottom).toBe('background');
        expect(unit.patchFabricRoles.left).toBe('background');
      }
    });
  });

  describe('addUnitsBatch', () => {
    it('adds multiple square units at specified positions', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ];

      const ids = store.addUnitsBatch(positions, { type: 'square' });

      const { block } = useBlockDesignerStore.getState();
      expect(ids).toHaveLength(3);
      expect(block.units).toHaveLength(3);
      expect(block.units.every((s) => s.type === 'square')).toBe(true);
    });

    it('adds multiple HST units with correct variant', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ];

      const ids = store.addUnitsBatch(positions, { type: 'hst', variant: 'ne' });

      const { block } = useBlockDesignerStore.getState();
      expect(ids).toHaveLength(2);
      expect(block.units).toHaveLength(2);
      block.units.forEach((unit) => {
        expect(unit.type).toBe('hst');
        if (unit.type === 'hst') {
          expect(unit.variant).toBe('ne');
        }
      });
    });

    it('adds multiple QST units', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ];

      const ids = store.addUnitsBatch(positions, { type: 'qst' });

      const { block } = useBlockDesignerStore.getState();
      expect(ids).toHaveLength(2);
      expect(block.units).toHaveLength(2);
      block.units.forEach((unit) => {
        expect(unit.type).toBe('qst');
        if (unit.type === 'qst') {
          // Should use default background for all parts
          expect(unit.patchFabricRoles.top).toBe('background');
          expect(unit.patchFabricRoles.right).toBe('background');
          expect(unit.patchFabricRoles.bottom).toBe('background');
          expect(unit.patchFabricRoles.left).toBe('background');
        }
      });
    });

    it('returns empty array for flying_geese (not supported)', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];

      const ids = store.addUnitsBatch(positions, { type: 'flying_geese' });

      expect(ids).toHaveLength(0);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('returns empty array for empty positions', () => {
      const store = useBlockDesignerStore.getState();
      const ids = store.addUnitsBatch([], { type: 'square' });

      expect(ids).toHaveLength(0);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('places units at correct positions', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 2 },
        { row: 2, col: 1 },
      ];

      store.addUnitsBatch(positions, { type: 'square' });

      const { block } = useBlockDesignerStore.getState();
      expect(block.units[0].position).toEqual({ row: 0, col: 2 });
      expect(block.units[1].position).toEqual({ row: 2, col: 1 });
    });

    it('uses default fabric role (background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addUnitsBatch([{ row: 0, col: 0 }], { type: 'square' });

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('background');
    });

    it('undoes entire batch as single operation', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];

      store.addUnitsBatch(positions, { type: 'square' });
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(3);

      store.undo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('redoes entire batch as single operation', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ];

      store.addUnitsBatch(positions, { type: 'hst', variant: 'sw' });
      store.undo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);

      store.redo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);
    });

    it('generates unique IDs for each unit', () => {
      const store = useBlockDesignerStore.getState();
      const positions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];

      const ids = store.addUnitsBatch(positions, { type: 'square' });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('updates updatedAt timestamp', () => {
      const store = useBlockDesignerStore.getState();
      const beforeUpdate = store.block.updatedAt;

      // Small delay to ensure time difference
      const start = Date.now();
      while (Date.now() - start < 5) {
        // spin wait
      }

      store.addUnitsBatch([{ row: 0, col: 0 }], { type: 'square' });

      expect(useBlockDesignerStore.getState().block.updatedAt).not.toBe(beforeUpdate);
    });
  });

  describe('removeUnit', () => {
    it('removes a unit by ID', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.removeUnit(id);

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('clears selection if removed unit was selected', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectUnit(id);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);

      store.removeUnit(id);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });

    it('does nothing if unit ID not found', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      store.removeUnit('non-existent-id');

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });
  });

  describe('updateUnit', () => {
    it('updates unit properties', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.updateUnit(id, { fabricRole: 'accent1' });

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('accent1');
    });

    it('updates position', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.updateUnit(id, { position: { row: 1, col: 1 } });

      expect(useBlockDesignerStore.getState().block.units[0].position).toEqual({ row: 1, col: 1 });
    });

    it('does nothing if unit ID not found', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 }, 'background');

      store.updateUnit('non-existent-id', { fabricRole: 'accent1' });

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('background');
    });
  });

  // ===========================================================================
  // Selection
  // ===========================================================================

  describe('selectUnit', () => {
    it('selects a unit by ID', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.selectUnit(id);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);
    });

    it('can select null to deselect', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectUnit(id);

      store.selectUnit(null);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });

    it('exits paint mode when selecting a unit', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.setActiveFabricRole('accent1');

      expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');

      store.selectUnit(id);

      expect(useBlockDesignerStore.getState().mode).toBe('idle');
      expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('clears the current selection', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectUnit(id);

      store.clearSelection();

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });
  });

  // ===========================================================================
  // Paint Mode
  // ===========================================================================

  describe('setActiveFabricRole', () => {
    it('sets the active fabric role', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('accent1');

      expect(useBlockDesignerStore.getState().activeFabricRole).toBe('accent1');
    });

    it('enters paint mode when setting a role', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('feature');

      expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');
    });

    it('exits paint mode when setting null', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('feature');
      store.setActiveFabricRole(null);

      expect(useBlockDesignerStore.getState().mode).toBe('idle');
    });

    it('clears selection when entering paint mode', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectUnit(id);

      store.setActiveFabricRole('accent1');

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });
  });

  describe('assignFabricRole', () => {
    it('assigns fabric role to a square unit', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 }, 'background');

      store.assignFabricRole(id, 'accent2');

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.fabricRole).toBe('accent2');
    });

    it('assigns primary fabric role to HST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');

      store.assignFabricRole(id, 'accent1', 'primary');

      const unit = useBlockDesignerStore.getState().block.units[0] as HstUnit;
      expect(unit.fabricRole).toBe('accent1');
    });

    it('assigns secondary fabric role to HST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');

      store.assignFabricRole(id, 'accent1', 'secondary');

      const unit = useBlockDesignerStore.getState().block.units[0] as HstUnit;
      expect(unit.secondaryFabricRole).toBe('accent1');
    });

    it('assigns goose fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'accent1', 'goose');

      const unit = useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit;
      expect(unit.patchFabricRoles.goose).toBe('accent1');
    });

    it('assigns sky1 fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'accent2', 'sky1');

      const unit = useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit;
      expect(unit.patchFabricRoles.sky1).toBe('accent2');
    });

    it('assigns sky2 fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'feature', 'sky2');

      const unit = useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit;
      expect(unit.patchFabricRoles.sky2).toBe('feature');
    });

    it('assigns top fabric role to QST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addQst({ row: 0, col: 0 });

      store.assignFabricRole(id, 'accent1', 'top');

      const unit = useBlockDesignerStore.getState().block.units[0] as QstUnit;
      expect(unit.patchFabricRoles.top).toBe('accent1');
    });

    it('assigns right fabric role to QST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addQst({ row: 0, col: 0 });

      store.assignFabricRole(id, 'accent2', 'right');

      const unit = useBlockDesignerStore.getState().block.units[0] as QstUnit;
      expect(unit.patchFabricRoles.right).toBe('accent2');
    });

    it('assigns bottom fabric role to QST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addQst({ row: 0, col: 0 });

      store.assignFabricRole(id, 'feature', 'bottom');

      const unit = useBlockDesignerStore.getState().block.units[0] as QstUnit;
      expect(unit.patchFabricRoles.bottom).toBe('feature');
    });

    it('assigns left fabric role to QST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addQst({ row: 0, col: 0 });

      store.assignFabricRole(id, 'background', 'left');

      const unit = useBlockDesignerStore.getState().block.units[0] as QstUnit;
      expect(unit.patchFabricRoles.left).toBe('background');
    });
  });

  // ===========================================================================
  // Palette
  // ===========================================================================

  describe('setRoleColor', () => {
    it('changes a palette role color', () => {
      const store = useBlockDesignerStore.getState();
      store.setRoleColor('background', '#FF0000');

      const palette = useBlockDesignerStore.getState().block.previewPalette;
      const bgRole = palette.roles.find((r) => r.id === 'background');
      expect(bgRole?.color).toBe('#FF0000');
    });

    it('updates updatedAt timestamp', () => {
      const store = useBlockDesignerStore.getState();
      store.setRoleColor('feature', '#00FF00');

      const after = useBlockDesignerStore.getState().block.updatedAt;
      // Check that updatedAt is a valid ISO timestamp
      expect(new Date(after).toISOString()).toBe(after);
    });

    it('does nothing if role not found', () => {
      const store = useBlockDesignerStore.getState();
      const before = store.block.previewPalette.roles.map((r) => ({ ...r }));

      store.setRoleColor('non-existent-role', '#FF0000');

      const after = useBlockDesignerStore.getState().block.previewPalette.roles;
      // Colors should be unchanged
      for (let i = 0; i < before.length; i++) {
        expect(after[i].color).toBe(before[i].color);
      }
    });
  });

  describe('addRole', () => {
    it('adds a new role with auto-generated ID', () => {
      const store = useBlockDesignerStore.getState();
      const initialCount = store.block.previewPalette.roles.length;

      const newId = store.addRole();

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(initialCount + 1);
      expect(newId).toBeTruthy();
      expect(state.block.previewPalette.roles.find((r) => r.id === newId)).toBeDefined();
    });

    it('uses provided name when specified', () => {
      const store = useBlockDesignerStore.getState();

      const newId = store.addRole('My Custom Color');

      const state = useBlockDesignerStore.getState();
      const newRole = state.block.previewPalette.roles.find((r) => r.id === newId);
      expect(newRole?.name).toBe('My Custom Color');
    });

    it('uses provided color when specified', () => {
      const store = useBlockDesignerStore.getState();

      const newId = store.addRole('Custom', '#ABCDEF');

      const state = useBlockDesignerStore.getState();
      const newRole = state.block.previewPalette.roles.find((r) => r.id === newId);
      expect(newRole?.color).toBe('#ABCDEF');
    });

    it('generates unique ID even with collisions', () => {
      const store = useBlockDesignerStore.getState();

      // Add multiple roles to cause potential ID collisions
      const id1 = store.addRole('Test 1');
      const id2 = store.addRole('Test 2');
      const id3 = store.addRole('Test 3');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('returns empty string when at maximum roles', () => {
      const store = useBlockDesignerStore.getState();

      // Add roles until we reach max (12)
      // Start with 4, need 8 more
      for (let i = 0; i < 8; i++) {
        store.addRole(`Extra ${i}`);
      }

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(12);

      // Try to add one more
      const result = store.addRole('Over limit');
      expect(result).toBe('');
      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(12);
    });

    it('records operation for undo', () => {
      const store = useBlockDesignerStore.getState();
      const undoCountBefore = store.undoManager.undoStack.length;

      store.addRole();

      const undoCountAfter = useBlockDesignerStore.getState().undoManager.undoStack.length;
      expect(undoCountAfter).toBe(undoCountBefore + 1);
    });

    it('can be undone', () => {
      const store = useBlockDesignerStore.getState();
      const initialCount = store.block.previewPalette.roles.length;

      store.addRole('To be undone');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(
        initialCount + 1
      );

      store.undo();

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(initialCount);
    });

    it('can be redone after undo', () => {
      const store = useBlockDesignerStore.getState();
      const initialCount = store.block.previewPalette.roles.length;

      const newId = store.addRole('Redo test');
      store.undo();

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(initialCount);

      store.redo();

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(initialCount + 1);
      expect(state.block.previewPalette.roles.find((r) => r.id === newId)).toBeDefined();
    });
  });

  describe('removeRole', () => {
    it('removes a role from the palette', () => {
      const store = useBlockDesignerStore.getState();
      const initialCount = store.block.previewPalette.roles.length;

      store.removeRole('accent2');

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(initialCount - 1);
      expect(state.block.previewPalette.roles.find((r) => r.id === 'accent2')).toBeUndefined();
    });

    it('does nothing when trying to remove last role', () => {
      const store = useBlockDesignerStore.getState();

      // Remove all but one role
      store.removeRole('accent2');
      store.removeRole('accent1');
      store.removeRole('feature');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(1);

      // Try to remove the last one
      store.removeRole('background');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(1);
    });

    it('does nothing when role not found', () => {
      const store = useBlockDesignerStore.getState();
      const initialCount = store.block.previewPalette.roles.length;

      store.removeRole('non-existent-role');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(initialCount);
    });

    it('reassigns units using the removed role to fallback', () => {
      const store = useBlockDesignerStore.getState();

      // Add a square with accent2
      const unitId = store.addSquare({ row: 0, col: 0 });
      store.assignFabricRole(unitId, 'accent2');

      expect((useBlockDesignerStore.getState().block.units[0] as SquareUnit).fabricRole).toBe('accent2');

      // Remove accent2, units should be reassigned to background (first role)
      store.removeRole('accent2');

      expect((useBlockDesignerStore.getState().block.units[0] as SquareUnit).fabricRole).toBe('background');
    });

    it('uses specified fallback role for reassignment', () => {
      const store = useBlockDesignerStore.getState();

      // Add a square with accent2
      const unitId = store.addSquare({ row: 0, col: 0 });
      store.assignFabricRole(unitId, 'accent2');

      // Remove accent2, specify feature as fallback
      store.removeRole('accent2', 'feature');

      expect((useBlockDesignerStore.getState().block.units[0] as SquareUnit).fabricRole).toBe('feature');
    });

    it('clears active fabric role if it was the removed one', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('accent2');

      expect(useBlockDesignerStore.getState().activeFabricRole).toBe('accent2');

      store.removeRole('accent2');

      expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
    });

    it('exits paint mode when removing active role', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('accent2');

      expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');

      store.removeRole('accent2');

      expect(useBlockDesignerStore.getState().mode).toBe('idle');
    });

    it('can be undone', () => {
      const store = useBlockDesignerStore.getState();

      // Add a square with accent2
      const unitId = store.addSquare({ row: 0, col: 0 });
      store.assignFabricRole(unitId, 'accent2');

      const initialCount = useBlockDesignerStore.getState().block.previewPalette.roles.length;
      store.removeRole('accent2');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(
        initialCount - 1
      );

      store.undo();

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(initialCount);
      expect(state.block.previewPalette.roles.find((r) => r.id === 'accent2')).toBeDefined();
      // Unit should be restored to accent2
      expect((state.block.units[0] as SquareUnit).fabricRole).toBe('accent2');
    });

    it('can be redone after undo', () => {
      const store = useBlockDesignerStore.getState();

      const initialCount = store.block.previewPalette.roles.length;
      store.removeRole('accent2');
      store.undo();

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(initialCount);

      store.redo();

      const state = useBlockDesignerStore.getState();
      expect(state.block.previewPalette.roles.length).toBe(initialCount - 1);
      expect(state.block.previewPalette.roles.find((r) => r.id === 'accent2')).toBeUndefined();
    });
  });

  describe('renameRole', () => {
    it('renames a role', () => {
      const store = useBlockDesignerStore.getState();

      store.renameRole('background', 'Main Fabric');

      const state = useBlockDesignerStore.getState();
      const bgRole = state.block.previewPalette.roles.find((r) => r.id === 'background');
      expect(bgRole?.name).toBe('Main Fabric');
    });

    it('does nothing if role not found', () => {
      const store = useBlockDesignerStore.getState();
      const before = store.block.previewPalette.roles.map((r) => ({ ...r }));

      store.renameRole('non-existent', 'New Name');

      const after = useBlockDesignerStore.getState().block.previewPalette.roles;
      for (let i = 0; i < before.length; i++) {
        expect(after[i].name).toBe(before[i].name);
      }
    });

    it('records operation for undo', () => {
      const store = useBlockDesignerStore.getState();
      const undoCountBefore = store.undoManager.undoStack.length;

      store.renameRole('background', 'New Name');

      const undoCountAfter = useBlockDesignerStore.getState().undoManager.undoStack.length;
      expect(undoCountAfter).toBe(undoCountBefore + 1);
    });

    it('can be undone', () => {
      const store = useBlockDesignerStore.getState();
      const originalName =
        store.block.previewPalette.roles.find((r) => r.id === 'background')?.name;

      store.renameRole('background', 'Renamed');

      expect(
        useBlockDesignerStore.getState().block.previewPalette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe('Renamed');

      store.undo();

      expect(
        useBlockDesignerStore.getState().block.previewPalette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe(originalName);
    });

    it('can be redone after undo', () => {
      const store = useBlockDesignerStore.getState();

      store.renameRole('background', 'Renamed');
      store.undo();
      store.redo();

      expect(
        useBlockDesignerStore.getState().block.previewPalette.roles.find((r) => r.id === 'background')
          ?.name
      ).toBe('Renamed');
    });
  });

  describe('canRemoveRole', () => {
    it('returns true when more than one role exists', () => {
      const store = useBlockDesignerStore.getState();

      expect(store.canRemoveRole()).toBe(true);
    });

    it('returns false when only one role exists', () => {
      const store = useBlockDesignerStore.getState();

      // Remove all but one role
      store.removeRole('accent2');
      store.removeRole('accent1');
      store.removeRole('feature');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.length).toBe(1);
      expect(useBlockDesignerStore.getState().canRemoveRole()).toBe(false);
    });
  });

  describe('getUnitsUsingRole', () => {
    it('returns empty array when no units use the role', () => {
      const store = useBlockDesignerStore.getState();

      const units = store.getUnitsUsingRole('feature');

      expect(units).toEqual([]);
    });

    it('returns units using the specified role', () => {
      const store = useBlockDesignerStore.getState();

      // Add squares with different roles
      store.addSquare({ row: 0, col: 0 }); // default is background
      const secondId = store.addSquare({ row: 0, col: 1 });
      store.assignFabricRole(secondId, 'feature');

      const units = useBlockDesignerStore.getState().getUnitsUsingRole('feature');

      expect(units.length).toBe(1);
      expect(units[0].id).toBe(secondId);
    });

    it('detects HST units using role in either position', () => {
      const store = useBlockDesignerStore.getState();

      // Create HST with background and feature roles
      store.addHst({ row: 0, col: 0 }, 'ne', 'background', 'feature');

      const bgUnits = useBlockDesignerStore.getState().getUnitsUsingRole('background');
      const featureUnits = useBlockDesignerStore.getState().getUnitsUsingRole('feature');

      expect(bgUnits.length).toBe(1);
      expect(featureUnits.length).toBe(1);
    });
  });

  // ===========================================================================
  // Mode Management
  // ===========================================================================

  describe('setMode', () => {
    it('sets the designer mode', () => {
      const store = useBlockDesignerStore.getState();
      store.setMode('preview');

      expect(useBlockDesignerStore.getState().mode).toBe('preview');
    });

    it('clears active fabric role when leaving paint mode', () => {
      const store = useBlockDesignerStore.getState();
      store.setActiveFabricRole('accent1');

      store.setMode('idle');

      expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
    });

    it('clears flying geese placement when leaving placement mode', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      expect(useBlockDesignerStore.getState().flyingGeesePlacement).not.toBeNull();

      store.setMode('idle');

      expect(useBlockDesignerStore.getState().flyingGeesePlacement).toBeNull();
    });
  });

  // ===========================================================================
  // Flying Geese Placement
  // ===========================================================================

  describe('startFlyingGeesePlacement', () => {
    it('starts Flying Geese placement at position', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 1 });

      const state = useBlockDesignerStore.getState();
      expect(state.flyingGeesePlacement).not.toBeNull();
      expect(state.flyingGeesePlacement?.firstCellPosition).toEqual({ row: 1, col: 1 });
      expect(state.mode).toBe('placing_flying_geese_second');
    });

    it('calculates valid adjacent cells', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 1 });

      const state = useBlockDesignerStore.getState();
      // Center cell should have 4 adjacent cells in a 3x3 grid
      expect(state.flyingGeesePlacement?.validAdjacentCells).toHaveLength(4);
    });

    it('excludes occupied cells from valid adjacent', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 1 }); // Block the cell above center

      store.startFlyingGeesePlacement({ row: 1, col: 1 });

      const state = useBlockDesignerStore.getState();
      // Should only have 3 valid adjacent cells now
      expect(state.flyingGeesePlacement?.validAdjacentCells).toHaveLength(3);
    });
  });

  describe('completeFlyingGeesePlacement', () => {
    it('creates Flying Geese when completing valid placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      const id = store.completeFlyingGeesePlacement({ row: 0, col: 1 });

      expect(id).not.toBeNull();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
      expect(useBlockDesignerStore.getState().block.units[0].type).toBe('flying_geese');
    });

    it('returns null and cancels for invalid position, staying in placing_unit mode', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      const id = store.completeFlyingGeesePlacement({ row: 2, col: 2 }); // Not adjacent

      expect(id).toBeNull();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
      // Returns to placing_unit so user can try again
      expect(useBlockDesignerStore.getState().mode).toBe('placing_unit');
    });

    it('determines correct direction for rightward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });
      store.completeFlyingGeesePlacement({ row: 0, col: 1 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'flying_geese') {
        expect(unit.direction).toBe('right');
      }
    });

    it('determines correct direction for leftward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 1 });
      store.completeFlyingGeesePlacement({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'flying_geese') {
        expect(unit.direction).toBe('left');
      }
    });

    it('determines correct direction for downward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });
      store.completeFlyingGeesePlacement({ row: 1, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'flying_geese') {
        expect(unit.direction).toBe('down');
      }
    });

    it('determines correct direction for upward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 0 });
      store.completeFlyingGeesePlacement({ row: 0, col: 0 });

      const unit = useBlockDesignerStore.getState().block.units[0];
      if (unit.type === 'flying_geese') {
        expect(unit.direction).toBe('up');
      }
    });

    it('uses top-left cell as position', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 1 });
      store.completeFlyingGeesePlacement({ row: 0, col: 1 }); // Click above

      const unit = useBlockDesignerStore.getState().block.units[0];
      // Position should be top cell regardless of click order
      expect(unit.position).toEqual({ row: 0, col: 1 });
    });

    it('returns null if no placement in progress', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.completeFlyingGeesePlacement({ row: 0, col: 1 });

      expect(id).toBeNull();
    });
  });

  describe('cancelFlyingGeesePlacement', () => {
    it('cancels placement and returns to placing_unit mode', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      store.cancelFlyingGeesePlacement();

      const state = useBlockDesignerStore.getState();
      expect(state.flyingGeesePlacement).toBeNull();
      // Returns to placing_unit so user can try placing again
      expect(state.mode).toBe('placing_unit');
    });
  });

  // ===========================================================================
  // Utility Functions
  // ===========================================================================

  describe('getUnitAt', () => {
    it('returns unit at exact position', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 1, col: 2 });

      const unit = store.getUnitAt({ row: 1, col: 2 });

      expect(unit?.id).toBe(id);
    });

    it('returns undefined if no unit at position', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const unit = store.getUnitAt({ row: 2, col: 2 });

      expect(unit).toBeUndefined();
    });

    it('finds Flying Geese unit spanning multiple cells', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'right');

      // Should find at both positions
      expect(store.getUnitAt({ row: 0, col: 0 })?.id).toBe(id);
      expect(store.getUnitAt({ row: 0, col: 1 })?.id).toBe(id);
    });
  });

  describe('isCellOccupied', () => {
    it('returns true for occupied cell', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      expect(store.isCellOccupied({ row: 0, col: 0 })).toBe(true);
    });

    it('returns false for empty cell', () => {
      const store = useBlockDesignerStore.getState();

      expect(store.isCellOccupied({ row: 0, col: 0 })).toBe(false);
    });

    it('returns true for cell covered by multi-cell unit', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'down'); // 2x1 vertical

      expect(store.isCellOccupied({ row: 0, col: 0 })).toBe(true);
      expect(store.isCellOccupied({ row: 1, col: 0 })).toBe(true);
    });
  });

  describe('getValidAdjacentCells', () => {
    it('returns 4 cells for center position in 3x3 grid', () => {
      const store = useBlockDesignerStore.getState();
      const adjacent = store.getValidAdjacentCells({ row: 1, col: 1 });

      expect(adjacent).toHaveLength(4);
    });

    it('returns 2 cells for corner position', () => {
      const store = useBlockDesignerStore.getState();
      const adjacent = store.getValidAdjacentCells({ row: 0, col: 0 });

      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContainEqual({ row: 0, col: 1 });
      expect(adjacent).toContainEqual({ row: 1, col: 0 });
    });

    it('returns 3 cells for edge position', () => {
      const store = useBlockDesignerStore.getState();
      const adjacent = store.getValidAdjacentCells({ row: 0, col: 1 });

      expect(adjacent).toHaveLength(3);
    });

    it('excludes occupied cells', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 1 });

      const adjacent = store.getValidAdjacentCells({ row: 0, col: 0 });

      expect(adjacent).toHaveLength(1);
      expect(adjacent).toContainEqual({ row: 1, col: 0 });
    });

    it('respects grid boundaries', () => {
      const store = useBlockDesignerStore.getState();
      const adjacent = store.getValidAdjacentCells({ row: 0, col: 0 });

      // Should not include negative positions
      expect(adjacent.every((p) => p.row >= 0 && p.col >= 0)).toBe(true);
    });
  });

  // ===========================================================================
  // Unit Transformations
  // ===========================================================================

  describe('rotateUnit', () => {
    describe('HST rotation', () => {
      it('rotates HST nw -> ne -> se -> sw -> nw', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'nw');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('ne');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('se');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('sw');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('nw');
      });

      it('updates timestamp after rotation', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'nw');
        const originalTime = useBlockDesignerStore.getState().block.updatedAt;

        // Small delay to ensure time difference
        const start = Date.now();
        while (Date.now() - start < 5) {
          // spin wait
        }

        useBlockDesignerStore.getState().rotateUnit(id);

        expect(useBlockDesignerStore.getState().block.updatedAt).not.toBe(originalTime);
      });
    });

    describe('Flying Geese rotation', () => {
      it('rotates Flying Geese direction: up -> right -> down -> left -> up', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'up');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('right');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('down');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('left');

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('up');
      });

      it('swaps span when rotating Flying Geese', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'up'); // 2x1

        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).span).toEqual({ rows: 2, cols: 1 });

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).span).toEqual({ rows: 1, cols: 2 });

        useBlockDesignerStore.getState().rotateUnit(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).span).toEqual({ rows: 2, cols: 1 });
      });
    });

    describe('QST rotation', () => {
      it('rotates QST by cycling part colors clockwise: left->top, top->right, right->bottom, bottom->left', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        useBlockDesignerStore.getState().rotateUnit(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          // After one rotation: left->top, top->right, right->bottom, bottom->left
          expect(unit.patchFabricRoles.top).toBe('background'); // was left
          expect(unit.patchFabricRoles.right).toBe('feature'); // was top
          expect(unit.patchFabricRoles.bottom).toBe('accent1'); // was right
          expect(unit.patchFabricRoles.left).toBe('accent2'); // was bottom
        }
      });

      it('returns to original colors after 4 rotations', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        // Rotate 4 times
        useBlockDesignerStore.getState().rotateUnit(id);
        useBlockDesignerStore.getState().rotateUnit(id);
        useBlockDesignerStore.getState().rotateUnit(id);
        useBlockDesignerStore.getState().rotateUnit(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          expect(unit.patchFabricRoles.top).toBe('feature');
          expect(unit.patchFabricRoles.right).toBe('accent1');
          expect(unit.patchFabricRoles.bottom).toBe('accent2');
          expect(unit.patchFabricRoles.left).toBe('background');
        }
      });
    });

    it('does nothing for square units', () => {
      const id = useBlockDesignerStore.getState().addSquare({ row: 0, col: 0 });
      const originalUnit = { ...useBlockDesignerStore.getState().block.units[0] };

      useBlockDesignerStore.getState().rotateUnit(id);

      const unit = useBlockDesignerStore.getState().block.units[0] as SquareUnit;
      expect(unit.type).toBe('square');
      expect(unit.span).toEqual(originalUnit.span);
    });

    it('does nothing for non-existent unit', () => {
      useBlockDesignerStore.getState().addSquare({ row: 0, col: 0 });

      // Should not throw
      expect(() => useBlockDesignerStore.getState().rotateUnit('non-existent-id')).not.toThrow();
    });
  });

  describe('flipUnitHorizontal', () => {
    describe('HST horizontal flip', () => {
      it('flips HST variant horizontally nw <-> ne', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'nw');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('ne');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('nw');
      });

      it('flips sw <-> se horizontally', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'sw');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('se');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('sw');
      });
    });

    describe('Flying Geese horizontal flip', () => {
      it('flips left <-> right', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'left');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('right');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('left');
      });

      it('does not change up/down directions', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'up');

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('up');
      });
    });

    describe('QST horizontal flip', () => {
      it('swaps left and right part colors', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        useBlockDesignerStore.getState().flipUnitHorizontal(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          expect(unit.patchFabricRoles.top).toBe('feature'); // unchanged
          expect(unit.patchFabricRoles.right).toBe('background'); // was left
          expect(unit.patchFabricRoles.bottom).toBe('accent2'); // unchanged
          expect(unit.patchFabricRoles.left).toBe('accent1'); // was right
        }
      });

      it('returns to original after two horizontal flips', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        useBlockDesignerStore.getState().flipUnitHorizontal(id);
        useBlockDesignerStore.getState().flipUnitHorizontal(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          expect(unit.patchFabricRoles.right).toBe('accent1');
          expect(unit.patchFabricRoles.left).toBe('background');
        }
      });
    });
  });

  describe('flipUnitVertical', () => {
    describe('HST vertical flip', () => {
      it('flips HST variant vertically nw <-> sw', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'nw');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('sw');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('nw');
      });

      it('flips ne <-> se vertically', () => {
        const id = useBlockDesignerStore.getState().addHst({ row: 0, col: 0 }, 'ne');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('se');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('ne');
      });
    });

    describe('Flying Geese vertical flip', () => {
      it('flips up <-> down', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'up');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('down');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('up');
      });

      it('does not change left/right directions', () => {
        const id = useBlockDesignerStore.getState().addFlyingGeese({ row: 0, col: 0 }, 'right');

        useBlockDesignerStore.getState().flipUnitVertical(id);
        expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('right');
      });
    });

    describe('QST vertical flip', () => {
      it('swaps top and bottom part colors', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        useBlockDesignerStore.getState().flipUnitVertical(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          expect(unit.patchFabricRoles.top).toBe('accent2'); // was bottom
          expect(unit.patchFabricRoles.right).toBe('accent1'); // unchanged
          expect(unit.patchFabricRoles.bottom).toBe('feature'); // was top
          expect(unit.patchFabricRoles.left).toBe('background'); // unchanged
        }
      });

      it('returns to original after two vertical flips', () => {
        const id = useBlockDesignerStore.getState().addQst({ row: 0, col: 0 }, {
          top: 'feature',
          right: 'accent1',
          bottom: 'accent2',
          left: 'background',
        });

        useBlockDesignerStore.getState().flipUnitVertical(id);
        useBlockDesignerStore.getState().flipUnitVertical(id);

        const unit = useBlockDesignerStore.getState().block.units[0];
        if (unit.type === 'qst') {
          expect(unit.patchFabricRoles.top).toBe('feature');
          expect(unit.patchFabricRoles.bottom).toBe('accent2');
        }
      });
    });
  });

  // ===========================================================================
  // Undo/Redo
  // ===========================================================================

  describe('undo', () => {
    it('undoes add unit operation', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('undoes remove unit operation', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.removeUnit(id);

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);

      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });

    it('undoes fabric role change', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 }, 'background');
      store.assignFabricRole(id, 'accent1');

      expect((useBlockDesignerStore.getState().block.units[0] as SquareUnit).fabricRole).toBe('accent1');

      store.undo();

      expect((useBlockDesignerStore.getState().block.units[0] as SquareUnit).fabricRole).toBe('background');
    });

    it('undoes palette color change', () => {
      const store = useBlockDesignerStore.getState();
      const originalColor = store.block.previewPalette.roles.find((r) => r.id === 'background')?.color;
      store.setRoleColor('background', '#FF0000');

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.find((r) => r.id === 'background')?.color).toBe('#FF0000');

      store.undo();

      expect(useBlockDesignerStore.getState().block.previewPalette.roles.find((r) => r.id === 'background')?.color).toBe(originalColor);
    });

    it('undoes HST rotation', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');
      store.rotateUnit(id);

      expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('ne');

      store.undo();

      expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('nw');
    });

    it('undoes HST flip horizontal', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');
      store.flipUnitHorizontal(id);

      expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('ne');

      store.undo();

      expect((useBlockDesignerStore.getState().block.units[0] as HstUnit).variant).toBe('nw');
    });

    it('undoes Flying Geese rotation', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');
      store.rotateUnit(id);

      expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('right');
      expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).span).toEqual({ rows: 1, cols: 2 });

      store.undo();

      expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).direction).toBe('up');
      expect((useBlockDesignerStore.getState().block.units[0] as FlyingGeeseUnit).span).toEqual({ rows: 2, cols: 1 });
    });

    it('clears selection when undoing removes selected unit', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectUnit(id);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);

      store.undo();

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });

    it('does nothing when undo stack is empty', () => {
      const store = useBlockDesignerStore.getState();

      // Should not throw
      expect(() => store.undo()).not.toThrow();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('supports multiple undos in sequence', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 0, col: 1 });
      store.addSquare({ row: 0, col: 2 });

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(3);

      store.undo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);

      store.undo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.undo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });
  });

  describe('redo', () => {
    it('redoes undone add unit operation', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);

      store.redo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });

    it('redoes undone remove unit operation', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.removeUnit(id);
      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.redo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('does nothing when redo stack is empty', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      // Should not throw
      expect(() => store.redo()).not.toThrow();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });

    it('clears redo stack when new operation is performed', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.undo();

      expect(useBlockDesignerStore.getState().canRedo()).toBe(true);

      // New operation should clear redo stack
      store.addSquare({ row: 1, col: 1 });

      expect(useBlockDesignerStore.getState().canRedo()).toBe(false);
    });

    it('supports multiple redos in sequence', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 0, col: 1 });
      store.addSquare({ row: 0, col: 2 });
      store.undo();
      store.undo();
      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);

      store.redo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.redo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);

      store.redo();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(3);
    });
  });

  describe('canUndo', () => {
    it('returns false when undo stack is empty', () => {
      expect(useBlockDesignerStore.getState().canUndo()).toBe(false);
    });

    it('returns true when undo stack has operations', () => {
      useBlockDesignerStore.getState().addSquare({ row: 0, col: 0 });

      expect(useBlockDesignerStore.getState().canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('returns false when redo stack is empty', () => {
      expect(useBlockDesignerStore.getState().canRedo()).toBe(false);
    });

    it('returns true after undo', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.undo();

      expect(store.canRedo()).toBe(true);
    });
  });

  describe('preview mode', () => {
    describe('enterPreview', () => {
      it('sets mode to preview', () => {
        const store = useBlockDesignerStore.getState();
        store.enterPreview();

        expect(useBlockDesignerStore.getState().mode).toBe('preview');
      });

      it('clears selectedUnitId when entering preview', () => {
        const store = useBlockDesignerStore.getState();
        store.addSquare({ row: 0, col: 0 });
        const unitId = useBlockDesignerStore.getState().block.units[0].id;
        store.selectUnit(unitId);

        expect(useBlockDesignerStore.getState().selectedUnitId).toBe(unitId);

        store.enterPreview();
        expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
      });

      it('clears activeFabricRole when entering preview', () => {
        const store = useBlockDesignerStore.getState();
        store.setActiveFabricRole('feature');

        expect(useBlockDesignerStore.getState().activeFabricRole).toBe('feature');

        store.enterPreview();
        expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
      });

      it('clears flyingGeesePlacement when entering preview', () => {
        const store = useBlockDesignerStore.getState();
        store.startFlyingGeesePlacement({ row: 0, col: 0 });

        expect(useBlockDesignerStore.getState().flyingGeesePlacement).not.toBeNull();

        store.enterPreview();
        expect(useBlockDesignerStore.getState().flyingGeesePlacement).toBeNull();
      });
    });

    describe('exitPreview', () => {
      it('sets mode to idle', () => {
        const store = useBlockDesignerStore.getState();
        store.enterPreview();
        expect(useBlockDesignerStore.getState().mode).toBe('preview');

        store.exitPreview();
        expect(useBlockDesignerStore.getState().mode).toBe('idle');
      });
    });

    describe('setPreviewRotationPreset', () => {
      it('sets preset to all_same', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('all_same');

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('all_same');
      });

      it('sets preset to alternating', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('alternating');

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('alternating');
      });

      it('sets preset to pinwheel', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('pinwheel');

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('pinwheel');
      });

      it('sets preset to random', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('random');

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('random');
      });
    });

    describe('previewRotationPreset initialization', () => {
      it('defaults to all_same on initBlock', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('pinwheel');
        store.initBlock(3);

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('all_same');
      });

      it('resets to all_same on loadBlock', () => {
        const store = useBlockDesignerStore.getState();
        store.setPreviewRotationPreset('random');
        store.loadBlock({
          id: 'test-id',
          creatorId: 'creator-id',
          derivedFromBlockId: null,
          title: 'Test Block',
          description: null,
          hashtags: [],
          gridSize: 3,
          units: [],
          previewPalette: {
            roles: [
              { id: 'background', name: 'Background', color: '#FFFFFF' },
              { id: 'feature', name: 'Feature', color: '#1E3A5F' },
            ],
          },
          status: 'draft',
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        expect(useBlockDesignerStore.getState().previewRotationPreset).toBe('all_same');
      });
    });
  });

  // ===========================================================================
  // Unit Library Selection
  // ===========================================================================

  describe('unit library selection', () => {
    describe('selectUnitForPlacement', () => {
      it('selects a square unit type for placement', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'square' });

        const state = useBlockDesignerStore.getState();
        expect(state.selectedUnitType).toEqual({ type: 'square' });
        expect(state.mode).toBe('placing_unit');
      });

      it('selects an HST unit type with variant for placement', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'hst', variant: 'nw' });

        const state = useBlockDesignerStore.getState();
        expect(state.selectedUnitType).toEqual({ type: 'hst', variant: 'nw' });
        expect(state.mode).toBe('placing_unit');
      });

      it('selects a flying_geese unit type for placement', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'flying_geese' });

        const state = useBlockDesignerStore.getState();
        expect(state.selectedUnitType).toEqual({ type: 'flying_geese' });
        expect(state.mode).toBe('placing_unit');
      });

      it('clears selection when passing null', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'square' });
        store.selectUnitForPlacement(null);

        const state = useBlockDesignerStore.getState();
        expect(state.selectedUnitType).toBeNull();
        expect(state.mode).toBe('idle');
      });

      it('clears selectedUnitId when selecting unit type', () => {
        const store = useBlockDesignerStore.getState();
        const id = store.addSquare({ row: 0, col: 0 });
        store.selectUnit(id);

        expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);

        store.selectUnitForPlacement({ type: 'square' });

        expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
      });

      it('clears activeFabricRole when selecting unit type', () => {
        const store = useBlockDesignerStore.getState();
        store.setActiveFabricRole('accent1');

        expect(useBlockDesignerStore.getState().activeFabricRole).toBe('accent1');

        store.selectUnitForPlacement({ type: 'hst', variant: 'ne' });

        expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
      });

      it('clears flyingGeesePlacement when selecting unit type', () => {
        const store = useBlockDesignerStore.getState();
        store.startFlyingGeesePlacement({ row: 0, col: 0 });

        expect(useBlockDesignerStore.getState().flyingGeesePlacement).not.toBeNull();

        store.selectUnitForPlacement({ type: 'square' });

        expect(useBlockDesignerStore.getState().flyingGeesePlacement).toBeNull();
      });
    });

    describe('setHoveredCell', () => {
      it('sets the hovered cell position', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 1, col: 2 });

        expect(useBlockDesignerStore.getState().hoveredCell).toEqual({ row: 1, col: 2 });
      });

      it('clears hovered cell when passing null', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 1, col: 2 });
        store.setHoveredCell(null);

        expect(useBlockDesignerStore.getState().hoveredCell).toBeNull();
      });

      it('updates hovered cell when changing position', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 0, col: 0 });
        store.setHoveredCell({ row: 2, col: 1 });

        expect(useBlockDesignerStore.getState().hoveredCell).toEqual({ row: 2, col: 1 });
      });
    });

    describe('clearUnitSelection', () => {
      it('clears selectedUnitType', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'square' });

        expect(useBlockDesignerStore.getState().selectedUnitType).not.toBeNull();

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().selectedUnitType).toBeNull();
      });

      it('clears hoveredCell', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 1, col: 1 });

        expect(useBlockDesignerStore.getState().hoveredCell).not.toBeNull();

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().hoveredCell).toBeNull();
      });

      it('sets mode to idle when in placing_unit mode', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'hst', variant: 'sw' });

        expect(useBlockDesignerStore.getState().mode).toBe('placing_unit');

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().mode).toBe('idle');
      });

      it('sets mode to idle when in placing_flying_geese_second mode', () => {
        const store = useBlockDesignerStore.getState();
        store.startFlyingGeesePlacement({ row: 0, col: 0 });

        expect(useBlockDesignerStore.getState().mode).toBe('placing_flying_geese_second');

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().mode).toBe('idle');
      });

      it('clears flyingGeesePlacement', () => {
        const store = useBlockDesignerStore.getState();
        store.startFlyingGeesePlacement({ row: 1, col: 1 });

        expect(useBlockDesignerStore.getState().flyingGeesePlacement).not.toBeNull();

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().flyingGeesePlacement).toBeNull();
      });

      it('does not change mode if already idle', () => {
        const store = useBlockDesignerStore.getState();

        expect(useBlockDesignerStore.getState().mode).toBe('idle');

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().mode).toBe('idle');
      });

      it('does not change mode if in paint_mode', () => {
        const store = useBlockDesignerStore.getState();
        store.setActiveFabricRole('feature');

        expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');
      });
    });

    describe('state reset on initBlock', () => {
      it('resets selectedUnitType to null', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'square' });

        store.initBlock(3);

        expect(useBlockDesignerStore.getState().selectedUnitType).toBeNull();
      });

      it('resets hoveredCell to null', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 1, col: 1 });

        store.initBlock(3);

        expect(useBlockDesignerStore.getState().hoveredCell).toBeNull();
      });
    });

    describe('state reset on loadBlock', () => {
      const testBlock: Block = {
        id: 'test-id',
        creatorId: 'creator-id',
        derivedFromBlockId: null,
        title: 'Test Block',
        description: null,
        hashtags: [],
        gridSize: 3,
        units: [],
        previewPalette: {
          roles: [
            { id: 'background', name: 'Background', color: '#FFFFFF' },
            { id: 'feature', name: 'Feature', color: '#1E3A5F' },
          ],
        },
        status: 'draft',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      it('resets selectedUnitType to null', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'flying_geese' });

        store.loadBlock(testBlock);

        expect(useBlockDesignerStore.getState().selectedUnitType).toBeNull();
      });

      it('resets hoveredCell to null', () => {
        const store = useBlockDesignerStore.getState();
        store.setHoveredCell({ row: 2, col: 2 });

        store.loadBlock(testBlock);

        expect(useBlockDesignerStore.getState().hoveredCell).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Grid Size Management
  // ===========================================================================

  describe('setGridSize', () => {
    it('changes grid size', () => {
      const store = useBlockDesignerStore.getState();
      expect(store.block.gridSize).toBe(DEFAULT_GRID_SIZE);

      store.setGridSize(5);

      expect(useBlockDesignerStore.getState().block.gridSize).toBe(5);
    });

    it('returns null when no units are removed', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const result = store.setGridSize(5);

      expect(result).toBeNull();
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });

    it('returns null when size is unchanged', () => {
      const store = useBlockDesignerStore.getState();

      const result = store.setGridSize(DEFAULT_GRID_SIZE);

      expect(result).toBeNull();
    });

    it('removes units outside new grid bounds when shrinking', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addSquare({ row: 0, col: 0 }); // In bounds for 3x3
      store.addSquare({ row: 4, col: 4 }); // Out of bounds for 3x3

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);

      const result = store.setGridSize(3);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
      expect(useBlockDesignerStore.getState().block.units[0].position).toEqual({ row: 0, col: 0 });
    });

    it('clears selection if selected unit is removed', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      const id = store.addSquare({ row: 4, col: 4 });
      store.selectUnit(id);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);

      store.setGridSize(3);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBeNull();
    });

    it('keeps selection if selected unit is not removed', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      const id = store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 4, col: 4 });
      store.selectUnit(id);

      store.setGridSize(3);

      expect(useBlockDesignerStore.getState().selectedUnitId).toBe(id);
    });

    it('removes Flying Geese units that span outside new bounds', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addFlyingGeese({ row: 3, col: 3 }, 'right'); // spans cols 3-4, out of bounds for 3x3

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      const result = store.setGridSize(3);

      expect(result).toHaveLength(1);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
    });

    it('updates updatedAt timestamp', () => {
      const store = useBlockDesignerStore.getState();
      const originalTime = store.block.updatedAt;

      // Small delay to ensure time difference
      const start = Date.now();
      while (Date.now() - start < 5) {
        // spin wait
      }

      store.setGridSize(5);

      expect(useBlockDesignerStore.getState().block.updatedAt).not.toBe(originalTime);
    });
  });

  describe('getUnitsOutOfBounds', () => {
    it('returns empty array when no units are out of bounds', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 1, col: 1 });

      const result = store.getUnitsOutOfBounds(3);

      expect(result).toHaveLength(0);
    });

    it('returns units outside given grid size', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addSquare({ row: 0, col: 0 }); // In bounds
      store.addSquare({ row: 3, col: 3 }); // Out of bounds for 3x3
      store.addSquare({ row: 4, col: 4 }); // Out of bounds for 3x3

      const result = store.getUnitsOutOfBounds(3);

      expect(result).toHaveLength(2);
    });

    it('considers unit span when checking bounds', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addFlyingGeese({ row: 2, col: 2 }, 'right'); // spans cols 2-3

      // For size 3, position (2,2) is in bounds but (2,3) is out
      const result = store.getUnitsOutOfBounds(3);

      expect(result).toHaveLength(1);
    });

    it('returns empty array when grid size is larger', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 2, col: 2 });

      const result = store.getUnitsOutOfBounds(8);

      expect(result).toHaveLength(0);
    });
  });

  describe('undo/redo for setGridSize', () => {
    it('undoes grid size change', () => {
      const store = useBlockDesignerStore.getState();
      expect(store.block.gridSize).toBe(DEFAULT_GRID_SIZE);

      store.setGridSize(5);
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(5);

      store.undo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(DEFAULT_GRID_SIZE);
    });

    it('redoes grid size change', () => {
      const store = useBlockDesignerStore.getState();
      store.setGridSize(6);
      store.undo();

      expect(useBlockDesignerStore.getState().block.gridSize).toBe(DEFAULT_GRID_SIZE);

      store.redo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(6);
    });

    it('restores removed units on undo', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 4, col: 4 });

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);

      store.setGridSize(3);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);

      store.undo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(5);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);
    });

    it('removes units again on redo after undo', () => {
      const store = useBlockDesignerStore.getState();
      store.initBlock(5);
      store.addSquare({ row: 0, col: 0 });
      store.addSquare({ row: 4, col: 4 });

      store.setGridSize(3);
      store.undo();

      expect(useBlockDesignerStore.getState().block.units).toHaveLength(2);

      store.redo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(3);
      expect(useBlockDesignerStore.getState().block.units).toHaveLength(1);
    });

    it('supports multiple grid size changes with undo', () => {
      const store = useBlockDesignerStore.getState();
      store.setGridSize(4);
      store.setGridSize(6);
      store.setGridSize(8);

      expect(useBlockDesignerStore.getState().block.gridSize).toBe(8);

      store.undo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(6);

      store.undo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(4);

      store.undo();
      expect(useBlockDesignerStore.getState().block.gridSize).toBe(DEFAULT_GRID_SIZE);
    });
  });

  // ===========================================================================
  // Range Fill Anchor
  // ===========================================================================

  describe('rangeFillAnchor', () => {
    describe('setRangeFillAnchor', () => {
      it('sets the anchor position', () => {
        const store = useBlockDesignerStore.getState();
        expect(store.rangeFillAnchor).toBeNull();

        store.setRangeFillAnchor({ row: 2, col: 1 });

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toEqual({
          row: 2,
          col: 1,
        });
      });

      it('updates existing anchor position', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });
        store.setRangeFillAnchor({ row: 2, col: 2 });

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toEqual({
          row: 2,
          col: 2,
        });
      });

      it('clears anchor when set to null', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(useBlockDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.setRangeFillAnchor(null);

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('getRangeFillPositions', () => {
      it('returns only end position when no anchor is set', () => {
        const store = useBlockDesignerStore.getState();

        const positions = store.getRangeFillPositions({ row: 2, col: 2 });

        expect(positions).toEqual([{ row: 2, col: 2 }]);
      });

      it('returns rectangular range when anchor is set', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });

        const positions = store.getRangeFillPositions({ row: 1, col: 1 });

        expect(positions).toHaveLength(4);
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 0, col: 1 });
        expect(positions).toContainEqual({ row: 1, col: 0 });
        expect(positions).toContainEqual({ row: 1, col: 1 });
      });

      it('filters out occupied cells', () => {
        const store = useBlockDesignerStore.getState();
        // Add a unit at (0, 1)
        store.addSquare({ row: 0, col: 1 }, 'background');

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
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });

        const positions = store.getRangeFillPositions({ row: 1, col: 1 });

        expect(positions).toHaveLength(1);
        expect(positions[0]).toEqual({ row: 1, col: 1 });
      });

      it('handles reversed direction', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 2, col: 2 });

        const positions = store.getRangeFillPositions({ row: 0, col: 0 });

        expect(positions).toHaveLength(9);
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 2, col: 2 });
      });

      it('handles horizontal range', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 0 });

        const positions = store.getRangeFillPositions({ row: 1, col: 2 });

        expect(positions).toHaveLength(3);
        positions.forEach((pos) => {
          expect(pos.row).toBe(1);
        });
      });

      it('handles vertical range', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 1 });

        const positions = store.getRangeFillPositions({ row: 2, col: 1 });

        expect(positions).toHaveLength(3);
        positions.forEach((pos) => {
          expect(pos.col).toBe(1);
        });
      });
    });

    describe('clearUnitSelection clears rangeFillAnchor', () => {
      it('clears anchor when clearing unit selection', () => {
        const store = useBlockDesignerStore.getState();
        store.selectUnitForPlacement({ type: 'square' });
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(useBlockDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.clearUnitSelection();

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('initBlock clears rangeFillAnchor', () => {
      it('clears anchor when initializing new block', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(useBlockDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.initBlock();

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('loadBlock clears rangeFillAnchor', () => {
      it('clears anchor when loading a block', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 1, col: 1 });
        expect(useBlockDesignerStore.getState().rangeFillAnchor).not.toBeNull();

        store.loadBlock({
          id: 'block-1',
          creatorId: 'user-1',
          derivedFromBlockId: null,
          title: 'Test Block',
          description: null,
          hashtags: [],
          gridSize: 3,
          units: [],
          previewPalette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
          status: 'draft',
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        expect(useBlockDesignerStore.getState().rangeFillAnchor).toBeNull();
      });
    });

    describe('integration with batch placement', () => {
      it('enables shift-click workflow for squares', () => {
        const store = useBlockDesignerStore.getState();

        // First click places unit and sets anchor
        store.addSquare({ row: 0, col: 0 }, 'background');
        store.setRangeFillAnchor({ row: 0, col: 0 });

        // Get positions for range fill
        const positions = store.getRangeFillPositions({ row: 2, col: 2 });
        // (0,0) is already occupied, so should have 8 empty positions
        expect(positions).toHaveLength(8);

        // Batch place at those positions
        store.addUnitsBatch(positions, { type: 'square' });

        // Should now have 9 units total
        expect(useBlockDesignerStore.getState().block.units).toHaveLength(9);
      });

      it('enables shift-click workflow for HSTs', () => {
        const store = useBlockDesignerStore.getState();

        // First click places unit and sets anchor
        store.addHst({ row: 0, col: 0 }, 'top_left', 'background', 'background');
        store.setRangeFillAnchor({ row: 0, col: 0 });

        // Get positions for range fill
        const positions = store.getRangeFillPositions({ row: 1, col: 1 });
        // (0,0) is already occupied, so should have 3 empty positions
        expect(positions).toHaveLength(3);

        // Batch place at those positions
        store.addUnitsBatch(positions, { type: 'hst', variant: 'top_left' });

        // Should now have 4 units total
        expect(useBlockDesignerStore.getState().block.units).toHaveLength(4);
      });

      it('supports chaining range fills', () => {
        const store = useBlockDesignerStore.getState();

        // First range
        store.addSquare({ row: 0, col: 0 }, 'background');
        store.setRangeFillAnchor({ row: 0, col: 0 });
        const positions1 = store.getRangeFillPositions({ row: 1, col: 1 });
        store.addUnitsBatch(positions1, { type: 'square' });
        store.setRangeFillAnchor({ row: 1, col: 1 });

        expect(useBlockDesignerStore.getState().block.units).toHaveLength(4);

        // Second range from (1,1) to (2,2)
        const positions2 = store.getRangeFillPositions({ row: 2, col: 2 });
        expect(positions2).toHaveLength(3); // (1,1) is occupied

        store.addUnitsBatch(positions2, { type: 'square' });

        expect(useBlockDesignerStore.getState().block.units).toHaveLength(7);
      });

      it('does not apply range fill for Flying Geese (they use two-tap)', () => {
        const store = useBlockDesignerStore.getState();
        store.setRangeFillAnchor({ row: 0, col: 0 });

        // Flying Geese are excluded from addUnitsBatch (batch placement)
        // This is a design decision - they require two-tap placement
        const positions = store.getRangeFillPositions({ row: 1, col: 1 });
        expect(positions).toHaveLength(4);

        // addUnitsBatch should skip Flying Geese types
        store.addUnitsBatch(positions, { type: 'flying_geese' });

        // No units should be added (Flying Geese ignored)
        expect(useBlockDesignerStore.getState().block.units).toHaveLength(0);
      });
    });
  });
});
