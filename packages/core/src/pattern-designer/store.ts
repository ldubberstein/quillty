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
} from './types';
import {
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_GRID_ROWS,
  DEFAULT_GRID_COLS,
  DEFAULT_BLOCK_SIZE_INCHES,
} from './types';
import { DEFAULT_PALETTE } from '../block-designer/constants';
import type { Block } from '../block-designer/types';

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
    blockCache: {},
    mode: 'idle',
    isDirty: false,
    isPreviewingFillEmpty: false,
    previewingGridResize: null,
    gridResizePosition: 'end',

    // Pattern management
    initPattern: (gridSize, creatorId = '') => {
      set((state) => {
        state.pattern = createEmptyPattern(gridSize, creatorId);
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.mode = 'idle';
        state.isDirty = false;
        // Keep block cache - might reuse blocks
      });
    },

    loadPattern: (pattern) => {
      set((state) => {
        state.pattern = pattern;
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.mode = 'idle';
        state.isDirty = false;
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

      // Check if position is already occupied
      if (get().isPositionOccupied(position)) {
        // Replace existing block at this position
        const existing = get().getBlockInstanceAt(position);
        if (existing) {
          get().removeBlockInstance(existing.id);
        }
      }

      set((state) => {
        state.pattern.blockInstances.push({
          id,
          blockId,
          position,
          rotation,
          flipHorizontal: false,
          flipVertical: false,
        });
        state.pattern.updatedAt = getCurrentTimestamp();
        state.isDirty = true;
      });

      return id;
    },

    removeBlockInstance: (instanceId) => {
      set((state) => {
        const index = state.pattern.blockInstances.findIndex((b) => b.id === instanceId);
        if (index !== -1) {
          state.pattern.blockInstances.splice(index, 1);
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
          if (state.selectedBlockInstanceId === instanceId) {
            state.selectedBlockInstanceId = null;
          }
        }
      });
    },

    updateBlockInstance: (instanceId, updates) => {
      set((state) => {
        const instance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (instance) {
          if (updates.rotation !== undefined) instance.rotation = updates.rotation;
          if (updates.flipHorizontal !== undefined) instance.flipHorizontal = updates.flipHorizontal;
          if (updates.flipVertical !== undefined) instance.flipVertical = updates.flipVertical;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
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
      });
    },

    clearSelections: () => {
      set((state) => {
        state.selectedBlockInstanceId = null;
        state.selectedLibraryBlockId = null;
        state.mode = 'idle';
      });
    },

    // Block transformations
    rotateBlockInstance: (instanceId) => {
      const instance = get().pattern.blockInstances.find((b) => b.id === instanceId);
      if (!instance) return;

      const rotations: Rotation[] = [0, 90, 180, 270];
      const currentIndex = rotations.indexOf(instance.rotation);
      const nextRotation = rotations[(currentIndex + 1) % 4];

      set((state) => {
        const stateInstance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (stateInstance) {
          stateInstance.rotation = nextRotation;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });
    },

    flipBlockInstanceHorizontal: (instanceId) => {
      set((state) => {
        const instance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (instance) {
          instance.flipHorizontal = !instance.flipHorizontal;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });
    },

    flipBlockInstanceVertical: (instanceId) => {
      set((state) => {
        const instance = state.pattern.blockInstances.find((b) => b.id === instanceId);
        if (instance) {
          instance.flipVertical = !instance.flipVertical;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });
    },

    // Palette
    setRoleColor: (roleId, color) => {
      set((state) => {
        const role = state.pattern.palette.roles.find((r) => r.id === roleId);
        if (role) {
          role.color = color;
          state.pattern.updatedAt = getCurrentTimestamp();
          state.isDirty = true;
        }
      });
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
