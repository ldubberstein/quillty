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
  PreviewRotationPreset,
  UUID,
} from './types';
import { DEFAULT_PALETTE, DEFAULT_GRID_SIZE } from './constants';
import type { Operation } from './history/operations';
import {
  applyOperationToShapes,
  applyOperationToPalette,
} from './history/operations';
import type { UndoManagerState } from './history/undoManager';
import {
  createUndoManagerState,
  recordOperation,
  undo as undoOp,
  redo as redoOp,
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
} from './history/undoManager';

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
    id: '', // Empty until saved to database
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

  /** Undo/redo history manager */
  undoManager: UndoManagerState;

  /** Preview mode rotation preset */
  previewRotationPreset: PreviewRotationPreset;
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

  // Undo/Redo
  /** Undo the last operation */
  undo: () => void;
  /** Redo the last undone operation */
  redo: () => void;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;

  // Preview mode
  /** Enter preview mode */
  enterPreview: () => void;
  /** Exit preview mode (return to idle) */
  exitPreview: () => void;
  /** Set the preview rotation preset */
  setPreviewRotationPreset: (preset: PreviewRotationPreset) => void;
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
    undoManager: createUndoManagerState(),
    previewRotationPreset: 'all_same',

    // Block management
    initBlock: (gridSize = DEFAULT_GRID_SIZE, creatorId = '') => {
      set((state) => {
        state.block = createEmptyBlock(gridSize, creatorId);
        state.selectedShapeId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
        state.undoManager = createUndoManagerState();
        state.previewRotationPreset = 'all_same';
      });
    },

    loadBlock: (block) => {
      set((state) => {
        state.block = block;
        state.selectedShapeId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
        state.undoManager = createUndoManagerState();
        state.previewRotationPreset = 'all_same';
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
      const shape: SquareShape = {
        id,
        type: 'square',
        position,
        span: { rows: 1, cols: 1 },
        fabricRole,
      };
      set((state) => {
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_shape', shape };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    addHst: (position, variant, fabricRole = 'background', secondaryFabricRole = 'background') => {
      const id = generateUUID();
      const shape: HstShape = {
        id,
        type: 'hst',
        position,
        span: { rows: 1, cols: 1 },
        fabricRole,
        variant,
        secondaryFabricRole,
      };
      set((state) => {
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_shape', shape };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    addFlyingGeese: (position, direction, partFabricRoles) => {
      const id = generateUUID();
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
      set((state) => {
        state.block.shapes.push(shape);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_shape', shape };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    removeShape: (shapeId) => {
      const shapeToRemove = get().block.shapes.find((s) => s.id === shapeId);
      if (!shapeToRemove) return;

      set((state) => {
        const index = state.block.shapes.findIndex((s) => s.id === shapeId);
        if (index !== -1) {
          state.block.shapes.splice(index, 1);
          state.block.updatedAt = getCurrentTimestamp();
          if (state.selectedShapeId === shapeId) {
            state.selectedShapeId = null;
          }
          // Record operation for undo (store full shape for redo)
          const operation: Operation = { type: 'remove_shape', shape: shapeToRemove };
          state.undoManager = recordOperation(state.undoManager, operation);
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
      const shape = get().block.shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      // Capture previous state for undo
      let prev: Partial<Shape>;
      let next: Partial<Shape>;

      if (shape.type === 'flying_geese') {
        const fgShape = shape as FlyingGeeseShape;
        const validPartIds: FlyingGeesePartId[] = ['goose', 'sky1', 'sky2'];
        const targetPartId = partId && validPartIds.includes(partId as FlyingGeesePartId)
          ? (partId as FlyingGeesePartId)
          : 'goose';
        prev = { partFabricRoles: { ...fgShape.partFabricRoles } };
        next = { partFabricRoles: { ...fgShape.partFabricRoles, [targetPartId]: roleId } };
      } else if (shape.type === 'hst') {
        const hstShape = shape as HstShape;
        if (partId === 'secondary') {
          prev = { secondaryFabricRole: hstShape.secondaryFabricRole };
          next = { secondaryFabricRole: roleId };
        } else {
          prev = { fabricRole: hstShape.fabricRole };
          next = { fabricRole: roleId };
        }
      } else {
        prev = { fabricRole: shape.fabricRole };
        next = { fabricRole: roleId };
      }

      set((state) => {
        const stateShape = state.block.shapes.find((s) => s.id === shapeId);
        if (stateShape) {
          if (stateShape.type === 'flying_geese') {
            const fgShape = stateShape as FlyingGeeseShape;
            const validPartIds: FlyingGeesePartId[] = ['goose', 'sky1', 'sky2'];
            if (partId && validPartIds.includes(partId as FlyingGeesePartId)) {
              fgShape.partFabricRoles[partId as FlyingGeesePartId] = roleId;
            } else {
              fgShape.partFabricRoles.goose = roleId;
            }
          } else if (stateShape.type === 'hst') {
            const hstShape = stateShape as HstShape;
            if (partId === 'secondary') {
              hstShape.secondaryFabricRole = roleId;
            } else {
              hstShape.fabricRole = roleId;
            }
          } else {
            stateShape.fabricRole = roleId;
          }
          state.block.updatedAt = getCurrentTimestamp();
          // Record operation for undo
          const operation: Operation = { type: 'update_shape', shapeId, prev, next };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    // Palette
    setRoleColor: (roleId, color) => {
      const role = get().block.previewPalette.roles.find((r) => r.id === roleId);
      if (!role) return;

      const prevColor = role.color;

      set((state) => {
        const stateRole = state.block.previewPalette.roles.find((r) => r.id === roleId);
        if (stateRole) {
          stateRole.color = color;
          state.block.updatedAt = getCurrentTimestamp();
          // Record operation for undo
          const operation: Operation = { type: 'update_palette', roleId, prevColor, nextColor: color };
          state.undoManager = recordOperation(state.undoManager, operation);
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
      const shape = get().block.shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      if (shape.type === 'hst') {
        const hstShape = shape as HstShape;
        const rotationMap: Record<HstVariant, HstVariant> = {
          nw: 'ne',
          ne: 'se',
          se: 'sw',
          sw: 'nw',
        };
        const prevVariant = hstShape.variant;
        const nextVariant = rotationMap[hstShape.variant];

        set((state) => {
          const stateShape = state.block.shapes.find((s) => s.id === shapeId);
          if (stateShape?.type === 'hst') {
            (stateShape as HstShape).variant = nextVariant;
            state.block.updatedAt = getCurrentTimestamp();
            const operation: Operation = {
              type: 'update_shape',
              shapeId,
              prev: { variant: prevVariant },
              next: { variant: nextVariant },
            };
            state.undoManager = recordOperation(state.undoManager, operation);
          }
        });
      } else if (shape.type === 'flying_geese') {
        const fgShape = shape as FlyingGeeseShape;
        const rotationMap: Record<FlyingGeeseDirection, FlyingGeeseDirection> = {
          up: 'right',
          right: 'down',
          down: 'left',
          left: 'up',
        };
        const prevDirection = fgShape.direction;
        const prevSpan = { ...fgShape.span };
        const nextDirection = rotationMap[fgShape.direction];
        // Swap rows/cols when rotating
        const nextSpan = fgShape.span.rows === 2
          ? { rows: 1 as const, cols: 2 as const }
          : { rows: 2 as const, cols: 1 as const };

        set((state) => {
          const stateShape = state.block.shapes.find((s) => s.id === shapeId);
          if (stateShape?.type === 'flying_geese') {
            const fg = stateShape as FlyingGeeseShape;
            fg.direction = nextDirection;
            fg.span = nextSpan;
            state.block.updatedAt = getCurrentTimestamp();
            const operation: Operation = {
              type: 'update_shape',
              shapeId,
              prev: { direction: prevDirection, span: prevSpan },
              next: { direction: nextDirection, span: nextSpan },
            };
            state.undoManager = recordOperation(state.undoManager, operation);
          }
        });
      }
      // Squares don't rotate (they're symmetric)
    },

    flipShapeHorizontal: (shapeId) => {
      const shape = get().block.shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      if (shape.type === 'hst') {
        const hstShape = shape as HstShape;
        const flipMap: Record<HstVariant, HstVariant> = {
          nw: 'ne',
          ne: 'nw',
          sw: 'se',
          se: 'sw',
        };
        const prevVariant = hstShape.variant;
        const nextVariant = flipMap[hstShape.variant];

        set((state) => {
          const stateShape = state.block.shapes.find((s) => s.id === shapeId);
          if (stateShape?.type === 'hst') {
            (stateShape as HstShape).variant = nextVariant;
            state.block.updatedAt = getCurrentTimestamp();
            const operation: Operation = {
              type: 'update_shape',
              shapeId,
              prev: { variant: prevVariant },
              next: { variant: nextVariant },
            };
            state.undoManager = recordOperation(state.undoManager, operation);
          }
        });
      } else if (shape.type === 'flying_geese') {
        const fgShape = shape as FlyingGeeseShape;
        if (fgShape.direction === 'left' || fgShape.direction === 'right') {
          const prevDirection = fgShape.direction;
          const nextDirection = fgShape.direction === 'left' ? 'right' : 'left';

          set((state) => {
            const stateShape = state.block.shapes.find((s) => s.id === shapeId);
            if (stateShape?.type === 'flying_geese') {
              (stateShape as FlyingGeeseShape).direction = nextDirection;
              state.block.updatedAt = getCurrentTimestamp();
              const operation: Operation = {
                type: 'update_shape',
                shapeId,
                prev: { direction: prevDirection },
                next: { direction: nextDirection },
              };
              state.undoManager = recordOperation(state.undoManager, operation);
            }
          });
        } else {
          // For up/down, swap sky1 and sky2
          const prevRoles = { ...fgShape.partFabricRoles };
          const nextRoles = {
            ...fgShape.partFabricRoles,
            sky1: fgShape.partFabricRoles.sky2,
            sky2: fgShape.partFabricRoles.sky1,
          };

          set((state) => {
            const stateShape = state.block.shapes.find((s) => s.id === shapeId);
            if (stateShape?.type === 'flying_geese') {
              (stateShape as FlyingGeeseShape).partFabricRoles = nextRoles;
              state.block.updatedAt = getCurrentTimestamp();
              const operation: Operation = {
                type: 'update_shape',
                shapeId,
                prev: { partFabricRoles: prevRoles },
                next: { partFabricRoles: nextRoles },
              };
              state.undoManager = recordOperation(state.undoManager, operation);
            }
          });
        }
      }
      // Squares don't flip (they're symmetric)
    },

    flipShapeVertical: (shapeId) => {
      const shape = get().block.shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      if (shape.type === 'hst') {
        const hstShape = shape as HstShape;
        const flipMap: Record<HstVariant, HstVariant> = {
          nw: 'sw',
          sw: 'nw',
          ne: 'se',
          se: 'ne',
        };
        const prevVariant = hstShape.variant;
        const nextVariant = flipMap[hstShape.variant];

        set((state) => {
          const stateShape = state.block.shapes.find((s) => s.id === shapeId);
          if (stateShape?.type === 'hst') {
            (stateShape as HstShape).variant = nextVariant;
            state.block.updatedAt = getCurrentTimestamp();
            const operation: Operation = {
              type: 'update_shape',
              shapeId,
              prev: { variant: prevVariant },
              next: { variant: nextVariant },
            };
            state.undoManager = recordOperation(state.undoManager, operation);
          }
        });
      } else if (shape.type === 'flying_geese') {
        const fgShape = shape as FlyingGeeseShape;
        if (fgShape.direction === 'up' || fgShape.direction === 'down') {
          const prevDirection = fgShape.direction;
          const nextDirection = fgShape.direction === 'up' ? 'down' : 'up';

          set((state) => {
            const stateShape = state.block.shapes.find((s) => s.id === shapeId);
            if (stateShape?.type === 'flying_geese') {
              (stateShape as FlyingGeeseShape).direction = nextDirection;
              state.block.updatedAt = getCurrentTimestamp();
              const operation: Operation = {
                type: 'update_shape',
                shapeId,
                prev: { direction: prevDirection },
                next: { direction: nextDirection },
              };
              state.undoManager = recordOperation(state.undoManager, operation);
            }
          });
        } else {
          // For left/right, swap sky1 and sky2
          const prevRoles = { ...fgShape.partFabricRoles };
          const nextRoles = {
            ...fgShape.partFabricRoles,
            sky1: fgShape.partFabricRoles.sky2,
            sky2: fgShape.partFabricRoles.sky1,
          };

          set((state) => {
            const stateShape = state.block.shapes.find((s) => s.id === shapeId);
            if (stateShape?.type === 'flying_geese') {
              (stateShape as FlyingGeeseShape).partFabricRoles = nextRoles;
              state.block.updatedAt = getCurrentTimestamp();
              const operation: Operation = {
                type: 'update_shape',
                shapeId,
                prev: { partFabricRoles: prevRoles },
                next: { partFabricRoles: nextRoles },
              };
              state.undoManager = recordOperation(state.undoManager, operation);
            }
          });
        }
      }
      // Squares don't flip (they're symmetric)
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

    // Undo/Redo
    undo: () => {
      const result = undoOp(get().undoManager);
      if (!result) return;

      const { state: newUndoState, operation } = result;

      set((state) => {
        // Apply the inverse operation
        state.block.shapes = applyOperationToShapes(state.block.shapes, operation);
        state.block.previewPalette = applyOperationToPalette(state.block.previewPalette, operation);
        state.block.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected shape was removed
        if (state.selectedShapeId && !state.block.shapes.find((s) => s.id === state.selectedShapeId)) {
          state.selectedShapeId = null;
        }
      });
    },

    redo: () => {
      const result = redoOp(get().undoManager);
      if (!result) return;

      const { state: newUndoState, operation } = result;

      set((state) => {
        // Apply the operation
        state.block.shapes = applyOperationToShapes(state.block.shapes, operation);
        state.block.previewPalette = applyOperationToPalette(state.block.previewPalette, operation);
        state.block.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected shape was removed
        if (state.selectedShapeId && !state.block.shapes.find((s) => s.id === state.selectedShapeId)) {
          state.selectedShapeId = null;
        }
      });
    },

    canUndo: () => {
      return checkCanUndo(get().undoManager);
    },

    canRedo: () => {
      return checkCanRedo(get().undoManager);
    },

    // Preview mode
    enterPreview: () => {
      set((state) => {
        state.mode = 'preview';
        // Clear selection and other active states when entering preview
        state.selectedShapeId = null;
        state.activeFabricRole = null;
        state.flyingGeesePlacement = null;
      });
    },

    exitPreview: () => {
      set((state) => {
        state.mode = 'idle';
      });
    },

    setPreviewRotationPreset: (preset) => {
      set((state) => {
        state.previewRotationPreset = preset;
      });
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

/** Check if undo is available */
export const useCanUndo = () => useBlockDesignerStore((state) => checkCanUndo(state.undoManager));

/** Check if redo is available */
export const useCanRedo = () => useBlockDesignerStore((state) => checkCanRedo(state.undoManager));

/** Check if in preview mode */
export const useIsPreviewMode = () => useBlockDesignerStore((state) => state.mode === 'preview');

/** Get the current preview rotation preset */
export const usePreviewRotationPreset = () =>
  useBlockDesignerStore((state) => state.previewRotationPreset);
