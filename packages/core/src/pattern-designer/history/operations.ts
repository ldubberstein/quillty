/**
 * Pattern Designer Undo/Redo Operation Types
 *
 * Defines the operation types used for undo/redo functionality in Pattern Designer.
 * Operations store the data needed to apply and invert each change.
 */

import type {
  BlockInstance,
  Border,
  BorderConfig,
  QuiltGridSize,
  FabricRoleId,
  Palette,
  UUID,
} from '../types';

// =============================================================================
// Block Instance Operations
// =============================================================================

/**
 * Operation to add a block instance
 */
export interface AddBlockInstanceOperation {
  type: 'add_block_instance';
  instance: BlockInstance;
}

/**
 * Operation to remove a block instance (stores full instance for redo)
 */
export interface RemoveBlockInstanceOperation {
  type: 'remove_block_instance';
  instance: BlockInstance;
}

/**
 * Operation to update a block instance's properties
 */
export interface UpdateBlockInstanceOperation {
  type: 'update_block_instance';
  instanceId: UUID;
  prev: Partial<BlockInstance>;
  next: Partial<BlockInstance>;
}

// =============================================================================
// Palette Operations
// =============================================================================

/**
 * Operation to change a palette role's color
 */
export interface UpdatePaletteOperation {
  type: 'update_palette';
  roleId: FabricRoleId;
  prevColor: string;
  nextColor: string;
}

// =============================================================================
// Grid Operations
// =============================================================================

/**
 * Operation to resize the grid
 * Stores removed instances for undo (when shrinking)
 */
export interface ResizeGridOperation {
  type: 'resize_grid';
  prevSize: QuiltGridSize;
  nextSize: QuiltGridSize;
  /** Instances removed when shrinking (for restore on undo) */
  removedInstances: BlockInstance[];
  /** Shift applied to instances (for add-at-start operations) */
  instanceShift?: { rowDelta: number; colDelta: number };
}

// =============================================================================
// Border Operations
// =============================================================================

/**
 * Operation to add a border
 */
export interface AddBorderOperation {
  type: 'add_border';
  border: Border;
  /** Whether this was the first border (created borderConfig) */
  createdConfig: boolean;
}

/**
 * Operation to remove a border
 */
export interface RemoveBorderOperation {
  type: 'remove_border';
  border: Border;
  /** Index where the border was located */
  index: number;
}

/**
 * Operation to update a border's properties
 */
export interface UpdateBorderOperation {
  type: 'update_border';
  borderId: UUID;
  prev: Partial<Border>;
  next: Partial<Border>;
}

/**
 * Operation to enable/disable borders
 */
export interface SetBordersEnabledOperation {
  type: 'set_borders_enabled';
  prevEnabled: boolean;
  nextEnabled: boolean;
}

/**
 * Operation to reorder borders
 */
export interface ReorderBordersOperation {
  type: 'reorder_borders';
  fromIndex: number;
  toIndex: number;
}

// =============================================================================
// Batch Operation
// =============================================================================

/**
 * Batch operation to group related changes as a single undo step
 */
export interface PatternBatchOperation {
  type: 'batch';
  operations: PatternOperation[];
}

// =============================================================================
// Union Type
// =============================================================================

/**
 * Union type of all Pattern Designer operations
 */
export type PatternOperation =
  | AddBlockInstanceOperation
  | RemoveBlockInstanceOperation
  | UpdateBlockInstanceOperation
  | UpdatePaletteOperation
  | ResizeGridOperation
  | AddBorderOperation
  | RemoveBorderOperation
  | UpdateBorderOperation
  | SetBordersEnabledOperation
  | ReorderBordersOperation
  | PatternBatchOperation;

// =============================================================================
// Inversion Function
// =============================================================================

/**
 * Invert an operation to create its undo counterpart
 */
export function invertPatternOperation(op: PatternOperation): PatternOperation {
  switch (op.type) {
    case 'add_block_instance':
      return { type: 'remove_block_instance', instance: op.instance };

    case 'remove_block_instance':
      return { type: 'add_block_instance', instance: op.instance };

    case 'update_block_instance':
      return {
        type: 'update_block_instance',
        instanceId: op.instanceId,
        prev: op.next,
        next: op.prev,
      };

    case 'update_palette':
      return {
        type: 'update_palette',
        roleId: op.roleId,
        prevColor: op.nextColor,
        nextColor: op.prevColor,
      };

    case 'resize_grid':
      return {
        type: 'resize_grid',
        prevSize: op.nextSize,
        nextSize: op.prevSize,
        removedInstances: op.removedInstances,
        // Invert the shift direction
        instanceShift: op.instanceShift
          ? { rowDelta: -op.instanceShift.rowDelta, colDelta: -op.instanceShift.colDelta }
          : undefined,
      };

    case 'add_border':
      return {
        type: 'remove_border',
        border: op.border,
        index: -1, // Will be appended, so index doesn't matter for undo
      };

    case 'remove_border':
      return {
        type: 'add_border',
        border: op.border,
        createdConfig: false, // Re-adding doesn't recreate config
      };

    case 'update_border':
      return {
        type: 'update_border',
        borderId: op.borderId,
        prev: op.next,
        next: op.prev,
      };

    case 'set_borders_enabled':
      return {
        type: 'set_borders_enabled',
        prevEnabled: op.nextEnabled,
        nextEnabled: op.prevEnabled,
      };

    case 'reorder_borders':
      return {
        type: 'reorder_borders',
        fromIndex: op.toIndex,
        toIndex: op.fromIndex,
      };

    case 'batch':
      return {
        type: 'batch',
        operations: op.operations.map(invertPatternOperation).reverse(),
      };
  }
}

// =============================================================================
// Apply Functions
// =============================================================================

/**
 * Apply an operation to block instances array
 */
export function applyOperationToBlockInstances(
  instances: BlockInstance[],
  op: PatternOperation
): BlockInstance[] {
  switch (op.type) {
    case 'add_block_instance':
      return [...instances, op.instance];

    case 'remove_block_instance':
      return instances.filter((i) => i.id !== op.instance.id);

    case 'update_block_instance': {
      return instances.map((i) => {
        if (i.id === op.instanceId) {
          return { ...i, ...op.next };
        }
        return i;
      });
    }

    case 'resize_grid': {
      let result = instances;
      // If shrinking, remove instances that would be out of bounds
      if (op.nextSize.rows < op.prevSize.rows || op.nextSize.cols < op.prevSize.cols) {
        result = result.filter(
          (i) => i.position.row < op.nextSize.rows && i.position.col < op.nextSize.cols
        );
      }
      // If expanding and there's a shift, apply it
      if (op.instanceShift && (op.instanceShift.rowDelta !== 0 || op.instanceShift.colDelta !== 0)) {
        result = result.map((i) => ({
          ...i,
          position: {
            row: i.position.row + op.instanceShift!.rowDelta,
            col: i.position.col + op.instanceShift!.colDelta,
          },
        }));
      }
      // If undoing a shrink, restore removed instances
      if (op.nextSize.rows > op.prevSize.rows || op.nextSize.cols > op.prevSize.cols) {
        // When expanding back (undo of shrink), add back removed instances
        if (op.removedInstances.length > 0) {
          result = [...result, ...op.removedInstances];
        }
      }
      return result;
    }

    case 'batch':
      return op.operations.reduce(applyOperationToBlockInstances, instances);

    default:
      return instances;
  }
}

/**
 * Apply palette-related operations to a palette
 */
export function applyOperationToPalette(
  palette: Palette,
  op: PatternOperation
): Palette {
  switch (op.type) {
    case 'update_palette':
      return {
        ...palette,
        roles: palette.roles.map((role) => {
          if (role.id === op.roleId) {
            return { ...role, color: op.nextColor };
          }
          return role;
        }),
      };

    case 'batch':
      return op.operations.reduce(applyOperationToPalette, palette);

    default:
      return palette;
  }
}

/**
 * Apply an operation to grid size
 */
export function applyOperationToGridSize(
  size: QuiltGridSize,
  op: PatternOperation
): QuiltGridSize {
  switch (op.type) {
    case 'resize_grid':
      return { ...op.nextSize };

    case 'batch':
      return op.operations.reduce(applyOperationToGridSize, size);

    default:
      return size;
  }
}

/**
 * Apply border-related operations to border config
 */
export function applyOperationToBorderConfig(
  config: BorderConfig | null,
  op: PatternOperation
): BorderConfig | null {
  switch (op.type) {
    case 'add_border': {
      if (!config) {
        // Create new config with the border
        return {
          enabled: true,
          borders: [op.border],
        };
      }
      return {
        ...config,
        enabled: true,
        borders: [...config.borders, op.border],
      };
    }

    case 'remove_border': {
      if (!config) return null;
      const newBorders = config.borders.filter((b) => b.id !== op.border.id);
      return {
        ...config,
        borders: newBorders,
      };
    }

    case 'update_border': {
      if (!config) return null;
      return {
        ...config,
        borders: config.borders.map((b) => {
          if (b.id === op.borderId) {
            return { ...b, ...op.next };
          }
          return b;
        }),
      };
    }

    case 'set_borders_enabled': {
      if (!config) {
        // If enabling with no config, create one
        if (op.nextEnabled) {
          return { enabled: true, borders: [] };
        }
        return null;
      }
      return {
        ...config,
        enabled: op.nextEnabled,
      };
    }

    case 'reorder_borders': {
      if (!config) return null;
      const borders = [...config.borders];
      if (op.fromIndex < 0 || op.fromIndex >= borders.length) return config;
      if (op.toIndex < 0 || op.toIndex >= borders.length) return config;
      const [removed] = borders.splice(op.fromIndex, 1);
      borders.splice(op.toIndex, 0, removed);
      return {
        ...config,
        borders,
      };
    }

    case 'batch':
      return op.operations.reduce(applyOperationToBorderConfig, config);

    default:
      return config;
  }
}
