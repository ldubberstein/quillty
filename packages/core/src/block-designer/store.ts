/**
 * Block Designer Zustand Store
 *
 * State management for the Block Designer using Zustand with Immer middleware.
 * Provides reactive state for shapes, selection, palette, and designer mode.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Block,
  Shape,
  SquareShape,
  HstShape,
  FlyingGeeseShape,
  FlyingGeesePartId,
  GridSize,
  GridPosition,
  FabricRoleId,
  HstVariant,
  FlyingGeeseDirection,
  DesignerMode,
  FlyingGeesePlacementState,
  UUID,
} from './types';
import { DEFAULT_PALETTE, DEFAULT_GRID_SIZE } from './constants';

// =============================================================================
// Utility Functions
// =============================================================================

/** Generate a UUID v4 */
function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get current ISO timestamp */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/** Create a new empty block */
function createEmptyBlock(gridSize: GridSize = DEFAULT_GRID_SIZE, creatorId: UUID = ''): Block {
  const now = getCurrentTimestamp();
  return {
    id: generateUUID(),
    creatorId,
    derivedFromBlockId: null,
    title: '',
    description: null,
    hashtags: [],
    gridSize,
    shapes: [],
    previewPalette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
    status: 'draft',
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Store Types
// =============================================================================

interface BlockDesignerState {
  /** The current block being edited */
  block: Block;

  /** ID of the currently selected shape (null if none) */
  selectedShapeId: UUID | null;

  /** Active fabric role for paint mode (null if not in paint mode) */
  activeFabricRole: FabricRoleId | null;

  /** Current designer mode */
  mode: DesignerMode;

  /** State for Flying Geese two-tap placement */
  flyingGeesePlacement: FlyingGeesePlacementState | null;
}

interface BlockDesignerActions {
  // Block management
  /** Initialize a new empty block */
  initBlock: (gridSize?: GridSize, creatorId?: UUID) => void;
  /** Load an existing block */
  loadBlock: (block: Block) => void;
  /** Update block metadata (title, description, hashtags) */
  updateBlockMetadata: (updates: Partial<Pick<Block, 'title' | 'description' | 'hashtags'>>) => void;

  // Shape management
  /** Add a square shape at position */
  addSquare: (position: GridPosition, fabricRole?: FabricRoleId) => UUID;
  /** Add an HST shape at position */
  addHst: (
    position: GridPosition,
    variant: HstVariant,
    fabricRole?: FabricRoleId,
    secondaryFabricRole?: FabricRoleId
  ) => UUID;
  /** Add a Flying Geese shape spanning two cells */
  addFlyingGeese: (
    position: GridPosition,
    direction: FlyingGeeseDirection,
    partFabricRoles?: Partial<FlyingGeeseShape['partFabricRoles']>
  ) => UUID;
  /** Remove a shape by ID */
  removeShape: (shapeId: UUID) => void;
  /** Update a shape's properties */
  updateShape: (shapeId: UUID, updates: Partial<Shape>) => void;

  // Selection
  /** Select a shape by ID */
  selectShape: (shapeId: UUID | null) => void;
  /** Clear current selection */
  clearSelection: () => void;

  // Paint mode
  /** Set the active fabric role for paint mode */
  setActiveFabricRole: (roleId: FabricRoleId | null) => void;
  /** Assign a fabric role to a shape (partId for multi-part shapes like HST or Flying Geese) */
  assignFabricRole: (shapeId: UUID, roleId: FabricRoleId, partId?: string) => void;

  // Palette
  /** Change a palette role's color */
  setRoleColor: (roleId: FabricRoleId, color: string) => void;

  // Mode management
  /** Set the designer mode */
  setMode: (mode: DesignerMode) => void;

  // Flying Geese placement
  /** Start Flying Geese placement at first cell */
  startFlyingGeesePlacement: (position: GridPosition) => void;
  /** Complete Flying Geese placement with second cell */
  completeFlyingGeesePlacement: (secondPosition: GridPosition) => UUID | null;
  /** Cancel Flying Geese placement */
  cancelFlyingGeesePlacement: () => void;

  // Shape transformations
  /** Rotate a shape 90° clockwise */
  rotateShape: (shapeId: UUID) => void;
  /** Flip a shape horizontally */
  flipShapeHorizontal: (shapeId: UUID) => void;
  /** Flip a shape vertically */
  flipShapeVertical: (shapeId: UUID) => void;

  // Utility
  /** Get shape at a grid position */
  getShapeAt: (position: GridPosition) => Shape | undefined;
  /** Check if a cell is occupied */
  isCellOccupied: (position: GridPosition) => boolean;
  /** Get valid adjacent cells for Flying Geese placement */
  getValidAdjacentCells: (position: GridPosition) => GridPosition[];
}

export type BlockDesignerStore = BlockDesignerState & BlockDesignerActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const useBlockDesignerStore = create<BlockDesignerStore>()(
  immer((set, get) => ({
    // Initial state
    block: createEmptyBlock(),
    selectedShapeId: null,
    activeFabricRole: null,
    mode: 'idle',
    flyingGeesePlacement: null,

    // Block management
    initBlock: (gridSize = DEFAULT_GRID_SIZE, creatorId = '') => {
      set((state) => {
        state.block = createEmptyBlock(gridSize, creatorId);
        state.selectedShapeId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
      });
    },

    loadBlock: (block) => {
      set((state) => {
        state.block = block;
        state.selectedShapeId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
      });
    },

    updateBlockMetadata: (updates) => {
      set((state) => {
        if (updates.title !== undefined) state.block.title = updates.title;
        if (updates.description !== undefined) state.block.description = updates.description;
        if (updates.hashtags !== undefined) state.block.hashtags = updates.hashtags;
        state.block.updatedAt = getCurrentTimestamp();
      });
    },

    // Shape management
    addSquare: (position, fabricRole = 'background') => {
      const id = generateUUID();
      set((state) => {
        const shape: SquareShape = {
          id,
          type: 'square',
          position,
          span: { rows: 1, cols: 1 },
          fabricRole,
        };
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
      });
      return id;
    },

    addHst: (position, variant, fabricRole = 'background', secondaryFabricRole = 'background') => {
      const id = generateUUID();
      set((state) => {
        const shape: HstShape = {
          id,
          type: 'hst',
          position,
          span: { rows: 1, cols: 1 },
          fabricRole,
          variant,
          secondaryFabricRole,
        };
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
      });
      return id;
    },

    addFlyingGeese: (position, direction, partFabricRoles) => {
      const id = generateUUID();
      set((state) => {
        const isHorizontal = direction === 'left' || direction === 'right';
        const shape: FlyingGeeseShape = {
          id,
          type: 'flying_geese',
          position,
          span: isHorizontal ? { rows: 1, cols: 2 } : { rows: 2, cols: 1 },
          direction,
          partFabricRoles: {
            goose: partFabricRoles?.goose ?? 'background',
            sky1: partFabricRoles?.sky1 ?? 'background',
            sky2: partFabricRoles?.sky2 ?? 'background',
          },
        };
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
      });
      return id;
    },

    removeShape: (shapeId) => {
      set((state) => {
        const index = state.block.shapes.findIndex((s) => s.id === shapeId);
        if (index !== -1) {
          state.block.shapes.splice(index, 1);
          state.block.updatedAt = getCurrentTimestamp();
          if (state.selectedShapeId === shapeId) {
            state.selectedShapeId = null;
          }
        }
      });
    },

    updateShape: (shapeId, updates) => {
      set((state) => {
        const shape = state.block.shapes.find((s) => s.id === shapeId);
        if (shape) {
          Object.assign(shape, updates);
          state.block.updatedAt = getCurrentTimestamp();
        }
      });
    },

    // Selection
    selectShape: (shapeId) => {
      set((state) => {
        state.selectedShapeId = shapeId;
        // Exit paint mode when selecting a shape
        if (shapeId !== null && state.mode === 'paint_mode') {
          state.mode = 'idle';
          state.activeFabricRole = null;
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedShapeId = null;
      });
    },

    // Paint mode
    setActiveFabricRole: (roleId) => {
      set((state) => {
        state.activeFabricRole = roleId;
        state.mode = roleId !== null ? 'paint_mode' : 'idle';
        // Clear selection when entering paint mode
        if (roleId !== null) {
          state.selectedShapeId = null;
        }
      });
    },

    assignFabricRole: (shapeId, roleId, partId) => {
      set((state) => {
        const shape = state.block.shapes.find((s) => s.id === shapeId);
        if (shape) {
          if (shape.type === 'flying_geese') {
            // Flying Geese uses partFabricRoles map
            const fgShape = shape as FlyingGeeseShape;
            const validPartIds: FlyingGeesePartId[] = ['goose', 'sky1', 'sky2'];
            if (partId && validPartIds.includes(partId as FlyingGeesePartId)) {
              fgShape.partFabricRoles[partId as FlyingGeesePartId] = roleId;
            } else {
              // Default to goose if no partId specified
              fgShape.partFabricRoles.goose = roleId;
            }
          } else if (shape.type === 'hst') {
            // HST uses primary/secondary partIds
            const hstShape = shape as HstShape;
            if (partId === 'secondary') {
              hstShape.secondaryFabricRole = roleId;
            } else {
              hstShape.fabricRole = roleId;
            }
          } else {
            // Square and other single-part shapes
            shape.fabricRole = roleId;
          }
          state.block.updatedAt = getCurrentTimestamp();
        }
      });
    },

    // Palette
    setRoleColor: (roleId, color) => {
      set((state) => {
        const role = state.block.previewPalette.roles.find((r) => r.id === roleId);
        if (role) {
          role.color = color;
          state.block.updatedAt = getCurrentTimestamp();
        }
      });
    },

    // Mode management
    setMode: (mode) => {
      set((state) => {
        state.mode = mode;
        if (mode !== 'paint_mode') {
          state.activeFabricRole = null;
        }
        if (mode !== 'placing_flying_geese_second') {
          state.flyingGeesePlacement = null;
        }
      });
    },

    // Flying Geese placement
    startFlyingGeesePlacement: (position) => {
      const validCells = get().getValidAdjacentCells(position);
      set((state) => {
        state.flyingGeesePlacement = {
          firstCellPosition: position,
          validAdjacentCells: validCells,
        };
        state.mode = 'placing_flying_geese_second';
      });
    },

    completeFlyingGeesePlacement: (secondPosition) => {
      const { flyingGeesePlacement } = get();
      if (!flyingGeesePlacement) return null;

      const { firstCellPosition, validAdjacentCells } = flyingGeesePlacement;
      const isValid = validAdjacentCells.some(
        (cell) => cell.row === secondPosition.row && cell.col === secondPosition.col
      );

      if (!isValid) {
        get().cancelFlyingGeesePlacement();
        return null;
      }

      // Determine direction based on relative position
      let direction: FlyingGeeseDirection;
      const rowDiff = secondPosition.row - firstCellPosition.row;
      const colDiff = secondPosition.col - firstCellPosition.col;

      if (colDiff === 1) direction = 'right';
      else if (colDiff === -1) direction = 'left';
      else if (rowDiff === 1) direction = 'down';
      else direction = 'up';

      // Use the top-left cell as position
      const position: GridPosition = {
        row: Math.min(firstCellPosition.row, secondPosition.row),
        col: Math.min(firstCellPosition.col, secondPosition.col),
      };

      const id = get().addFlyingGeese(position, direction);

      set((state) => {
        state.flyingGeesePlacement = null;
        state.mode = 'idle';
      });

      return id;
    },

    cancelFlyingGeesePlacement: () => {
      set((state) => {
        state.flyingGeesePlacement = null;
        state.mode = 'idle';
      });
    },

    // Shape transformations
    rotateShape: (shapeId) => {
      set((state) => {
        const shape = state.block.shapes.find((s) => s.id === shapeId);
        if (!shape) return;

        if (shape.type === 'hst') {
          // HST rotation: nw → ne → se → sw → nw
          const hstShape = shape as HstShape;
          const rotationMap: Record<HstVariant, HstVariant> = {
            nw: 'ne',
            ne: 'se',
            se: 'sw',
            sw: 'nw',
          };
          hstShape.variant = rotationMap[hstShape.variant];
        } else if (shape.type === 'flying_geese') {
          // Flying Geese rotation: up → right → down → left → up
          // Also need to swap span dimensions
          const fgShape = shape as FlyingGeeseShape;
          const rotationMap: Record<FlyingGeeseDirection, FlyingGeeseDirection> = {
            up: 'right',
            right: 'down',
            down: 'left',
            left: 'up',
          };
          fgShape.direction = rotationMap[fgShape.direction];
          // Swap span dimensions
          const newSpan = { rows: fgShape.span.cols, cols: fgShape.span.rows };
          fgShape.span = newSpan as typeof fgShape.span;
        }
        // Squares don't rotate (they're symmetric)

        state.block.updatedAt = getCurrentTimestamp();
      });
    },

    flipShapeHorizontal: (shapeId) => {
      set((state) => {
        const shape = state.block.shapes.find((s) => s.id === shapeId);
        if (!shape) return;

        if (shape.type === 'hst') {
          // HST horizontal flip: nw ↔ ne, sw ↔ se
          const hstShape = shape as HstShape;
          const flipMap: Record<HstVariant, HstVariant> = {
            nw: 'ne',
            ne: 'nw',
            sw: 'se',
            se: 'sw',
          };
          hstShape.variant = flipMap[hstShape.variant];
        } else if (shape.type === 'flying_geese') {
          // Flying Geese horizontal flip
          const fgShape = shape as FlyingGeeseShape;
          if (fgShape.direction === 'left' || fgShape.direction === 'right') {
            // Flip direction left ↔ right
            fgShape.direction = fgShape.direction === 'left' ? 'right' : 'left';
          } else {
            // For up/down, swap sky1 and sky2
            const temp = fgShape.partFabricRoles.sky1;
            fgShape.partFabricRoles.sky1 = fgShape.partFabricRoles.sky2;
            fgShape.partFabricRoles.sky2 = temp;
          }
        }
        // Squares don't flip (they're symmetric)

        state.block.updatedAt = getCurrentTimestamp();
      });
    },

    flipShapeVertical: (shapeId) => {
      set((state) => {
        const shape = state.block.shapes.find((s) => s.id === shapeId);
        if (!shape) return;

        if (shape.type === 'hst') {
          // HST vertical flip: nw ↔ sw, ne ↔ se
          const hstShape = shape as HstShape;
          const flipMap: Record<HstVariant, HstVariant> = {
            nw: 'sw',
            sw: 'nw',
            ne: 'se',
            se: 'ne',
          };
          hstShape.variant = flipMap[hstShape.variant];
        } else if (shape.type === 'flying_geese') {
          // Flying Geese vertical flip
          const fgShape = shape as FlyingGeeseShape;
          if (fgShape.direction === 'up' || fgShape.direction === 'down') {
            // Flip direction up ↔ down
            fgShape.direction = fgShape.direction === 'up' ? 'down' : 'up';
          } else {
            // For left/right, swap sky1 and sky2
            const temp = fgShape.partFabricRoles.sky1;
            fgShape.partFabricRoles.sky1 = fgShape.partFabricRoles.sky2;
            fgShape.partFabricRoles.sky2 = temp;
          }
        }
        // Squares don't flip (they're symmetric)

        state.block.updatedAt = getCurrentTimestamp();
      });
    },

    // Utility
    getShapeAt: (position) => {
      const { shapes } = get().block;
      return shapes.find((shape) => {
        const { row: shapeRow, col: shapeCol } = shape.position;
        const { rows: spanRows, cols: spanCols } = shape.span;

        return (
          position.row >= shapeRow &&
          position.row < shapeRow + spanRows &&
          position.col >= shapeCol &&
          position.col < shapeCol + spanCols
        );
      });
    },

    isCellOccupied: (position) => {
      return get().getShapeAt(position) !== undefined;
    },

    getValidAdjacentCells: (position) => {
      const { gridSize } = get().block;
      const { row, col } = position;
      const adjacent: GridPosition[] = [];

      // Check all 4 directions
      const candidates: GridPosition[] = [
        { row: row - 1, col }, // up
        { row: row + 1, col }, // down
        { row, col: col - 1 }, // left
        { row, col: col + 1 }, // right
      ];

      for (const candidate of candidates) {
        // Check bounds
        if (
          candidate.row >= 0 &&
          candidate.row < gridSize &&
          candidate.col >= 0 &&
          candidate.col < gridSize
        ) {
          // Check if not occupied
          if (!get().isCellOccupied(candidate)) {
            adjacent.push(candidate);
          }
        }
      }

      return adjacent;
    },
  }))
);

// =============================================================================
// Selector Hooks (for convenience)
// =============================================================================

/** Get the current block */
export const useBlock = () => useBlockDesignerStore((state) => state.block);

/** Get the currently selected shape */
export const useSelectedShape = () => {
  return useBlockDesignerStore((state) => {
    if (!state.selectedShapeId) return null;
    return state.block.shapes.find((s) => s.id === state.selectedShapeId) ?? null;
  });
};

/** Get the current palette */
export const usePalette = () => useBlockDesignerStore((state) => state.block.previewPalette);

/** Get color for a fabric role */
export const useRoleColor = (roleId: FabricRoleId) => {
  return useBlockDesignerStore((state) => {
    const role = state.block.previewPalette.roles.find((r) => r.id === roleId);
    return role?.color ?? '#CCCCCC';
  });
};

/** Get the current designer mode */
export const useDesignerMode = () => useBlockDesignerStore((state) => state.mode);

/** Check if in paint mode */
export const useIsPaintMode = () => useBlockDesignerStore((state) => state.mode === 'paint_mode');

/** Get Flying Geese placement state */
export const useFlyingGeesePlacement = () =>
  useBlockDesignerStore((state) => state.flyingGeesePlacement);
