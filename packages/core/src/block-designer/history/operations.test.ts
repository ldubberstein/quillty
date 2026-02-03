import { describe, it, expect } from 'vitest';
import {
  invertOperation,
  applyOperationToShapes,
  applyOperationToPalette,
  type Operation,
} from './operations';
import type { Shape, Palette } from '../types';

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
});
