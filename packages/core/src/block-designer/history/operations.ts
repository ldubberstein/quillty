/**
 * Undo/Redo Operation Types
 *
 * Defines the operation types used for undo/redo functionality.
 * Operations store the data needed to apply and invert each change.
 */

import type { Shape, FabricRoleId, Palette, GridSize } from '../types';

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
 * Union type of all operations
 */
export type Operation =
  | AddShapeOperation
  | RemoveShapeOperation
  | UpdateShapeOperation
  | UpdatePaletteOperation
  | ResizeGridOperation
  | BatchOperation;

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
      // Palette operations don't affect shapes array
      return shapes;

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

    case 'batch':
      return op.operations.reduce(applyOperationToPalette, palette);

    default:
      return palette;
  }
}
