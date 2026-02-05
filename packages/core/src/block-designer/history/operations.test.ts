import { describe, it, expect } from 'vitest';
import {
  invertOperation,
  applyOperationToShapes,
  applyOperationToPalette,
  applyOperationToGridSize,
  getShapesOutOfBounds,
  type Operation,
} from './operations';
import type { Shape, Palette, GridSize } from '../types';

describe('operations', () => {
  describe('invertOperation', () => {
    it('inverts add_shape to remove_shape', () => {
      const shape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_shape', shape };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({ type: 'remove_shape', shape });
    });

    it('inverts remove_shape to add_shape', () => {
      const shape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'remove_shape', shape };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({ type: 'add_shape', shape });
    });

    it('inverts update_shape by swapping prev and next', () => {
      const op: Operation = {
        type: 'update_shape',
        shapeId: 'shape-1',
        prev: { fabricRole: 'background' },
        next: { fabricRole: 'accent1' },
      };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({
        type: 'update_shape',
        shapeId: 'shape-1',
        prev: { fabricRole: 'accent1' },
        next: { fabricRole: 'background' },
      });
    });

    it('inverts update_palette by swapping colors', () => {
      const op: Operation = {
        type: 'update_palette',
        roleId: 'background',
        prevColor: '#FFFFFF',
        nextColor: '#000000',
      };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({
        type: 'update_palette',
        roleId: 'background',
        prevColor: '#000000',
        nextColor: '#FFFFFF',
      });
    });

    it('inverts batch operation in reverse order', () => {
      const shape1: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const shape2: Shape = {
        id: 'shape-2',
        type: 'square',
        position: { row: 1, col: 1 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'accent1',
      };
      const op: Operation = {
        type: 'batch',
        operations: [
          { type: 'add_shape', shape: shape1 },
          { type: 'add_shape', shape: shape2 },
        ],
      };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({
        type: 'batch',
        operations: [
          { type: 'remove_shape', shape: shape2 },
          { type: 'remove_shape', shape: shape1 },
        ],
      });
    });
  });

  describe('applyOperationToShapes', () => {
    it('adds a shape for add_shape operation', () => {
      const shapes: Shape[] = [];
      const newShape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_shape', shape: newShape };

      const result = applyOperationToShapes(shapes, op);

      expect(result).toEqual([newShape]);
    });

    it('removes a shape for remove_shape operation', () => {
      const shape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const shapes: Shape[] = [shape];
      const op: Operation = { type: 'remove_shape', shape };

      const result = applyOperationToShapes(shapes, op);

      expect(result).toEqual([]);
    });

    it('updates a shape for update_shape operation', () => {
      const shape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const shapes: Shape[] = [shape];
      const op: Operation = {
        type: 'update_shape',
        shapeId: 'shape-1',
        prev: { fabricRole: 'background' },
        next: { fabricRole: 'accent1' },
      };

      const result = applyOperationToShapes(shapes, op);

      expect(result).toEqual([
        { ...shape, fabricRole: 'accent1' },
      ]);
    });

    it('returns unchanged shapes for update_palette operation', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'square',
          position: { row: 0, col: 0 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'background',
        },
      ];
      const op: Operation = {
        type: 'update_palette',
        roleId: 'background',
        prevColor: '#FFF',
        nextColor: '#000',
      };

      const result = applyOperationToShapes(shapes, op);

      expect(result).toBe(shapes);
    });

    it('applies batch operations in order', () => {
      const shapes: Shape[] = [];
      const shape1: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const shape2: Shape = {
        id: 'shape-2',
        type: 'square',
        position: { row: 1, col: 1 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'accent1',
      };
      const op: Operation = {
        type: 'batch',
        operations: [
          { type: 'add_shape', shape: shape1 },
          { type: 'add_shape', shape: shape2 },
        ],
      };

      const result = applyOperationToShapes(shapes, op);

      expect(result).toEqual([shape1, shape2]);
    });
  });

  describe('applyOperationToPalette', () => {
    const basePalette: Palette = {
      roles: [
        { id: 'background', name: 'Background', color: '#FFFFFF' },
        { id: 'accent1', name: 'Accent 1', color: '#FF0000' },
      ],
    };

    it('updates color for update_palette operation', () => {
      const op: Operation = {
        type: 'update_palette',
        roleId: 'background',
        prevColor: '#FFFFFF',
        nextColor: '#000000',
      };

      const result = applyOperationToPalette(basePalette, op);

      expect(result.roles[0].color).toBe('#000000');
      expect(result.roles[1].color).toBe('#FF0000');
    });

    it('returns unchanged palette for shape operations', () => {
      const shape: Shape = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_shape', shape };

      const result = applyOperationToPalette(basePalette, op);

      expect(result).toBe(basePalette);
    });

    it('applies batch palette operations', () => {
      const op: Operation = {
        type: 'batch',
        operations: [
          {
            type: 'update_palette',
            roleId: 'background',
            prevColor: '#FFFFFF',
            nextColor: '#000000',
          },
          {
            type: 'update_palette',
            roleId: 'accent1',
            prevColor: '#FF0000',
            nextColor: '#00FF00',
          },
        ],
      };

      const result = applyOperationToPalette(basePalette, op);

      expect(result.roles[0].color).toBe('#000000');
      expect(result.roles[1].color).toBe('#00FF00');
    });
  });

  describe('resize_grid operations', () => {
    const shape1: Shape = {
      id: 'shape-1',
      type: 'square',
      position: { row: 0, col: 0 },
      span: { rows: 1, cols: 1 },
      fabricRole: 'background',
    };
    const shape2: Shape = {
      id: 'shape-2',
      type: 'square',
      position: { row: 4, col: 4 },
      span: { rows: 1, cols: 1 },
      fabricRole: 'accent1',
    };

    describe('invertOperation', () => {
      it('inverts resize_grid by swapping sizes', () => {
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 5,
          nextSize: 3,
          removedShapes: [shape2],
        };

        const inverted = invertOperation(op);

        expect(inverted).toEqual({
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedShapes: [shape2],
        });
      });
    });

    describe('applyOperationToShapes', () => {
      it('restores shapes when expanding (undo shrink)', () => {
        const shapes: Shape[] = [shape1];
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedShapes: [shape2],
        };

        const result = applyOperationToShapes(shapes, op);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual(shape1);
        expect(result).toContainEqual(shape2);
      });

      it('removes shapes when shrinking (redo shrink)', () => {
        const shapes: Shape[] = [shape1, shape2];
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 5,
          nextSize: 3,
          removedShapes: [shape2],
        };

        const result = applyOperationToShapes(shapes, op);

        expect(result).toHaveLength(1);
        expect(result).toContainEqual(shape1);
      });
    });

    describe('applyOperationToGridSize', () => {
      it('returns new size for resize_grid operation', () => {
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedShapes: [],
        };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBe(5);
      });

      it('returns null for non-grid-size operations', () => {
        const op: Operation = { type: 'add_shape', shape: shape1 };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBeNull();
      });

      it('finds resize_grid in batch operations', () => {
        const op: Operation = {
          type: 'batch',
          operations: [
            { type: 'add_shape', shape: shape1 },
            {
              type: 'resize_grid',
              prevSize: 3,
              nextSize: 6,
              removedShapes: [],
            },
          ],
        };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBe(6);
      });

      it('returns null for batch with no resize_grid', () => {
        const op: Operation = {
          type: 'batch',
          operations: [
            { type: 'add_shape', shape: shape1 },
          ],
        };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBeNull();
      });
    });
  });

  describe('getShapesOutOfBounds', () => {
    it('returns empty array when all shapes are in bounds', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'square',
          position: { row: 0, col: 0 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'background',
        },
        {
          id: 'shape-2',
          type: 'square',
          position: { row: 2, col: 2 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'accent1',
        },
      ];

      const result = getShapesOutOfBounds(shapes, 3);

      expect(result).toHaveLength(0);
    });

    it('returns shapes outside given grid size', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'square',
          position: { row: 0, col: 0 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'background',
        },
        {
          id: 'shape-2',
          type: 'square',
          position: { row: 3, col: 3 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'accent1',
        },
      ];

      const result = getShapesOutOfBounds(shapes, 3);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shape-2');
    });

    it('considers shape span when checking bounds', () => {
      const shapes: Shape[] = [
        {
          id: 'fg-1',
          type: 'flying_geese',
          position: { row: 2, col: 2 },
          span: { rows: 1, cols: 2 },
          direction: 'right',
          partFabricRoles: { goose: 'feature', sky1: 'background', sky2: 'background' },
        } as Shape,
      ];

      // Position (2,2) with span (1,2) means it occupies (2,2) and (2,3)
      // For grid size 3, col 3 is out of bounds
      const result = getShapesOutOfBounds(shapes, 3);

      expect(result).toHaveLength(1);
    });

    it('returns all out-of-bounds shapes', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'square',
          position: { row: 5, col: 0 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'background',
        },
        {
          id: 'shape-2',
          type: 'square',
          position: { row: 0, col: 5 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'accent1',
        },
        {
          id: 'shape-3',
          type: 'square',
          position: { row: 5, col: 5 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'feature',
        },
      ];

      const result = getShapesOutOfBounds(shapes, 4);

      expect(result).toHaveLength(3);
    });
  });
});
