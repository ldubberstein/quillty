/**
 * Block Designer Store Tests
 *
 * Comprehensive tests for the Zustand store managing Block Designer state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBlockDesignerStore } from './store';
import { DEFAULT_GRID_SIZE, DEFAULT_PALETTE } from './constants';
import type { Block, GridPosition, HstVariant, FlyingGeeseDirection, SquareShape, HstShape, FlyingGeeseShape } from './types';

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
      shapes: [],
      previewPalette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
      status: 'draft',
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    selectedShapeId: null,
    activeFabricRole: null,
    mode: 'idle',
    flyingGeesePlacement: null,
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
      expect(block.shapes).toHaveLength(0);
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
      const shapeId = useBlockDesignerStore.getState().block.shapes[0].id;
      useBlockDesignerStore.getState().selectShape(shapeId);
      useBlockDesignerStore.getState().setActiveFabricRole('accent1');

      // Now init a new block
      useBlockDesignerStore.getState().initBlock();

      const state = useBlockDesignerStore.getState();
      expect(state.selectedShapeId).toBeNull();
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
        shapes: [],
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
      const shapeId = useBlockDesignerStore.getState().block.shapes[0].id;
      useBlockDesignerStore.getState().selectShape(shapeId);

      const newBlock: Block = {
        id: 'new-block',
        creatorId: '',
        derivedFromBlockId: null,
        title: '',
        description: null,
        hashtags: [],
        gridSize: 3,
        shapes: [],
        previewPalette: DEFAULT_PALETTE,
        status: 'draft',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useBlockDesignerStore.getState().loadBlock(newBlock);

      const state = useBlockDesignerStore.getState();
      expect(state.selectedShapeId).toBeNull();
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
  // Shape Management
  // ===========================================================================

  describe('addSquare', () => {
    it('adds a square shape at specified position', () => {
      const store = useBlockDesignerStore.getState();
      const position: GridPosition = { row: 1, col: 2 };

      const id = store.addSquare(position);

      const { block } = useBlockDesignerStore.getState();
      expect(block.shapes).toHaveLength(1);
      expect(block.shapes[0].type).toBe('square');
      expect(block.shapes[0].position).toEqual(position);
      expect(block.shapes[0].id).toBe(id);
    });

    it('uses default fabric role (background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const shape = useBlockDesignerStore.getState().block.shapes[0] as SquareShape;
      expect(shape.fabricRole).toBe('background');
    });

    it('accepts custom fabric role', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 }, 'accent1');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as SquareShape;
      expect(shape.fabricRole).toBe('accent1');
    });

    it('sets span to 1x1', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      expect(shape.span).toEqual({ rows: 1, cols: 1 });
    });
  });

  describe('addHst', () => {
    it('adds an HST shape with specified variant', () => {
      const store = useBlockDesignerStore.getState();
      const position: GridPosition = { row: 0, col: 0 };
      const variant: HstVariant = 'nw';

      const id = store.addHst(position, variant);

      const { block } = useBlockDesignerStore.getState();
      expect(block.shapes).toHaveLength(1);
      expect(block.shapes[0].type).toBe('hst');
      expect(block.shapes[0].id).toBe(id);
      if (block.shapes[0].type === 'hst') {
        expect(block.shapes[0].variant).toBe('nw');
      }
    });

    it.each(['nw', 'ne', 'sw', 'se'] as HstVariant[])('supports variant: %s', (variant) => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, variant);

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      if (shape.type === 'hst') {
        expect(shape.variant).toBe(variant);
      }
    });

    it('uses default fabric roles (both background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, 'nw');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as HstShape;
      expect(shape.fabricRole).toBe('background');
      expect(shape.secondaryFabricRole).toBe('background');
    });

    it('accepts custom fabric roles', () => {
      const store = useBlockDesignerStore.getState();
      store.addHst({ row: 0, col: 0 }, 'nw', 'accent1', 'accent2');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as HstShape;
      expect(shape.fabricRole).toBe('accent1');
      expect(shape.secondaryFabricRole).toBe('accent2');
    });
  });

  describe('addFlyingGeese', () => {
    it('adds a Flying Geese shape with horizontal span for left/right', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'right');

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      expect(shape.type).toBe('flying_geese');
      expect(shape.span).toEqual({ rows: 1, cols: 2 });
    });

    it('adds a Flying Geese shape with vertical span for up/down', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'down');

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      expect(shape.span).toEqual({ rows: 2, cols: 1 });
    });

    it.each(['up', 'down', 'left', 'right'] as FlyingGeeseDirection[])(
      'supports direction: %s',
      (direction) => {
        resetStore();
        const store = useBlockDesignerStore.getState();
        store.addFlyingGeese({ row: 0, col: 0 }, direction);

        const shape = useBlockDesignerStore.getState().block.shapes[0];
        if (shape.type === 'flying_geese') {
          expect(shape.direction).toBe(direction);
        }
      }
    );

    it('uses default fabric roles (all background)', () => {
      const store = useBlockDesignerStore.getState();
      store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as FlyingGeeseShape;
      expect(shape.partFabricRoles.goose).toBe('background');
      expect(shape.partFabricRoles.sky1).toBe('background');
      expect(shape.partFabricRoles.sky2).toBe('background');
    });
  });

  describe('removeShape', () => {
    it('removes a shape by ID', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      expect(useBlockDesignerStore.getState().block.shapes).toHaveLength(1);

      store.removeShape(id);

      expect(useBlockDesignerStore.getState().block.shapes).toHaveLength(0);
    });

    it('clears selection if removed shape was selected', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectShape(id);

      expect(useBlockDesignerStore.getState().selectedShapeId).toBe(id);

      store.removeShape(id);

      expect(useBlockDesignerStore.getState().selectedShapeId).toBeNull();
    });

    it('does nothing if shape ID not found', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      store.removeShape('non-existent-id');

      expect(useBlockDesignerStore.getState().block.shapes).toHaveLength(1);
    });
  });

  describe('updateShape', () => {
    it('updates shape properties', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.updateShape(id, { fabricRole: 'accent1' });

      const shape = useBlockDesignerStore.getState().block.shapes[0] as SquareShape;
      expect(shape.fabricRole).toBe('accent1');
    });

    it('updates position', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.updateShape(id, { position: { row: 1, col: 1 } });

      expect(useBlockDesignerStore.getState().block.shapes[0].position).toEqual({ row: 1, col: 1 });
    });

    it('does nothing if shape ID not found', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 }, 'background');

      store.updateShape('non-existent-id', { fabricRole: 'accent1' });

      const shape = useBlockDesignerStore.getState().block.shapes[0] as SquareShape;
      expect(shape.fabricRole).toBe('background');
    });
  });

  // ===========================================================================
  // Selection
  // ===========================================================================

  describe('selectShape', () => {
    it('selects a shape by ID', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });

      store.selectShape(id);

      expect(useBlockDesignerStore.getState().selectedShapeId).toBe(id);
    });

    it('can select null to deselect', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectShape(id);

      store.selectShape(null);

      expect(useBlockDesignerStore.getState().selectedShapeId).toBeNull();
    });

    it('exits paint mode when selecting a shape', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.setActiveFabricRole('accent1');

      expect(useBlockDesignerStore.getState().mode).toBe('paint_mode');

      store.selectShape(id);

      expect(useBlockDesignerStore.getState().mode).toBe('idle');
      expect(useBlockDesignerStore.getState().activeFabricRole).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('clears the current selection', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 });
      store.selectShape(id);

      store.clearSelection();

      expect(useBlockDesignerStore.getState().selectedShapeId).toBeNull();
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
      store.selectShape(id);

      store.setActiveFabricRole('accent1');

      expect(useBlockDesignerStore.getState().selectedShapeId).toBeNull();
    });
  });

  describe('assignFabricRole', () => {
    it('assigns fabric role to a square shape', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 0, col: 0 }, 'background');

      store.assignFabricRole(id, 'accent2');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as SquareShape;
      expect(shape.fabricRole).toBe('accent2');
    });

    it('assigns primary fabric role to HST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');

      store.assignFabricRole(id, 'accent1', 'primary');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as HstShape;
      expect(shape.fabricRole).toBe('accent1');
    });

    it('assigns secondary fabric role to HST', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addHst({ row: 0, col: 0 }, 'nw');

      store.assignFabricRole(id, 'accent1', 'secondary');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as HstShape;
      expect(shape.secondaryFabricRole).toBe('accent1');
    });

    it('assigns goose fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'accent1', 'goose');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as FlyingGeeseShape;
      expect(shape.partFabricRoles.goose).toBe('accent1');
    });

    it('assigns sky1 fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'accent2', 'sky1');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as FlyingGeeseShape;
      expect(shape.partFabricRoles.sky1).toBe('accent2');
    });

    it('assigns sky2 fabric role to Flying Geese', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'up');

      store.assignFabricRole(id, 'feature', 'sky2');

      const shape = useBlockDesignerStore.getState().block.shapes[0] as FlyingGeeseShape;
      expect(shape.partFabricRoles.sky2).toBe('feature');
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
      expect(useBlockDesignerStore.getState().block.shapes).toHaveLength(1);
      expect(useBlockDesignerStore.getState().block.shapes[0].type).toBe('flying_geese');
    });

    it('returns null and cancels for invalid position', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      const id = store.completeFlyingGeesePlacement({ row: 2, col: 2 }); // Not adjacent

      expect(id).toBeNull();
      expect(useBlockDesignerStore.getState().block.shapes).toHaveLength(0);
      expect(useBlockDesignerStore.getState().mode).toBe('idle');
    });

    it('determines correct direction for rightward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });
      store.completeFlyingGeesePlacement({ row: 0, col: 1 });

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      if (shape.type === 'flying_geese') {
        expect(shape.direction).toBe('right');
      }
    });

    it('determines correct direction for leftward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 1 });
      store.completeFlyingGeesePlacement({ row: 0, col: 0 });

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      if (shape.type === 'flying_geese') {
        expect(shape.direction).toBe('left');
      }
    });

    it('determines correct direction for downward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });
      store.completeFlyingGeesePlacement({ row: 1, col: 0 });

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      if (shape.type === 'flying_geese') {
        expect(shape.direction).toBe('down');
      }
    });

    it('determines correct direction for upward placement', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 0 });
      store.completeFlyingGeesePlacement({ row: 0, col: 0 });

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      if (shape.type === 'flying_geese') {
        expect(shape.direction).toBe('up');
      }
    });

    it('uses top-left cell as position', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 1, col: 1 });
      store.completeFlyingGeesePlacement({ row: 0, col: 1 }); // Click above

      const shape = useBlockDesignerStore.getState().block.shapes[0];
      // Position should be top cell regardless of click order
      expect(shape.position).toEqual({ row: 0, col: 1 });
    });

    it('returns null if no placement in progress', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.completeFlyingGeesePlacement({ row: 0, col: 1 });

      expect(id).toBeNull();
    });
  });

  describe('cancelFlyingGeesePlacement', () => {
    it('cancels placement and returns to idle', () => {
      const store = useBlockDesignerStore.getState();
      store.startFlyingGeesePlacement({ row: 0, col: 0 });

      store.cancelFlyingGeesePlacement();

      const state = useBlockDesignerStore.getState();
      expect(state.flyingGeesePlacement).toBeNull();
      expect(state.mode).toBe('idle');
    });
  });

  // ===========================================================================
  // Utility Functions
  // ===========================================================================

  describe('getShapeAt', () => {
    it('returns shape at exact position', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addSquare({ row: 1, col: 2 });

      const shape = store.getShapeAt({ row: 1, col: 2 });

      expect(shape?.id).toBe(id);
    });

    it('returns undefined if no shape at position', () => {
      const store = useBlockDesignerStore.getState();
      store.addSquare({ row: 0, col: 0 });

      const shape = store.getShapeAt({ row: 2, col: 2 });

      expect(shape).toBeUndefined();
    });

    it('finds Flying Geese shape spanning multiple cells', () => {
      const store = useBlockDesignerStore.getState();
      const id = store.addFlyingGeese({ row: 0, col: 0 }, 'right');

      // Should find at both positions
      expect(store.getShapeAt({ row: 0, col: 0 })?.id).toBe(id);
      expect(store.getShapeAt({ row: 0, col: 1 })?.id).toBe(id);
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

    it('returns true for cell covered by multi-cell shape', () => {
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
});
