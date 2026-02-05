/**
 * Pattern Designer Zustand Store
 *
 * State management for the Pattern Designer using Zustand with Immer middleware.
 * Provides reactive state for pattern, block instances, selection, and palette.
 */

import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Pattern,
  BlockInstance,
  Rotation,
  PatternDesignerMode,
  QuiltGridSize,
  UUID,
  GridPosition,
  FabricRoleId,
  Border,
  BorderConfig,
  BorderCornerStyle,
} from './types';
import {
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_GRID_ROWS,
  DEFAULT_GRID_COLS,
  DEFAULT_BLOCK_SIZE_INCHES,
  MAX_BORDERS,
  DEFAULT_BORDER_WIDTH_INCHES,
} from './types';
import { DEFAULT_PALETTE, MAX_PALETTE_ROLES, ADDITIONAL_ROLE_COLORS } from '../block-designer/constants';
import type { Block } from '../block-designer/types';
import type { PatternOperation, PatternBatchOperation, AddRoleOperation, RemoveRoleOperation, RenameRoleOperation } from './history/operations';
import {
  applyOperationToBlockInstances,
  applyOperationToPalette,
  applyOperationToGridSize,
  applyOperationToBorderConfig,
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

/** Calculate physical dimensions based on grid size and block size */
function calculatePhysicalSize(gridSize: QuiltGridSize, blockSizeInches: number) {
  return {
    widthInches: gridSize.cols * blockSizeInches,
    heightInches: gridSize.rows * blockSizeInches,
    blockSizeInches,
  };
}

/** Create a new empty pattern */
function createEmptyPattern(
  gridSize: QuiltGridSize = { rows: DEFAULT_GRID_ROWS, cols: DEFAULT_GRID_COLS },
  creatorId: UUID = ''
): Pattern {
  const now = getCurrentTimestamp();
  return {
    id: '', // Empty until saved to database
    creatorId,
    title: '',
    description: null,
    hashtags: [],
    difficulty: 'beginner',
    category: null,
    gridSize,
    physicalSize: calculatePhysicalSize(gridSize, DEFAULT_BLOCK_SIZE_INCHES),
    palette: { ...DEFAULT_PALETTE, roles: [...DEFAULT_PALETTE.roles] },
    blockInstances: [],
    borderConfig: null,
    status: 'draft',
    isPremium: false,
    priceCents: null,
    publishedAt: null,
    thumbnailUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Store Types
// =============================================================================

interface PatternDesignerState {
  /** The current pattern being edited */
  pattern: Pattern;

  /** ID of the currently selected block instance on canvas (null if none) */
  selectedBlockInstanceId: UUID | null;

  /** ID of the block selected in the library for placement (null if none) */
  selectedLibraryBlockId: UUID | null;

  /** ID of the currently selected border for editing (null if none) */
  selectedBorderId: UUID | null;

  /** Cache of loaded blocks (for rendering) */
  blockCache: Record<UUID, Block>;

  /** Current designer mode */
  mode: PatternDesignerMode;

  /** Whether the pattern has unsaved changes */
  isDirty: boolean;

  /** Whether we're previewing the "fill empty" action (hover state) */
  isPreviewingFillEmpty: boolean;

  /** Which grid resize action is being previewed (hover state) */
  previewingGridResize: 'add-row' | 'remove-row' | 'add-col' | 'remove-col' | null;

  /** Where to add new rows/columns: 'start' (top/left) or 'end' (bottom/right) */
  gridResizePosition: 'start' | 'end';

  /** Undo/redo history manager */
  undoManager: UndoManagerState;

  /** Rotation to apply when placing blocks (0, 90, 180, 270) */
  placementRotation: Rotation;

  /** Anchor position for shift-click range fill (null if no anchor set) */
  rangeFillAnchor: GridPosition | null;
}

interface PatternDesignerActions {
  // Pattern management
  /** Initialize a new empty pattern */
  initPattern: (gridSize?: QuiltGridSize, creatorId?: UUID) => void;
  /** Load an existing pattern */
  loadPattern: (pattern: Pattern) => void;
  /** Update pattern metadata (title, description, etc.) */
  updatePatternMetadata: (updates: Partial<Pick<Pattern, 'title' | 'description' | 'hashtags' | 'difficulty' | 'category'>>) => void;
  /** Mark pattern as saved (clears dirty flag) */
  markAsSaved: (patternId?: UUID) => void;

  // Block instance management
  /** Add a block instance at position */
  addBlockInstance: (blockId: UUID, position: GridPosition, rotation?: Rotation) => UUID;
  /** Add multiple block instances in a batch */
  addBlockInstancesBatch: (blockId: UUID, positions: GridPosition[], rotation?: Rotation) => UUID[];
  /** Remove a block instance by ID */
  removeBlockInstance: (instanceId: UUID) => void;
  /** Update a block instance (rotation, flip) */
  updateBlockInstance: (instanceId: UUID, updates: Partial<Pick<BlockInstance, 'rotation' | 'flipHorizontal' | 'flipVertical'>>) => void;
  /** Get block instance at a grid position */
  getBlockInstanceAt: (position: GridPosition) => BlockInstance | undefined;
  /** Check if a grid position is occupied */
  isPositionOccupied: (position: GridPosition) => boolean;

  // Selection
  /** Select a block instance on canvas */
  selectBlockInstance: (instanceId: UUID | null) => void;
  /** Select a block in the library for placement */
  selectLibraryBlock: (blockId: UUID | null) => void;
  /** Clear all selections */
  clearSelections: () => void;

  // Range fill (shift-click)
  /** Set the anchor position for range fill */
  setRangeFillAnchor: (position: GridPosition | null) => void;
  /** Get empty positions in range from anchor to given position */
  getRangeFillPositions: (endPosition: GridPosition) => GridPosition[];

  // Block transformations
  /** Rotate selected block instance 90° clockwise */
  rotateBlockInstance: (instanceId: UUID) => void;
  /** Flip selected block instance horizontally */
  flipBlockInstanceHorizontal: (instanceId: UUID) => void;
  /** Flip selected block instance vertically */
  flipBlockInstanceVertical: (instanceId: UUID) => void;

  // Palette
  /** Change a palette role's color */
  setRoleColor: (roleId: FabricRoleId, color: string) => void;
  /** Add a new fabric role to the palette */
  addRole: (name?: string, color?: string) => string;
  /** Remove a fabric role from the palette */
  removeRole: (roleId: FabricRoleId) => void;
  /** Rename a fabric role */
  renameRole: (roleId: FabricRoleId, newName: string) => void;
  /** Check if a role can be removed (not the last one) */
  canRemoveRole: () => boolean;

  // Grid management
  /** Add a row to the grid (uses gridResizePosition for placement) */
  addRow: () => boolean;
  /** Remove a row from the grid (uses gridResizePosition for which end) */
  removeRow: () => boolean;
  /** Add a column to the grid (uses gridResizePosition for placement) */
  addColumn: () => boolean;
  /** Remove a column from the grid (uses gridResizePosition for which end) */
  removeColumn: () => boolean;
  /** Resize grid to specific dimensions */
  resizeGrid: (newSize: QuiltGridSize) => boolean;
  /** Check if a specific row has any blocks */
  hasBlocksInRow: (rowIndex: number) => boolean;
  /** Check if a specific column has any blocks */
  hasBlocksInColumn: (colIndex: number) => boolean;
  /** Set where new rows/columns are added */
  setGridResizePosition: (position: 'start' | 'end') => void;

  // Block cache
  /** Add a block to the cache (for rendering) */
  cacheBlock: (block: Block) => void;
  /** Get a block from the cache */
  getCachedBlock: (blockId: UUID) => Block | undefined;
  /** Clear the block cache */
  clearBlockCache: () => void;

  // Fill operations
  /** Fill all empty positions with the selected library block */
  fillEmpty: () => number;

  // Mode management
  /** Set the designer mode */
  setMode: (mode: PatternDesignerMode) => void;

  // Preview state
  /** Set whether we're previewing the fill empty action */
  setPreviewingFillEmpty: (preview: boolean) => void;
  /** Set which grid resize action is being previewed */
  setPreviewingGridResize: (preview: 'add-row' | 'remove-row' | 'add-col' | 'remove-col' | null) => void;

  // Border management
  /** Enable or disable borders */
  setBordersEnabled: (enabled: boolean) => void;
  /** Add a new border (returns the new border's ID) */
  addBorder: (widthInches?: number) => UUID;
  /** Remove a border by ID */
  removeBorder: (borderId: UUID) => void;
  /** Update a border's properties */
  updateBorder: (borderId: UUID, updates: Partial<Omit<Border, 'id'>>) => void;
  /** Select a border for editing */
  selectBorder: (borderId: UUID | null) => void;
  /** Reorder borders (drag and drop) */
  reorderBorders: (fromIndex: number, toIndex: number) => void;

  // Undo/Redo
  /** Undo the last operation */
  undo: () => void;
  /** Redo the last undone operation */
  redo: () => void;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;

  // Placement rotation
  /** Rotate placement rotation clockwise by 90° (cycles 0 → 90 → 180 → 270 → 0) */
  rotatePlacementClockwise: () => void;
  /** Reset placement rotation to 0° */
  resetPlacementRotation: () => void;
}

export type PatternDesignerStore = PatternDesignerState & PatternDesignerActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const usePatternDesignerStore: UseBoundStore<StoreApi<PatternDesignerStore>> = create<PatternDesignerStore>()(
  immer((set, get) => ({
    // Initial state
    pattern: createEmptyPattern(),
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

    // Pattern management
    initPattern: (gridSize, creatorId = '') => {
      set((state) => {
        state.pattern = createEmptyPattern(gridSize, creatorId);
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.selectedBorderId = null;
        state.mode = 'idle';
        state.isDirty = false;
        state.undoManager = createUndoManagerState();
        state.rangeFillAnchor = null;
        // Keep block cache - might reuse blocks
      });
    },

    loadPattern: (pattern) => {
      set((state) => {
        // Ensure borderConfig exists (for backwards compatibility)
        state.pattern = {
          ...pattern,
          borderConfig: pattern.borderConfig ?? null,
        };
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.selectedBorderId = null;
        state.mode = 'idle';
        state.isDirty = false;
        state.undoManager = createUndoManagerState();
        state.rangeFillAnchor = null;
      });
    },

    updatePatternMetadata: (updates) => {
      set((state) => {
        if (updates.title !== undefined) state.pattern.title = updates.title;
        if (updates.description !== undefined) state.pattern.description = updates.description;
        if (updates.hashtags !== undefined) state.pattern.hashtags = updates.hashtags;
        if (updates.difficulty !== undefined) state.pattern.difficulty = updates.difficulty;
        if (updates.category !== undefined) state.pattern.category = updates.category;
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
    },

    markAsSaved: (patternId) => {
      set((state) => {
        if (patternId) {
          state.pattern.id = patternId;
        }
        state.isDirty = false;
      });
    },

    // Block instance management
    addBlockInstance: (blockId, position, rotation = 0) => {
      const id = generateUUID();
      const operations: PatternOperation[] = [];

      // Check if position is already occupied
      const existing = get().getBlockInstanceAt(position);
      if (existing) {
        // Store removal operation for undo
        operations.push({ type: 'remove_block_instance', instance: { ...existing } });
      }

      const newInstance: BlockInstance = {
        id,
        blockId,
        position,
        rotation,
        flipHorizontal: false,
        flipVertical: false,
      };
      operations.push({ type: 'add_block_instance', instance: newInstance });

      set((state) => {
        // Remove existing if present
        if (existing) {
          const index = state.pattern.blockInstances.findIndex((b) => b.id === existing.id);
          if (index !== -1) {
            state.pattern.blockInstances.splice(index, 1);
          }
        }
        state.pattern.blockInstances.push(newInstance);
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
        // Record as batch if replacing, single op otherwise
        const operation: PatternOperation = operations.length > 1
          ? { type: 'batch', operations }
          : operations[0];
        state.undoManager = recordOperation(state.undoManager, operation);
      });

      return id;
    },

    addBlockInstancesBatch: (blockId, positions, rotation = 0) => {
      if (positions.length === 0) {
        return [];
      }

      const ids: UUID[] = [];
      const operations: PatternOperation[] = [];

      // Build instances and track operations
      const newInstances: BlockInstance[] = [];
      for (const position of positions) {
        const existing = get().pattern.blockInstances.find(
          (b) => b.position.row === position.row && b.position.col === position.col
        );
        if (existing) {
          operations.push({ type: 'remove_block_instance', instance: { ...existing } });
        }

        const id = generateUUID();
        ids.push(id);

        const newInstance: BlockInstance = {
          id,
          blockId,
          position,
          rotation,
          flipHorizontal: false,
          flipVertical: false,
        };
        newInstances.push(newInstance);
        operations.push({ type: 'add_block_instance', instance: newInstance });
      }

      set((state) => {
        for (const newInstance of newInstances) {
          // Remove existing if present
          const existing = state.pattern.blockInstances.find(
            (b) => b.position.row === newInstance.position.row && b.position.col === newInstance.position.col
          );
          if (existing) {
            const index = state.pattern.blockInstances.findIndex((b) => b.id === existing.id);
            if (index !== -1) {
              state.pattern.blockInstances.splice(index, 1);
            }
          }
          state.pattern.blockInstances.push(newInstance);
        }

        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
        // Record as batch operation for single undo
        const batchOperation: PatternBatchOperation = { type: 'batch', operations };
        state.undoManager = recordOperation(state.undoManager, batchOperation);
      });

      return ids;
    },

    removeBlockInstance: (instanceId) => {
      const instanceToRemove = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instanceToRemove) return;

      set((state) => {
        const index = state.pattern.blockInstances.findIndex((b) => b.id === instanceId);
        if (index !== -1) {
          state.pattern.blockInstances.splice(index, 1);
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          if (state.selectedBlockInstanceId === instanceId) {
            state.selectedBlockInstanceId = null;
          }
          // Record operation for undo (store full instance for restore)
          const operation: PatternOperation = { type: 'remove_block_instance', instance: instanceToRemove };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    updateBlockInstance: (instanceId, updates) => {
      const instance = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instance) return;

      // Capture previous state for undo
      const prev: Partial<BlockInstance> = {};
      const next: Partial<BlockInstance> = {};
      if (updates.rotation !== undefined) {
        prev.rotation = instance.rotation;
        next.rotation = updates.rotation;
      }
      if (updates.flipHorizontal !== undefined) {
        prev.flipHorizontal = instance.flipHorizontal;
        next.flipHorizontal = updates.flipHorizontal;
      }
      if (updates.flipVertical !== undefined) {
        prev.flipVertical = instance.flipVertical;
        next.flipVertical = updates.flipVertical;
      }

      set((state) => {
        const stateInstance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (stateInstance) {
          if (updates.rotation !== undefined) stateInstance.rotation = updates.rotation;
          if (updates.flipHorizontal !== undefined) stateInstance.flipHorizontal = updates.flipHorizontal;
          if (updates.flipVertical !== undefined) stateInstance.flipVertical = updates.flipVertical;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          // Record operation for undo
          const operation: PatternOperation = { type: 'update_block_instance', instanceId, prev, next };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    getBlockInstanceAt: (position) => {
      return get().pattern.blockInstances.find(
        (b) => b.position.row === position.row && b.position.col === position.col
      );
    },

    isPositionOccupied: (position) => {
      return get().getBlockInstanceAt(position) !== undefined;
    },

    // Selection
    selectBlockInstance: (instanceId) => {
      set((state) => {
        state.selectedBlockInstanceId = instanceId;
        // Clear library selection and enter editing mode when selecting on canvas
        if (instanceId !== null) {
          state.selectedLibraryBlockId = null;
          state.mode = 'editing_block';
        } else {
          // Deselecting - go to idle mode if no library block selected
          if (!state.selectedLibraryBlockId) {
            state.mode = 'idle';
          }
        }
      });
    },

    selectLibraryBlock: (blockId) => {
      set((state) => {
        state.selectedLibraryBlockId = blockId;
        // Clear canvas selection when selecting from library
        if (blockId !== null) {
          state.selectedBlockInstanceId = null;
          state.mode = 'placing_block';
        } else {
          state.mode = 'idle';
        }
        // Reset placement rotation when selecting a different block
        state.placementRotation = 0;
      });
    },

    clearSelections: () => {
      set((state) => {
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.mode = 'idle';
        state.placementRotation = 0;
        state.rangeFillAnchor = null;
      });
    },

    // Range fill (shift-click)
    setRangeFillAnchor: (position) => {
      set((state) => {
        state.rangeFillAnchor = position;
      });
    },

    getRangeFillPositions: (endPosition) => {
      const anchor = get().rangeFillAnchor;
      if (!anchor) return [endPosition];

      // Calculate rectangular range
      const minRow = Math.min(anchor.row, endPosition.row);
      const maxRow = Math.max(anchor.row, endPosition.row);
      const minCol = Math.min(anchor.col, endPosition.col);
      const maxCol = Math.max(anchor.col, endPosition.col);

      const positions: GridPosition[] = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          // Only include empty positions
          if (!get().isPositionOccupied({ row, col })) {
            positions.push({ row, col });
          }
        }
      }
      return positions;
    },

    // Block transformations
    rotateBlockInstance: (instanceId) => {
      const instance = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instance) return;

      const rotations: Rotation[] = [0, 90, 180, 270];
      const currentIndex = rotations.indexOf(instance.rotation);
      const prevRotation = instance.rotation;
      const nextRotation = rotations[(currentIndex + 1) % 4];

      set((state) => {
        const stateInstance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (stateInstance) {
          stateInstance.rotation = nextRotation;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          // Record operation for undo
          const operation: PatternOperation = {
            type: 'update_block_instance',
            instanceId,
            prev: { rotation: prevRotation },
            next: { rotation: nextRotation },
          };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    flipBlockInstanceHorizontal: (instanceId) => {
      const instance = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instance) return;

      const prevFlip = instance.flipHorizontal;
      const nextFlip = !prevFlip;

      set((state) => {
        const stateInstance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (stateInstance) {
          stateInstance.flipHorizontal = nextFlip;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          const operation: PatternOperation = {
            type: 'update_block_instance',
            instanceId,
            prev: { flipHorizontal: prevFlip },
            next: { flipHorizontal: nextFlip },
          };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    flipBlockInstanceVertical: (instanceId) => {
      const instance = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instance) return;

      const prevFlip = instance.flipVertical;
      const nextFlip = !prevFlip;

      set((state) => {
        const stateInstance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (stateInstance) {
          stateInstance.flipVertical = nextFlip;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          const operation: PatternOperation = {
            type: 'update_block_instance',
            instanceId,
            prev: { flipVertical: prevFlip },
            next: { flipVertical: nextFlip },
          };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    // Palette
    setRoleColor: (roleId, color) => {
      const role = get().pattern.palette.roles.find((r) => r.id === roleId);
      if (!role) return;

      const prevColor = role.color;

      set((state) => {
        const stateRole = state.pattern.palette.roles.find((r) => r.id === roleId);
        if (stateRole) {
          stateRole.color = color;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          // Record operation for undo
          const operation: PatternOperation = { type: 'update_palette', roleId, prevColor, nextColor: color };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    addRole: (name, color) => {
      const palette = get().pattern.palette;

      // Enforce maximum
      if (palette.roles.length >= MAX_PALETTE_ROLES) {
        return '';
      }

      // Generate unique ID
      const existingIds = new Set(palette.roles.map((r) => r.id));
      let newId = `accent${palette.roles.length - 1}`;
      let counter = palette.roles.length;
      while (existingIds.has(newId)) {
        newId = `accent${counter++}`;
      }

      // Pick a default color from the additional colors array
      const colorIndex = (palette.roles.length - 4) % ADDITIONAL_ROLE_COLORS.length;
      const defaultColor = ADDITIONAL_ROLE_COLORS[Math.max(0, colorIndex)] ?? '#808080';

      const newRole = {
        id: newId,
        name: name ?? `Accent ${palette.roles.length - 1}`,
        color: color ?? defaultColor,
      };

      set((state) => {
        state.pattern.palette.roles.push(newRole);
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;

        // Record operation for undo
        const operation: AddRoleOperation = { type: 'add_role', role: newRole };
        state.undoManager = recordOperation(state.undoManager, operation);
      });

      return newId;
    },

    removeRole: (roleId) => {
      const palette = get().pattern.palette;

      // Cannot remove last role
      if (palette.roles.length <= 1) return;

      // Find the role to remove
      const roleIndex = palette.roles.findIndex((r) => r.id === roleId);
      if (roleIndex === -1) return;

      const removedRole = palette.roles[roleIndex];

      set((state) => {
        // Remove role from palette
        state.pattern.palette.roles.splice(roleIndex, 1);
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;

        // Record operation for undo
        const operation: RemoveRoleOperation = {
          type: 'remove_role',
          role: removedRole,
          index: roleIndex,
        };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
    },

    renameRole: (roleId, newName) => {
      const role = get().pattern.palette.roles.find((r) => r.id === roleId);
      if (!role) return;

      const prevName = role.name;

      set((state) => {
        const stateRole = state.pattern.palette.roles.find((r) => r.id === roleId);
        if (stateRole) {
          stateRole.name = newName;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;

          // Record operation for undo
          const operation: RenameRoleOperation = { type: 'rename_role', roleId, prevName, nextName: newName };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    canRemoveRole: () => {
      return get().pattern.palette.roles.length > 1;
    },

    // Grid management
    addRow: () => {
      const { rows } = get().pattern.gridSize;
      const position = get().gridResizePosition;
      if (rows >= MAX_GRID_SIZE) return false;

      set((state) => {
        state.pattern.gridSize.rows += 1;
        // If adding at start (top), shift all existing blocks down by 1
        if (position === 'start') {
          state.pattern.blockInstances.forEach((b) => {
            b.position.row += 1;
          });
        }
        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
      return true;
    },

    removeRow: () => {
      const { rows } = get().pattern.gridSize;
      const position = get().gridResizePosition;
      if (rows <= MIN_GRID_SIZE) return false;

      set((state) => {
        const newRows = state.pattern.gridSize.rows - 1;
        state.pattern.gridSize.rows = newRows;

        if (position === 'start') {
          // Remove blocks in row 0, then shift all others up by 1
          state.pattern.blockInstances = state.pattern.blockInstances
            .filter((b) => b.position.row > 0)
            .map((b) => ({
              ...b,
              position: { ...b.position, row: b.position.row - 1 },
            }));
        } else {
          // Remove blocks in the last row
          state.pattern.blockInstances = state.pattern.blockInstances.filter(
            (b) => b.position.row < newRows
          );
        }

        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
        // Clear selection if it was removed
        if (state.selectedBlockInstanceId) {
          const stillExists = state.pattern.blockInstances.some(
            (b) => b.id === state.selectedBlockInstanceId
          );
          if (!stillExists) {
            state.selectedBlockInstanceId = null;
          }
        }
      });
      return true;
    },

    addColumn: () => {
      const { cols } = get().pattern.gridSize;
      const position = get().gridResizePosition;
      if (cols >= MAX_GRID_SIZE) return false;

      set((state) => {
        state.pattern.gridSize.cols += 1;
        // If adding at start (left), shift all existing blocks right by 1
        if (position === 'start') {
          state.pattern.blockInstances.forEach((b) => {
            b.position.col += 1;
          });
        }
        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
      return true;
    },

    removeColumn: () => {
      const { cols } = get().pattern.gridSize;
      const position = get().gridResizePosition;
      if (cols <= MIN_GRID_SIZE) return false;

      set((state) => {
        const newCols = state.pattern.gridSize.cols - 1;
        state.pattern.gridSize.cols = newCols;

        if (position === 'start') {
          // Remove blocks in column 0, then shift all others left by 1
          state.pattern.blockInstances = state.pattern.blockInstances
            .filter((b) => b.position.col > 0)
            .map((b) => ({
              ...b,
              position: { ...b.position, col: b.position.col - 1 },
            }));
        } else {
          // Remove blocks in the last column
          state.pattern.blockInstances = state.pattern.blockInstances.filter(
            (b) => b.position.col < newCols
          );
        }

        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
        // Clear selection if it was removed
        if (state.selectedBlockInstanceId) {
          const stillExists = state.pattern.blockInstances.some(
            (b) => b.id === state.selectedBlockInstanceId
          );
          if (!stillExists) {
            state.selectedBlockInstanceId = null;
          }
        }
      });
      return true;
    },

    resizeGrid: (newSize) => {
      if (
        newSize.rows < MIN_GRID_SIZE ||
        newSize.rows > MAX_GRID_SIZE ||
        newSize.cols < MIN_GRID_SIZE ||
        newSize.cols > MAX_GRID_SIZE
      ) {
        return false;
      }

      set((state) => {
        state.pattern.gridSize = newSize;
        // Remove blocks that are now out of bounds
        state.pattern.blockInstances = state.pattern.blockInstances.filter(
          (b) => b.position.row < newSize.rows && b.position.col < newSize.cols
        );
        state.pattern.physicalSize = calculatePhysicalSize(
          newSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
      return true;
    },

    hasBlocksInRow: (rowIndex) => {
      return get().pattern.blockInstances.some((b) => b.position.row === rowIndex);
    },

    hasBlocksInColumn: (colIndex) => {
      return get().pattern.blockInstances.some((b) => b.position.col === colIndex);
    },

    setGridResizePosition: (position) => {
      set((state) => {
        state.gridResizePosition = position;
      });
    },

    // Block cache
    cacheBlock: (block) => {
      set((state) => {
        state.blockCache[block.id] = block;
      });
    },

    getCachedBlock: (blockId) => {
      return get().blockCache[blockId];
    },

    clearBlockCache: () => {
      set((state) => {
        state.blockCache = {};
      });
    },

    // Fill operations
    fillEmpty: () => {
      const { selectedLibraryBlockId } = get();
      if (!selectedLibraryBlockId) return 0;

      const { rows, cols } = get().pattern.gridSize;
      let count = 0;

      set((state) => {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const isOccupied = state.pattern.blockInstances.some(
              (b) => b.position.row === row && b.position.col === col
            );
            if (!isOccupied) {
              state.pattern.blockInstances.push({
                id: generateUUID(),
                blockId: selectedLibraryBlockId,
                position: { row, col },
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
              });
              count++;
            }
          }
        }
        if (count > 0) {
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });

      return count;
    },

    // Mode management
    setMode: (mode) => {
      set((state) => {
        state.mode = mode;
        if (mode === 'idle') {
          state.selectedBlockInstanceId = null;
          state.selectedLibraryBlockId = null;
        }
      });
    },

    // Preview state
    setPreviewingFillEmpty: (preview) => {
      set((state) => {
        state.isPreviewingFillEmpty = preview;
      });
    },

    setPreviewingGridResize: (preview) => {
      set((state) => {
        state.previewingGridResize = preview;
      });
    },

    // Border management
    setBordersEnabled: (enabled) => {
      set((state) => {
        if (enabled) {
          // Enable borders - create config if it doesn't exist
          if (!state.pattern.borderConfig) {
            state.pattern.borderConfig = {
              enabled: true,
              borders: [],
            };
          } else {
            state.pattern.borderConfig.enabled = true;
          }
        } else {
          // Disable borders
          if (state.pattern.borderConfig) {
            state.pattern.borderConfig.enabled = false;
          }
          state.selectedBorderId = null;
        }
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
    },

    addBorder: (widthInches = DEFAULT_BORDER_WIDTH_INCHES) => {
      const id = generateUUID();
      set((state) => {
        // Ensure borderConfig exists
        if (!state.pattern.borderConfig) {
          state.pattern.borderConfig = {
            enabled: true,
            borders: [],
          };
        }

        // Check max borders limit
        if (state.pattern.borderConfig.borders.length >= MAX_BORDERS) {
          return;
        }

        // Create new border with defaults
        const newBorder: Border = {
          id,
          widthInches,
          style: 'plain',
          fabricRole: 'accent1',
          cornerStyle: 'butted',
        };

        state.pattern.borderConfig.borders.push(newBorder);
        state.pattern.borderConfig.enabled = true;
        state.selectedBorderId = id;
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });
      return id;
    },

    removeBorder: (borderId) => {
      set((state) => {
        if (!state.pattern.borderConfig) return;

        const index = state.pattern.borderConfig.borders.findIndex((b) => b.id === borderId);
        if (index !== -1) {
          state.pattern.borderConfig.borders.splice(index, 1);
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;

          // Clear selection if removed border was selected
          if (state.selectedBorderId === borderId) {
            state.selectedBorderId = null;
          }
        }
      });
    },

    updateBorder: (borderId, updates) => {
      set((state) => {
        if (!state.pattern.borderConfig) return;

        const border = state.pattern.borderConfig.borders.find((b) => b.id === borderId);
        if (border) {
          Object.assign(border, updates);
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });
    },

    selectBorder: (borderId) => {
      set((state) => {
        state.selectedBorderId = borderId;
        // Clear block selections when selecting a border
        if (borderId !== null) {
          state.selectedBlockInstanceId = null;
          state.selectedLibraryBlockId = null;
        }
      });
    },

    reorderBorders: (fromIndex, toIndex) => {
      set((state) => {
        if (!state.pattern.borderConfig) return;

        const borders = state.pattern.borderConfig.borders;
        if (fromIndex < 0 || fromIndex >= borders.length) return;
        if (toIndex < 0 || toIndex >= borders.length) return;

        const [removed] = borders.splice(fromIndex, 1);
        borders.splice(toIndex, 0, removed);
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
        // Record operation for undo
        const operation: PatternOperation = { type: 'reorder_borders', fromIndex, toIndex };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
    },

    // Undo/Redo
    undo: () => {
      const result = undoOp(get().undoManager);
      if (!result) return;

      const { state: newUndoState, operation } = result;

      set((state) => {
        // Apply the inverse operation to all relevant state
        state.pattern.blockInstances = applyOperationToBlockInstances(
          state.pattern.blockInstances,
          operation
        );
        state.pattern.palette = applyOperationToPalette(state.pattern.palette, operation);
        state.pattern.gridSize = applyOperationToGridSize(state.pattern.gridSize, operation);
        state.pattern.borderConfig = applyOperationToBorderConfig(state.pattern.borderConfig, operation);
        // Recalculate physical size if grid changed
        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected instance was removed
        if (state.selectedBlockInstanceId && !state.pattern.blockInstances.find((b) => b.id === state.selectedBlockInstanceId)) {
          state.selectedBlockInstanceId = null;
        }
        // Clear border selection if the selected border was removed
        if (state.selectedBorderId && !state.pattern.borderConfig?.borders.find((b) => b.id === state.selectedBorderId)) {
          state.selectedBorderId = null;
        }
      });
    },

    redo: () => {
      const result = redoOp(get().undoManager);
      if (!result) return;

      const { state: newUndoState, operation } = result;

      set((state) => {
        // Apply the operation to all relevant state
        state.pattern.blockInstances = applyOperationToBlockInstances(
          state.pattern.blockInstances,
          operation
        );
        state.pattern.palette = applyOperationToPalette(state.pattern.palette, operation);
        state.pattern.gridSize = applyOperationToGridSize(state.pattern.gridSize, operation);
        state.pattern.borderConfig = applyOperationToBorderConfig(state.pattern.borderConfig, operation);
        // Recalculate physical size if grid changed
        state.pattern.physicalSize = calculatePhysicalSize(
          state.pattern.gridSize,
          state.pattern.physicalSize.blockSizeInches
        );
        state.pattern.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected instance was removed
        if (state.selectedBlockInstanceId && !state.pattern.blockInstances.find((b) => b.id === state.selectedBlockInstanceId)) {
          state.selectedBlockInstanceId = null;
        }
        // Clear border selection if the selected border was removed
        if (state.selectedBorderId && !state.pattern.borderConfig?.borders.find((b) => b.id === state.selectedBorderId)) {
          state.selectedBorderId = null;
        }
      });
    },

    canUndo: () => {
      return checkCanUndo(get().undoManager);
    },

    canRedo: () => {
      return checkCanRedo(get().undoManager);
    },

    // Placement rotation
    rotatePlacementClockwise: () => {
      set((state) => {
        const rotations: Rotation[] = [0, 90, 180, 270];
        const currentIndex = rotations.indexOf(state.placementRotation);
        state.placementRotation = rotations[(currentIndex + 1) % 4];
      });
    },

    resetPlacementRotation: () => {
      set((state) => {
        state.placementRotation = 0;
      });
    },
  }))
);

// =============================================================================
// Selector Hooks (for convenience)
// =============================================================================

/** Get the current pattern */
export const usePattern = () => usePatternDesignerStore((state) => state.pattern);

/** Get the current grid size */
export const useGridSize = () => usePatternDesignerStore((state) => state.pattern.gridSize);

/** Get the current palette */
export const usePatternPalette = () => usePatternDesignerStore((state) => state.pattern.palette);

/** Get all block instances */
export const useBlockInstances = () => usePatternDesignerStore((state) => state.pattern.blockInstances);

/** Get the selected block instance */
export const useSelectedBlockInstance = () => {
  return usePatternDesignerStore((state) => {
    if (!state.selectedBlockInstanceId) return null;
    return state.pattern.blockInstances.find((b) => b.id === state.selectedBlockInstanceId) ?? null;
  });
};

/** Get the selected library block ID */
export const useSelectedLibraryBlockId = () =>
  usePatternDesignerStore((state) => state.selectedLibraryBlockId);

/** Get the current designer mode */
export const usePatternDesignerMode = () => usePatternDesignerStore((state) => state.mode);

/** Check if pattern has unsaved changes */
export const useIsDirty = () => usePatternDesignerStore((state) => state.isDirty);

/** Check if grid is at warning threshold */
export const useIsGridLarge = () => {
  return usePatternDesignerStore((state) => {
    const { rows, cols } = state.pattern.gridSize;
    return rows > 15 || cols > 15;
  });
};

/** Get color for a fabric role */
export const usePatternRoleColor = (roleId: FabricRoleId) => {
  return usePatternDesignerStore((state) => {
    const role = state.pattern.palette.roles.find((r) => r.id === roleId);
    return role?.color ?? '#CCCCCC';
  });
};

/** Check if grid can add more rows */
export const useCanAddRow = () => {
  return usePatternDesignerStore((state) => state.pattern.gridSize.rows < MAX_GRID_SIZE);
};

/** Check if grid can remove rows */
export const useCanRemoveRow = () => {
  return usePatternDesignerStore((state) => state.pattern.gridSize.rows > MIN_GRID_SIZE);
};

/** Check if grid can add more columns */
export const useCanAddColumn = () => {
  return usePatternDesignerStore((state) => state.pattern.gridSize.cols < MAX_GRID_SIZE);
};

/** Check if grid can remove columns */
export const useCanRemoveColumn = () => {
  return usePatternDesignerStore((state) => state.pattern.gridSize.cols > MIN_GRID_SIZE);
};

/** Get the current grid resize preview state */
export const usePreviewingGridResize = () =>
  usePatternDesignerStore((state) => state.previewingGridResize);

/** Get the grid resize position setting */
export const useGridResizePosition = () =>
  usePatternDesignerStore((state) => state.gridResizePosition);

/** Get count of empty slots in the grid */
export const useEmptySlotCount = () => {
  return usePatternDesignerStore((state) => {
    const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
    const filledSlots = state.pattern.blockInstances.length;
    return totalSlots - filledSlots;
  });
};

/** Check if pattern can be published (all slots must be filled) */
export const useCanPublish = () => {
  return usePatternDesignerStore((state) => {
    const totalSlots = state.pattern.gridSize.rows * state.pattern.gridSize.cols;
    const filledSlots = state.pattern.blockInstances.length;
    // Title is validated in the PublishModal, not here
    return filledSlots === totalSlots;
  });
};

/** Get the pattern ID (empty string if not yet saved) */
export const usePatternId = () => usePatternDesignerStore((state) => state.pattern.id);

// =============================================================================
// Border Selector Hooks
// =============================================================================

/** Empty borders array constant to avoid creating new references */
const EMPTY_BORDERS: Border[] = [];

/** Get the border configuration */
export const useBorderConfig = () =>
  usePatternDesignerStore((state) => state.pattern.borderConfig);

/** Check if borders are enabled */
export const useBordersEnabled = () =>
  usePatternDesignerStore((state) => state.pattern.borderConfig?.enabled ?? false);

/** Get all borders */
export const useBorders = () =>
  usePatternDesignerStore((state) => state.pattern.borderConfig?.borders ?? EMPTY_BORDERS);

/** Get the selected border ID */
export const useSelectedBorderId = () =>
  usePatternDesignerStore((state) => state.selectedBorderId);

/** Get the selected border */
export const useSelectedBorder = () => {
  return usePatternDesignerStore((state) => {
    const id = state.selectedBorderId;
    if (!id || !state.pattern.borderConfig) return null;
    return state.pattern.borderConfig.borders.find((b) => b.id === id) ?? null;
  });
};

/** Get total border width (sum of all borders, one side only) */
export const useTotalBorderWidth = () => {
  return usePatternDesignerStore((state) => {
    const borders = state.pattern.borderConfig?.borders;
    if (!borders || borders.length === 0) return 0;
    return borders.reduce((sum, b) => sum + b.widthInches, 0);
  });
};

/** Get final quilt size width including borders */
export const useFinalQuiltWidth = () => {
  return usePatternDesignerStore((state) => {
    const { physicalSize, borderConfig } = state.pattern;
    if (!borderConfig?.enabled || borderConfig.borders.length === 0) {
      return physicalSize.widthInches;
    }
    const totalBorderWidth = borderConfig.borders.reduce((sum, b) => sum + b.widthInches, 0);
    return physicalSize.widthInches + totalBorderWidth * 2;
  });
};

/** Get final quilt size height including borders */
export const useFinalQuiltHeight = () => {
  return usePatternDesignerStore((state) => {
    const { physicalSize, borderConfig } = state.pattern;
    if (!borderConfig?.enabled || borderConfig.borders.length === 0) {
      return physicalSize.heightInches;
    }
    const totalBorderWidth = borderConfig.borders.reduce((sum, b) => sum + b.widthInches, 0);
    return physicalSize.heightInches + totalBorderWidth * 2;
  });
};

/** Get final quilt size including borders (returns object - use with caution in render) */
export const useFinalQuiltSize = () => {
  const width = useFinalQuiltWidth();
  const height = useFinalQuiltHeight();
  const blockSize = usePatternDesignerStore((state) => state.pattern.physicalSize.blockSizeInches);
  return { widthInches: width, heightInches: height, blockSizeInches: blockSize };
};

/** Check if can add more borders */
export const useCanAddBorder = () => {
  return usePatternDesignerStore((state) => {
    const borders = state.pattern.borderConfig?.borders;
    return !borders || borders.length < MAX_BORDERS;
  });
};

// =============================================================================
// Undo/Redo Selector Hooks
// =============================================================================

/** Check if undo is available */
export const useCanUndo = () => usePatternDesignerStore((state) => checkCanUndo(state.undoManager));

/** Check if redo is available */
export const useCanRedo = () => usePatternDesignerStore((state) => checkCanRedo(state.undoManager));

// =============================================================================
// Placement Rotation Selector Hooks
// =============================================================================

/** Get the current placement rotation */
export const usePlacementRotation = () => usePatternDesignerStore((state) => state.placementRotation);

// =============================================================================
// Range Fill Selector Hooks
// =============================================================================

/** Get the current range fill anchor position */
export const useRangeFillAnchor = () => usePatternDesignerStore((state) => state.rangeFillAnchor);
