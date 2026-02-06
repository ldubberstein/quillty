/**
 * Block Designer Zustand Store
 *
 * State management for the Block Designer using Zustand with Immer middleware.
 * Provides reactive state for units, selection, palette, and designer mode.
 */

import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Block,
  Unit,
  SquareUnit,
  HstUnit,
  FlyingGeeseUnit,
  QstUnit,
  GridSize,
  GridPosition,
  FabricRoleId,
  HstVariant,
  FlyingGeeseDirection,
  DesignerMode,
  FlyingGeesePlacementState,
  PreviewRotationPreset,
  UnitSelectionType,
  UUID,
} from './types';
import { DEFAULT_PALETTE, DEFAULT_GRID_SIZE, MAX_PALETTE_ROLES, ADDITIONAL_ROLE_COLORS } from './constants';
import type { Operation, BatchOperation, ResizeGridOperation, AddRoleOperation, RemoveRoleOperation, RenameRoleOperation, UnitRoleState } from './history/operations';
import {
  applyOperationToUnits,
  applyOperationToPalette,
  applyOperationToGridSize,
  getUnitsOutOfBounds,
  extractRolesFromUnit,
} from './history/operations';
import {
  applyRotation,
  applyFlipHorizontal,
  applyFlipVertical,
  assignPatchRole as bridgeAssignPatchRole,
  replaceRole as bridgeReplaceRole,
  unitUsesRole,
} from './unit-bridge';
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
    units: [],
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

  /** ID of the currently selected unit (null if none) */
  selectedUnitId: UUID | null;

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

  /** Unit type selected from library for placement (null if none) */
  selectedUnitType: UnitSelectionType | null;

  /** Cell being hovered during placement mode (for ghost preview) */
  hoveredCell: GridPosition | null;

  /** Anchor position for shift-click range fill (null if no anchor set) */
  rangeFillAnchor: GridPosition | null;
}

interface BlockDesignerActions {
  // Block management
  /** Initialize a new empty block */
  initBlock: (gridSize?: GridSize, creatorId?: UUID) => void;
  /** Load an existing block */
  loadBlock: (block: Block) => void;
  /** Update block metadata (title, description, hashtags) */
  updateBlockMetadata: (updates: Partial<Pick<Block, 'title' | 'description' | 'hashtags'>>) => void;
  /** Set the grid size (returns units that would be removed, or null if none) */
  setGridSize: (size: GridSize) => Unit[] | null;
  /** Get units that would be out of bounds for a new grid size */
  getUnitsOutOfBounds: (size: GridSize) => Unit[];

  // Unit management
  /** Add a square unit at position */
  addSquare: (position: GridPosition, fabricRole?: FabricRoleId) => UUID;
  /** Add an HST unit at position */
  addHst: (
    position: GridPosition,
    variant: HstVariant,
    fabricRole?: FabricRoleId,
    secondaryFabricRole?: FabricRoleId
  ) => UUID;
  /** Add a Flying Geese unit spanning two cells */
  addFlyingGeese: (
    position: GridPosition,
    direction: FlyingGeeseDirection,
    patchFabricRoles?: Partial<FlyingGeeseUnit['patchFabricRoles']>
  ) => UUID;
  /** Add a QST (Quarter-Square Triangle) unit at position */
  addQst: (
    position: GridPosition,
    patchFabricRoles?: Partial<QstUnit['patchFabricRoles']>
  ) => UUID;
  /** Remove a unit by ID */
  removeUnit: (unitId: UUID) => void;
  /** Add multiple units in a batch (single undo operation) - Flying Geese not supported */
  addUnitsBatch: (positions: GridPosition[], unitType: UnitSelectionType) => UUID[];
  /** Update a unit's properties */
  updateUnit: (unitId: UUID, updates: Partial<Unit>) => void;

  // Selection
  /** Select a unit by ID */
  selectUnit: (unitId: UUID | null) => void;
  /** Clear current selection */
  clearSelection: () => void;

  // Paint mode
  /** Set the active fabric role for paint mode */
  setActiveFabricRole: (roleId: FabricRoleId | null) => void;
  /** Assign a fabric role to a unit (patchId for multi-patch units like HST or Flying Geese) */
  assignFabricRole: (unitId: UUID, roleId: FabricRoleId, patchId?: string) => void;

  // Palette
  /** Change a palette role's color (records undo) */
  setRoleColor: (roleId: FabricRoleId, color: string) => void;
  /** Add a new fabric role to the palette */
  addRole: (name?: string, color?: string) => string;
  /** Remove a fabric role from the palette (reassigns units to fallback role) */
  removeRole: (roleId: FabricRoleId, fallbackRoleId?: FabricRoleId) => void;
  /** Rename a fabric role */
  renameRole: (roleId: FabricRoleId, newName: string) => void;
  /** Check if a role can be removed (not the last one) */
  canRemoveRole: () => boolean;
  /** Get units that use a specific role */
  getUnitsUsingRole: (roleId: FabricRoleId) => Unit[];

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

  // Unit transformations
  /** Rotate a unit 90° clockwise */
  rotateUnit: (unitId: UUID) => void;
  /** Flip a unit horizontally */
  flipUnitHorizontal: (unitId: UUID) => void;
  /** Flip a unit vertically */
  flipUnitVertical: (unitId: UUID) => void;

  // Utility
  /** Get unit at a grid position */
  getUnitAt: (position: GridPosition) => Unit | undefined;
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

  // Unit library selection
  /** Select a unit from library for placement */
  selectUnitForPlacement: (unitType: UnitSelectionType | null) => void;
  /** Set hovered cell (for ghost preview) */
  setHoveredCell: (position: GridPosition | null) => void;
  /** Clear unit selection and exit placing mode */
  clearUnitSelection: () => void;

  // Range fill (shift-click)
  /** Set the anchor position for range fill */
  setRangeFillAnchor: (position: GridPosition | null) => void;
  /** Get empty positions in range from anchor to given position */
  getRangeFillPositions: (endPosition: GridPosition) => GridPosition[];
}

export type BlockDesignerStore = BlockDesignerState & BlockDesignerActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const useBlockDesignerStore: UseBoundStore<StoreApi<BlockDesignerStore>> = create<BlockDesignerStore>()(
  immer((set, get) => ({
    // Initial state
    block: createEmptyBlock(),
    selectedUnitId: null,
    activeFabricRole: null,
    mode: 'idle',
    flyingGeesePlacement: null,
    undoManager: createUndoManagerState(),
    previewRotationPreset: 'all_same',
    selectedUnitType: null,
    hoveredCell: null,
    rangeFillAnchor: null,

    // Block management
    initBlock: (gridSize = DEFAULT_GRID_SIZE, creatorId = '') => {
      set((state) => {
        state.block = createEmptyBlock(gridSize, creatorId);
        state.selectedUnitId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
        state.undoManager = createUndoManagerState();
        state.previewRotationPreset = 'all_same';
        state.selectedUnitType = null;
        state.hoveredCell = null;
        state.rangeFillAnchor = null;
      });
    },

    loadBlock: (block) => {
      set((state) => {
        state.block = block;
        state.selectedUnitId = null;
        state.activeFabricRole = null;
        state.mode = 'idle';
        state.flyingGeesePlacement = null;
        state.undoManager = createUndoManagerState();
        state.previewRotationPreset = 'all_same';
        state.selectedUnitType = null;
        state.hoveredCell = null;
        state.rangeFillAnchor = null;
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

    setGridSize: (size) => {
      const currentSize = get().block.gridSize;
      if (size === currentSize) return null;

      const unitsToRemove = getUnitsOutOfBounds(get().block.units, size);

      set((state) => {
        // Remove out-of-bounds units
        if (unitsToRemove.length > 0) {
          state.block.units = state.block.units.filter(
            (u) => !unitsToRemove.some((r) => r.id === u.id)
          );
          // Clear selection if selected unit was removed
          if (state.selectedUnitId && unitsToRemove.some((u) => u.id === state.selectedUnitId)) {
            state.selectedUnitId = null;
          }
        }

        // Update grid size
        state.block.gridSize = size;
        state.block.updatedAt = getCurrentTimestamp();

        // Record operation for undo
        const operation: ResizeGridOperation = {
          type: 'resize_grid',
          prevSize: currentSize,
          nextSize: size,
          removedUnits: unitsToRemove,
        };
        state.undoManager = recordOperation(state.undoManager, operation);
      });

      return unitsToRemove.length > 0 ? unitsToRemove : null;
    },

    getUnitsOutOfBounds: (size) => {
      return getUnitsOutOfBounds(get().block.units, size);
    },

    // Unit management
    addSquare: (position, fabricRole = 'background') => {
      const id = generateUUID();
      const unit: SquareUnit = {
        id,
        type: 'square',
        position,
        span: { rows: 1, cols: 1 },
        fabricRole,
      };
      set((state) => {
        state.block.units.push(unit);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_unit', unit };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    addHst: (position, variant, fabricRole = 'background', secondaryFabricRole = 'background') => {
      const id = generateUUID();
      const unit: HstUnit = {
        id,
        type: 'hst',
        position,
        span: { rows: 1, cols: 1 },
        fabricRole,
        variant,
        secondaryFabricRole,
      };
      set((state) => {
        state.block.units.push(unit);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_unit', unit };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    addFlyingGeese: (position, direction, patchFabricRoles) => {
      const id = generateUUID();
      const isHorizontal = direction === 'left' || direction === 'right';
      const unit: FlyingGeeseUnit = {
        id,
        type: 'flying_geese',
        position,
        span: isHorizontal ? { rows: 1, cols: 2 } : { rows: 2, cols: 1 },
        direction,
        patchFabricRoles: {
          goose: patchFabricRoles?.goose ?? 'background',
          sky1: patchFabricRoles?.sky1 ?? 'background',
          sky2: patchFabricRoles?.sky2 ?? 'background',
        },
      };
      set((state) => {
        state.block.units.push(unit);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_unit', unit };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    addQst: (position, patchFabricRoles) => {
      const id = generateUUID();
      const unit: QstUnit = {
        id,
        type: 'qst',
        position,
        span: { rows: 1, cols: 1 },
        patchFabricRoles: {
          top: patchFabricRoles?.top ?? 'background',
          right: patchFabricRoles?.right ?? 'background',
          bottom: patchFabricRoles?.bottom ?? 'background',
          left: patchFabricRoles?.left ?? 'background',
        },
      };
      set((state) => {
        state.block.units.push(unit);
        state.block.updatedAt = getCurrentTimestamp();
        // Record operation for undo
        const operation: Operation = { type: 'add_unit', unit };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
      return id;
    },

    removeUnit: (unitId) => {
      const unitToRemove = get().block.units.find((u) => u.id === unitId);
      if (!unitToRemove) return;

      set((state) => {
        const index = state.block.units.findIndex((u) => u.id === unitId);
        if (index !== -1) {
          state.block.units.splice(index, 1);
          state.block.updatedAt = getCurrentTimestamp();
          if (state.selectedUnitId === unitId) {
            state.selectedUnitId = null;
          }
          // Record operation for undo (store full unit for redo)
          const operation: Operation = { type: 'remove_unit', unit: unitToRemove };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    addUnitsBatch: (positions, unitType) => {
      // Flying Geese not supported for batch (requires two-tap placement)
      if (unitType.type === 'flying_geese') {
        return [];
      }

      if (positions.length === 0) {
        return [];
      }

      // Create units for each position
      const units: (SquareUnit | HstUnit | QstUnit)[] = positions.map((position) => {
        const id = generateUUID();
        if (unitType.type === 'square') {
          return {
            id,
            type: 'square' as const,
            position,
            span: { rows: 1 as const, cols: 1 as const },
            fabricRole: 'background' as const,
          };
        } else if (unitType.type === 'hst') {
          return {
            id,
            type: 'hst' as const,
            position,
            span: { rows: 1 as const, cols: 1 as const },
            fabricRole: 'background' as const,
            variant: unitType.variant,
            secondaryFabricRole: 'background' as const,
          };
        } else {
          // QST
          return {
            id,
            type: 'qst' as const,
            position,
            span: { rows: 1 as const, cols: 1 as const },
            patchFabricRoles: {
              top: 'background' as const,
              right: 'background' as const,
              bottom: 'background' as const,
              left: 'background' as const,
            },
          };
        }
      });

      set((state) => {
        // Add all units
        state.block.units.push(...units);
        state.block.updatedAt = getCurrentTimestamp();

        // Record as batch operation for single undo
        const batchOperation: BatchOperation = {
          type: 'batch',
          operations: units.map((unit) => ({ type: 'add_unit' as const, unit })),
        };
        state.undoManager = recordOperation(state.undoManager, batchOperation);
      });

      return units.map((u) => u.id);
    },

    updateUnit: (unitId, updates) => {
      set((state) => {
        const unit = state.block.units.find((u) => u.id === unitId);
        if (unit) {
          Object.assign(unit, updates);
          state.block.updatedAt = getCurrentTimestamp();
        }
      });
    },

    // Selection
    selectUnit: (unitId) => {
      set((state) => {
        state.selectedUnitId = unitId;
        // Exit paint mode when selecting a unit
        if (unitId !== null && state.mode === 'paint_mode') {
          state.mode = 'idle';
          state.activeFabricRole = null;
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedUnitId = null;
      });
    },

    // Paint mode
    setActiveFabricRole: (roleId) => {
      set((state) => {
        state.activeFabricRole = roleId;
        state.mode = roleId !== null ? 'paint_mode' : 'idle';
        // Clear selection when entering paint mode
        if (roleId !== null) {
          state.selectedUnitId = null;
        }
      });
    },

    assignFabricRole: (unitId, roleId, patchId) => {
      const unit = get().block.units.find((u) => u.id === unitId);
      if (!unit) return;

      const { prev, next } = bridgeAssignPatchRole(unit, roleId, patchId);

      set((state) => {
        const stateUnit = state.block.units.find((u) => u.id === unitId);
        if (stateUnit) {
          Object.assign(stateUnit, next);
          state.block.updatedAt = getCurrentTimestamp();
          const operation: Operation = { type: 'update_unit', unitId, prev, next };
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

    addRole: (name, color) => {
      const palette = get().block.previewPalette;

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
        state.block.previewPalette.roles.push(newRole);
        state.block.updatedAt = getCurrentTimestamp();

        // Record operation for undo
        const operation: AddRoleOperation = { type: 'add_role', role: newRole };
        state.undoManager = recordOperation(state.undoManager, operation);
      });

      return newId;
    },

    removeRole: (roleId, fallbackRoleId) => {
      const palette = get().block.previewPalette;
      const units = get().block.units;

      // Cannot remove last role
      if (palette.roles.length <= 1) return;

      // Find the role to remove
      const roleIndex = palette.roles.findIndex((r) => r.id === roleId);
      if (roleIndex === -1) return;

      const removedRole = palette.roles[roleIndex];

      // Determine fallback (first remaining role if not specified)
      const fallback =
        fallbackRoleId ?? (palette.roles[0].id === roleId ? palette.roles[1].id : palette.roles[0].id);

      // Find affected units and record their current role assignments
      const affectedUnits: Array<{ unitId: string; prevRoles: UnitRoleState }> = [];

      for (const unit of units) {
        if (unitUsesRole(unit, roleId)) {
          affectedUnits.push({
            unitId: unit.id,
            prevRoles: extractRolesFromUnit(unit),
          });
        }
      }

      set((state) => {
        // Reassign units to fallback role
        for (const unit of state.block.units) {
          const update = bridgeReplaceRole(unit, roleId, fallback);
          if (Object.keys(update).length > 0) {
            Object.assign(unit, update);
          }
        }

        // Remove role from palette
        state.block.previewPalette.roles.splice(roleIndex, 1);
        state.block.updatedAt = getCurrentTimestamp();

        // Clear active fabric role if it was the removed one
        if (state.activeFabricRole === roleId) {
          state.activeFabricRole = null;
          if (state.mode === 'paint_mode') {
            state.mode = 'idle';
          }
        }

        // Record operation for undo
        const operation: RemoveRoleOperation = {
          type: 'remove_role',
          role: removedRole,
          index: roleIndex,
          affectedUnits,
          fallbackRoleId: fallback,
        };
        state.undoManager = recordOperation(state.undoManager, operation);
      });
    },

    renameRole: (roleId, newName) => {
      const role = get().block.previewPalette.roles.find((r) => r.id === roleId);
      if (!role) return;

      const prevName = role.name;

      set((state) => {
        const stateRole = state.block.previewPalette.roles.find((r) => r.id === roleId);
        if (stateRole) {
          stateRole.name = newName;
          state.block.updatedAt = getCurrentTimestamp();

          // Record operation for undo
          const operation: RenameRoleOperation = { type: 'rename_role', roleId, prevName, nextName: newName };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    canRemoveRole: () => {
      return get().block.previewPalette.roles.length > 1;
    },

    getUnitsUsingRole: (roleId) => {
      return get().block.units.filter((unit) => unitUsesRole(unit, roleId));
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
        // Return to placing_unit mode so user can place another Flying Geese
        state.mode = 'placing_unit';
      });

      return id;
    },

    cancelFlyingGeesePlacement: () => {
      set((state) => {
        state.flyingGeesePlacement = null;
        // Return to placing_unit mode so user can try placing again
        state.mode = 'placing_unit';
      });
    },

    // Unit transformations (registry-driven via unit-bridge)
    rotateUnit: (unitId) => {
      const unit = get().block.units.find((u) => u.id === unitId);
      if (!unit) return;

      const next = applyRotation(unit);
      if (!next) return; // Unit doesn't rotate (e.g., Square)

      // Capture prev values for undo by picking the same keys from current unit
      const prev: Partial<Unit> = {};
      for (const key of Object.keys(next)) {
        (prev as Record<string, unknown>)[key] = (unit as Record<string, unknown>)[key];
      }

      set((state) => {
        const stateUnit = state.block.units.find((u) => u.id === unitId);
        if (stateUnit) {
          Object.assign(stateUnit, next);
          state.block.updatedAt = getCurrentTimestamp();
          const operation: Operation = { type: 'update_unit', unitId, prev, next };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    flipUnitHorizontal: (unitId) => {
      const unit = get().block.units.find((u) => u.id === unitId);
      if (!unit) return;

      const next = applyFlipHorizontal(unit);
      if (!next) return;

      const prev: Partial<Unit> = {};
      for (const key of Object.keys(next)) {
        (prev as Record<string, unknown>)[key] = (unit as Record<string, unknown>)[key];
      }

      set((state) => {
        const stateUnit = state.block.units.find((u) => u.id === unitId);
        if (stateUnit) {
          Object.assign(stateUnit, next);
          state.block.updatedAt = getCurrentTimestamp();
          const operation: Operation = { type: 'update_unit', unitId, prev, next };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    flipUnitVertical: (unitId) => {
      const unit = get().block.units.find((u) => u.id === unitId);
      if (!unit) return;

      const next = applyFlipVertical(unit);
      if (!next) return;

      const prev: Partial<Unit> = {};
      for (const key of Object.keys(next)) {
        (prev as Record<string, unknown>)[key] = (unit as Record<string, unknown>)[key];
      }

      set((state) => {
        const stateUnit = state.block.units.find((u) => u.id === unitId);
        if (stateUnit) {
          Object.assign(stateUnit, next);
          state.block.updatedAt = getCurrentTimestamp();
          const operation: Operation = { type: 'update_unit', unitId, prev, next };
          state.undoManager = recordOperation(state.undoManager, operation);
        }
      });
    },

    // Utility
    getUnitAt: (position) => {
      const { units } = get().block;
      return units.find((unit) => {
        const { row: unitRow, col: unitCol } = unit.position;
        const { rows: spanRows, cols: spanCols } = unit.span;

        return (
          position.row >= unitRow &&
          position.row < unitRow + spanRows &&
          position.col >= unitCol &&
          position.col < unitCol + spanCols
        );
      });
    },

    isCellOccupied: (position) => {
      return get().getUnitAt(position) !== undefined;
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
        state.block.units = applyOperationToUnits(state.block.units, operation);
        state.block.previewPalette = applyOperationToPalette(state.block.previewPalette, operation);
        // Apply grid size change if applicable
        const newGridSize = applyOperationToGridSize(state.block.gridSize, operation);
        if (newGridSize !== null) {
          state.block.gridSize = newGridSize;
        }
        state.block.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected unit was removed
        if (state.selectedUnitId && !state.block.units.find((u) => u.id === state.selectedUnitId)) {
          state.selectedUnitId = null;
        }
      });
    },

    redo: () => {
      const result = redoOp(get().undoManager);
      if (!result) return;

      const { state: newUndoState, operation } = result;

      set((state) => {
        // Apply the operation
        state.block.units = applyOperationToUnits(state.block.units, operation);
        state.block.previewPalette = applyOperationToPalette(state.block.previewPalette, operation);
        // Apply grid size change if applicable
        const newGridSize = applyOperationToGridSize(state.block.gridSize, operation);
        if (newGridSize !== null) {
          state.block.gridSize = newGridSize;
        }
        state.block.updatedAt = getCurrentTimestamp();
        state.undoManager = newUndoState;
        // Clear selection if the selected unit was removed
        if (state.selectedUnitId && !state.block.units.find((u) => u.id === state.selectedUnitId)) {
          state.selectedUnitId = null;
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
        state.selectedUnitId = null;
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

    // Unit library selection
    selectUnitForPlacement: (unitType) => {
      set((state) => {
        state.selectedUnitType = unitType;
        if (unitType !== null) {
          state.mode = 'placing_unit';
          // Clear other active states when entering placing mode
          state.selectedUnitId = null;
          state.activeFabricRole = null;
          state.flyingGeesePlacement = null;
        } else {
          state.mode = 'idle';
        }
      });
    },

    setHoveredCell: (position) => {
      set((state) => {
        state.hoveredCell = position;
      });
    },

    clearUnitSelection: () => {
      set((state) => {
        state.selectedUnitType = null;
        state.hoveredCell = null;
        if (state.mode === 'placing_unit' || state.mode === 'placing_flying_geese_second') {
          state.mode = 'idle';
        }
        state.flyingGeesePlacement = null;
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
          if (!get().isCellOccupied({ row, col })) {
            positions.push({ row, col });
          }
        }
      }
      return positions;
    },
  }))
);

// =============================================================================
// Selector Hooks (for convenience)
// =============================================================================

/** Get the current block */
export const useBlock = () => useBlockDesignerStore((state) => state.block);

/** Get the currently selected unit */
export const useSelectedUnit = () => {
  return useBlockDesignerStore((state) => {
    if (!state.selectedUnitId) return null;
    return state.block.units.find((u) => u.id === state.selectedUnitId) ?? null;
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

/** Get the selected unit type from library */
export const useSelectedUnitType = () =>
  useBlockDesignerStore((state) => state.selectedUnitType);

/** Get the hovered cell position */
export const useHoveredCell = () => useBlockDesignerStore((state) => state.hoveredCell);

/** Check if in placing unit mode */
export const useIsPlacingUnit = () =>
  useBlockDesignerStore((state) => state.mode === 'placing_unit');

/** Get the current block grid size */
export const useBlockGridSize = () => useBlockDesignerStore((state) => state.block.gridSize);

/** Get the current range fill anchor position */
export const useBlockRangeFillAnchor = () => useBlockDesignerStore((state) => state.rangeFillAnchor);
