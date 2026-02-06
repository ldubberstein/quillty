/**
 * Undo/Redo Operation Types
 *
 * Defines the operation types used for undo/redo functionality.
 * Operations store the data needed to apply and invert each change.
 */

import type { Unit, FabricRoleId, FabricRole, Palette, GridSize, FlyingGeeseUnit, QstUnit } from '../types';
import { unitUsesRole } from '../unit-bridge';

/**
 * Operation to add a unit
 */
export interface AddUnitOperation {
  type: 'add_unit';
  unit: Unit;
}

/**
 * Operation to remove a unit (stores full unit for redo)
 */
export interface RemoveUnitOperation {
  type: 'remove_unit';
  unit: Unit;
}

/**
 * Operation to update a unit's properties
 */
export interface UpdateUnitOperation {
  type: 'update_unit';
  unitId: string;
  prev: Partial<Unit>;
  next: Partial<Unit>;
}

/**
 * Operation to change a palette role's color
 */
export interface UpdatePaletteOperation {
  type: 'update_palette';
  roleId: FabricRoleId;
  prevColor: string;
  nextColor: string;
}

/**
 * Operation to resize the grid (stores removed units for undo when shrinking)
 */
export interface ResizeGridOperation {
  type: 'resize_grid';
  prevSize: GridSize;
  nextSize: GridSize;
  /** Units removed when shrinking the grid (for restore on undo) */
  removedUnits: Unit[];
}

/**
 * Batch operation to group related changes as a single undo step
 */
export interface BatchOperation {
  type: 'batch';
  operations: Operation[];
}

/**
 * Operation to add a fabric role to the palette
 */
export interface AddRoleOperation {
  type: 'add_role';
  role: FabricRole;
}

/**
 * Captures the previous role assignments for a unit (for undo on remove role)
 */
export interface UnitRoleState {
  fabricRole?: FabricRoleId;
  secondaryFabricRole?: FabricRoleId;
  patchFabricRoles?: {
    goose: FabricRoleId;
    sky1: FabricRoleId;
    sky2: FabricRoleId;
  };
  qstPatchFabricRoles?: {
    top: FabricRoleId;
    right: FabricRoleId;
    bottom: FabricRoleId;
    left: FabricRoleId;
  };
}

/**
 * Operation to remove a fabric role from the palette
 * Stores affected units for restoring their role assignments on undo
 */
export interface RemoveRoleOperation {
  type: 'remove_role';
  role: FabricRole;
  /** Index where the role was in the palette (for restoring position on undo) */
  index: number;
  /** Units that had their roles reassigned, with their previous role assignments */
  affectedUnits: Array<{
    unitId: string;
    prevRoles: UnitRoleState;
  }>;
  /** The role that units were reassigned to */
  fallbackRoleId: FabricRoleId;
}

/**
 * Operation to rename a fabric role
 */
export interface RenameRoleOperation {
  type: 'rename_role';
  roleId: FabricRoleId;
  prevName: string;
  nextName: string;
}

/**
 * Union type of all operations
 */
export type Operation =
  | AddUnitOperation
  | RemoveUnitOperation
  | UpdateUnitOperation
  | UpdatePaletteOperation
  | ResizeGridOperation
  | BatchOperation
  | AddRoleOperation
  | RemoveRoleOperation
  | RenameRoleOperation;

/**
 * Invert an operation to create its undo counterpart
 */
export function invertOperation(op: Operation): Operation {
  switch (op.type) {
    case 'add_unit':
      return { type: 'remove_unit', unit: op.unit };

    case 'remove_unit':
      return { type: 'add_unit', unit: op.unit };

    case 'update_unit':
      return {
        type: 'update_unit',
        unitId: op.unitId,
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
        removedUnits: op.removedUnits,
      };

    case 'batch':
      return {
        type: 'batch',
        operations: op.operations.map(invertOperation).reverse(),
      };

    case 'add_role':
      return {
        type: 'remove_role',
        role: op.role,
        index: -1, // Will be determined at apply time
        affectedUnits: [], // No units affected when undoing an add
        fallbackRoleId: '', // Not used when undoing an add
      };

    case 'remove_role': {
      // When undoing a remove, we need to both restore the role AND restore unit assignments
      const operations: Operation[] = [
        { type: 'add_role', role: op.role },
      ];

      // Add update operations to restore original role assignments to affected units
      for (const { unitId, prevRoles } of op.affectedUnits) {
        if (prevRoles.fabricRole !== undefined) {
          operations.push({
            type: 'update_unit',
            unitId,
            prev: { fabricRole: op.fallbackRoleId },
            next: { fabricRole: prevRoles.fabricRole },
          });
        }
        if (prevRoles.secondaryFabricRole !== undefined) {
          operations.push({
            type: 'update_unit',
            unitId,
            prev: { secondaryFabricRole: op.fallbackRoleId },
            next: { secondaryFabricRole: prevRoles.secondaryFabricRole },
          });
        }
        if (prevRoles.patchFabricRoles !== undefined) {
          // Restore Flying Geese patch roles
          operations.push({
            type: 'update_unit',
            unitId,
            prev: { patchFabricRoles: { goose: op.fallbackRoleId, sky1: op.fallbackRoleId, sky2: op.fallbackRoleId } },
            next: { patchFabricRoles: prevRoles.patchFabricRoles },
          });
        }
      }

      return operations.length === 1
        ? operations[0]
        : { type: 'batch', operations };
    }

    case 'rename_role':
      return {
        type: 'rename_role',
        roleId: op.roleId,
        prevName: op.nextName,
        nextName: op.prevName,
      };
  }
}

/**
 * Apply an operation to a units array
 */
export function applyOperationToUnits(units: Unit[], op: Operation): Unit[] {
  switch (op.type) {
    case 'add_unit':
      return [...units, op.unit];

    case 'remove_unit':
      return units.filter((u) => u.id !== op.unit.id);

    case 'update_unit': {
      return units.map((u) => {
        if (u.id === op.unitId) {
          return { ...u, ...op.next } as Unit;
        }
        return u;
      });
    }

    case 'update_palette':
    case 'add_role':
    case 'rename_role':
      // These palette operations don't affect units array
      return units;

    case 'remove_role': {
      // When undoing a remove (via inverted add_role), we need to restore
      // the original role assignments to affected units
      // This is handled by the store directly when applying the inverted operation
      // For the forward remove operation, units are already reassigned before recording
      return units;
    }

    case 'resize_grid':
      // When undoing a shrink (going back to larger), restore removed units
      // When redoing a shrink (going to smaller), remove out-of-bounds units
      if (op.nextSize > op.prevSize) {
        // Expanding: restore previously removed units
        return [...units, ...op.removedUnits];
      } else {
        // Shrinking: remove units that would be removed
        const removedIds = new Set(op.removedUnits.map((u) => u.id));
        return units.filter((u) => !removedIds.has(u.id));
      }

    case 'batch':
      return op.operations.reduce(applyOperationToUnits, units);
  }
}

/**
 * Apply grid size operation and return the new size
 * Returns null if operation doesn't affect grid size
 */
export function applyOperationToGridSize(currentSize: GridSize, op: Operation): GridSize | null {
  switch (op.type) {
    case 'resize_grid':
      return op.nextSize;

    case 'batch': {
      // Find the last resize_grid operation in the batch
      for (let i = op.operations.length - 1; i >= 0; i--) {
        const result = applyOperationToGridSize(currentSize, op.operations[i]);
        if (result !== null) return result;
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Find units that would be out of bounds for a given grid size
 */
export function getUnitsOutOfBounds(units: Unit[], gridSize: GridSize): Unit[] {
  return units.filter((unit) => {
    const { row, col } = unit.position;
    const { rows: spanRows, cols: spanCols } = unit.span;

    // Check if any part of the unit extends beyond the new grid bounds
    return (
      row >= gridSize ||
      col >= gridSize ||
      row + spanRows > gridSize ||
      col + spanCols > gridSize
    );
  });
}

/**
 * Apply palette-related operations to a palette
 */
export function applyOperationToPalette(palette: Palette, op: Operation): Palette {
  switch (op.type) {
    case 'update_palette': {
      return {
        ...palette,
        roles: palette.roles.map((role) => {
          if (role.id === op.roleId) {
            return { ...role, color: op.nextColor };
          }
          return role;
        }),
      };
    }

    case 'add_role': {
      return {
        ...palette,
        roles: [...palette.roles, op.role],
      };
    }

    case 'remove_role': {
      return {
        ...palette,
        roles: palette.roles.filter((role) => role.id !== op.role.id),
      };
    }

    case 'rename_role': {
      return {
        ...palette,
        roles: palette.roles.map((role) => {
          if (role.id === op.roleId) {
            return { ...role, name: op.nextName };
          }
          return role;
        }),
      };
    }

    case 'batch':
      return op.operations.reduce(applyOperationToPalette, palette);

    default:
      return palette;
  }
}

/**
 * Extract the role state from a unit for recording in undo operations
 */
export function extractRolesFromUnit(unit: Unit): UnitRoleState {
  if (unit.type === 'square') {
    return { fabricRole: unit.fabricRole };
  }
  if (unit.type === 'hst') {
    return {
      fabricRole: unit.fabricRole,
      secondaryFabricRole: unit.secondaryFabricRole,
    };
  }
  if (unit.type === 'flying_geese') {
    const fg = unit as FlyingGeeseUnit;
    return {
      patchFabricRoles: { ...fg.patchFabricRoles },
    };
  }
  if (unit.type === 'qst') {
    const qst = unit as QstUnit;
    return {
      qstPatchFabricRoles: { ...qst.patchFabricRoles },
    };
  }
  return {};
}

/**
 * Get all units that use a specific fabric role
 */
export function getUnitsUsingRole(units: Unit[], roleId: FabricRoleId): Unit[] {
  return units.filter((unit) => unitUsesRole(unit, roleId));
}
