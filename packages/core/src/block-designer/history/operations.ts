/**
 * Undo/Redo Operation Types
 *
 * Defines the operation types used for undo/redo functionality.
 * Operations store the data needed to apply and invert each change.
 */

import type { Shape, FabricRoleId, FabricRole, Palette, GridSize, FlyingGeeseShape, QstShape } from '../types';

/**
 * Operation to add a shape
 */
export interface AddShapeOperation {
  type: 'add_shape';
  shape: Shape;
}

/**
 * Operation to remove a shape (stores full shape for redo)
 */
export interface RemoveShapeOperation {
  type: 'remove_shape';
  shape: Shape;
}

/**
 * Operation to update a shape's properties
 */
export interface UpdateShapeOperation {
  type: 'update_shape';
  shapeId: string;
  prev: Partial<Shape>;
  next: Partial<Shape>;
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
 * Operation to resize the grid (stores removed shapes for undo when shrinking)
 */
export interface ResizeGridOperation {
  type: 'resize_grid';
  prevSize: GridSize;
  nextSize: GridSize;
  /** Shapes removed when shrinking the grid (for restore on undo) */
  removedShapes: Shape[];
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
 * Captures the previous role assignments for a shape (for undo on remove role)
 */
export interface ShapeRoleState {
  fabricRole?: FabricRoleId;
  secondaryFabricRole?: FabricRoleId;
  partFabricRoles?: {
    goose: FabricRoleId;
    sky1: FabricRoleId;
    sky2: FabricRoleId;
  };
  qstPartFabricRoles?: {
    top: FabricRoleId;
    right: FabricRoleId;
    bottom: FabricRoleId;
    left: FabricRoleId;
  };
}

/**
 * Operation to remove a fabric role from the palette
 * Stores affected shapes for restoring their role assignments on undo
 */
export interface RemoveRoleOperation {
  type: 'remove_role';
  role: FabricRole;
  /** Index where the role was in the palette (for restoring position on undo) */
  index: number;
  /** Shapes that had their roles reassigned, with their previous role assignments */
  affectedShapes: Array<{
    shapeId: string;
    prevRoles: ShapeRoleState;
  }>;
  /** The role that shapes were reassigned to */
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
  | AddShapeOperation
  | RemoveShapeOperation
  | UpdateShapeOperation
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
    case 'add_shape':
      return { type: 'remove_shape', shape: op.shape };

    case 'remove_shape':
      return { type: 'add_shape', shape: op.shape };

    case 'update_shape':
      return {
        type: 'update_shape',
        shapeId: op.shapeId,
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
        removedShapes: op.removedShapes,
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
        affectedShapes: [], // No shapes affected when undoing an add
        fallbackRoleId: '', // Not used when undoing an add
      };

    case 'remove_role': {
      // When undoing a remove, we need to both restore the role AND restore shape assignments
      const operations: Operation[] = [
        { type: 'add_role', role: op.role },
      ];

      // Add update operations to restore original role assignments to affected shapes
      for (const { shapeId, prevRoles } of op.affectedShapes) {
        if (prevRoles.fabricRole !== undefined) {
          operations.push({
            type: 'update_shape',
            shapeId,
            prev: { fabricRole: op.fallbackRoleId },
            next: { fabricRole: prevRoles.fabricRole },
          });
        }
        if (prevRoles.secondaryFabricRole !== undefined) {
          operations.push({
            type: 'update_shape',
            shapeId,
            prev: { secondaryFabricRole: op.fallbackRoleId },
            next: { secondaryFabricRole: prevRoles.secondaryFabricRole },
          });
        }
        if (prevRoles.partFabricRoles !== undefined) {
          // Restore Flying Geese part roles
          operations.push({
            type: 'update_shape',
            shapeId,
            prev: { partFabricRoles: { goose: op.fallbackRoleId, sky1: op.fallbackRoleId, sky2: op.fallbackRoleId } },
            next: { partFabricRoles: prevRoles.partFabricRoles },
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
 * Apply an operation to a shapes array
 */
export function applyOperationToShapes(shapes: Shape[], op: Operation): Shape[] {
  switch (op.type) {
    case 'add_shape':
      return [...shapes, op.shape];

    case 'remove_shape':
      return shapes.filter((s) => s.id !== op.shape.id);

    case 'update_shape': {
      return shapes.map((s) => {
        if (s.id === op.shapeId) {
          return { ...s, ...op.next } as Shape;
        }
        return s;
      });
    }

    case 'update_palette':
    case 'add_role':
    case 'rename_role':
      // These palette operations don't affect shapes array
      return shapes;

    case 'remove_role': {
      // When undoing a remove (via inverted add_role), we need to restore
      // the original role assignments to affected shapes
      // This is handled by the store directly when applying the inverted operation
      // For the forward remove operation, shapes are already reassigned before recording
      return shapes;
    }

    case 'resize_grid':
      // When undoing a shrink (going back to larger), restore removed shapes
      // When redoing a shrink (going to smaller), remove out-of-bounds shapes
      if (op.nextSize > op.prevSize) {
        // Expanding: restore previously removed shapes
        return [...shapes, ...op.removedShapes];
      } else {
        // Shrinking: remove shapes that would be removed
        const removedIds = new Set(op.removedShapes.map((s) => s.id));
        return shapes.filter((s) => !removedIds.has(s.id));
      }

    case 'batch':
      return op.operations.reduce(applyOperationToShapes, shapes);
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
 * Find shapes that would be out of bounds for a given grid size
 */
export function getShapesOutOfBounds(shapes: Shape[], gridSize: GridSize): Shape[] {
  return shapes.filter((shape) => {
    const { row, col } = shape.position;
    const { rows: spanRows, cols: spanCols } = shape.span;

    // Check if any part of the shape extends beyond the new grid bounds
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
 * Extract the role state from a shape for recording in undo operations
 */
export function extractRolesFromShape(shape: Shape): ShapeRoleState {
  if (shape.type === 'square') {
    return { fabricRole: shape.fabricRole };
  }
  if (shape.type === 'hst') {
    return {
      fabricRole: shape.fabricRole,
      secondaryFabricRole: shape.secondaryFabricRole,
    };
  }
  if (shape.type === 'flying_geese') {
    const fg = shape as FlyingGeeseShape;
    return {
      partFabricRoles: { ...fg.partFabricRoles },
    };
  }
  if (shape.type === 'qst') {
    const qst = shape as QstShape;
    return {
      qstPartFabricRoles: { ...qst.partFabricRoles },
    };
  }
  return {};
}

/**
 * Get all shapes that use a specific fabric role
 */
export function getShapesUsingRole(shapes: Shape[], roleId: FabricRoleId): Shape[] {
  return shapes.filter((shape) => {
    if (shape.type === 'square' || shape.type === 'hst') {
      if (shape.fabricRole === roleId) return true;
    }
    if (shape.type === 'hst') {
      if (shape.secondaryFabricRole === roleId) return true;
    }
    if (shape.type === 'flying_geese') {
      const fg = shape as FlyingGeeseShape;
      if (
        fg.partFabricRoles.goose === roleId ||
        fg.partFabricRoles.sky1 === roleId ||
        fg.partFabricRoles.sky2 === roleId
      ) {
        return true;
      }
    }
    if (shape.type === 'qst') {
      const qst = shape as QstShape;
      if (
        qst.partFabricRoles.top === roleId ||
        qst.partFabricRoles.right === roleId ||
        qst.partFabricRoles.bottom === roleId ||
        qst.partFabricRoles.left === roleId
      ) {
        return true;
      }
    }
    return false;
  });
}
