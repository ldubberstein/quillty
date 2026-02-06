import { describe, it, expect } from 'vitest';
import {
  invertOperation,
  applyOperationToUnits,
  applyOperationToPalette,
  applyOperationToGridSize,
  getUnitsOutOfBounds,
  type Operation,
} from './operations';
import type { Unit, Palette, GridSize } from '../types';

describe('operations', () => {
  describe('invertOperation', () => {
    it('inverts add_unit to remove_unit', () => {
      const unit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_unit', unit };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({ type: 'remove_unit', unit });
    });

    it('inverts remove_unit to add_unit', () => {
      const unit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'remove_unit', unit };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({ type: 'add_unit', unit });
    });

    it('inverts update_unit by swapping prev and next', () => {
      const op: Operation = {
        type: 'update_unit',
        unitId: 'shape-1',
        prev: { fabricRole: 'background' },
        next: { fabricRole: 'accent1' },
      };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({
        type: 'update_unit',
        unitId: 'shape-1',
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
      const unit1: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const unit2: Unit = {
        id: 'shape-2',
        type: 'square',
        position: { row: 1, col: 1 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'accent1',
      };
      const op: Operation = {
        type: 'batch',
        operations: [
          { type: 'add_unit', unit: unit1 },
          { type: 'add_unit', unit: unit2 },
        ],
      };

      const inverted = invertOperation(op);

      expect(inverted).toEqual({
        type: 'batch',
        operations: [
          { type: 'remove_unit', unit: unit2 },
          { type: 'remove_unit', unit: unit1 },
        ],
      });
    });
  });

  describe('applyOperationToUnits', () => {
    it('adds a unit for add_unit operation', () => {
      const units: Unit[] = [];
      const newUnit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_unit', unit: newUnit };

      const result = applyOperationToUnits(units, op);

      expect(result).toEqual([newUnit]);
    });

    it('removes a unit for remove_unit operation', () => {
      const unit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const units: Unit[] = [unit];
      const op: Operation = { type: 'remove_unit', unit };

      const result = applyOperationToUnits(units, op);

      expect(result).toEqual([]);
    });

    it('updates a unit for update_unit operation', () => {
      const unit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const units: Unit[] = [unit];
      const op: Operation = {
        type: 'update_unit',
        unitId: 'shape-1',
        prev: { fabricRole: 'background' },
        next: { fabricRole: 'accent1' },
      };

      const result = applyOperationToUnits(units, op);

      expect(result).toEqual([
        { ...unit, fabricRole: 'accent1' },
      ]);
    });

    it('returns unchanged units for update_palette operation', () => {
      const units: Unit[] = [
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

      const result = applyOperationToUnits(units, op);

      expect(result).toBe(units);
    });

    it('applies batch operations in order', () => {
      const units: Unit[] = [];
      const unit1: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const unit2: Unit = {
        id: 'shape-2',
        type: 'square',
        position: { row: 1, col: 1 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'accent1',
      };
      const op: Operation = {
        type: 'batch',
        operations: [
          { type: 'add_unit', unit: unit1 },
          { type: 'add_unit', unit: unit2 },
        ],
      };

      const result = applyOperationToUnits(units, op);

      expect(result).toEqual([unit1, unit2]);
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

    it('returns unchanged palette for unit operations', () => {
      const unit: Unit = {
        id: 'shape-1',
        type: 'square',
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      };
      const op: Operation = { type: 'add_unit', unit };

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
    const unit1: Unit = {
      id: 'shape-1',
      type: 'square',
      position: { row: 0, col: 0 },
      span: { rows: 1, cols: 1 },
      fabricRole: 'background',
    };
    const unit2: Unit = {
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
          removedUnits: [unit2],
        };

        const inverted = invertOperation(op);

        expect(inverted).toEqual({
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedUnits: [unit2],
        });
      });
    });

    describe('applyOperationToUnits', () => {
      it('restores units when expanding (undo shrink)', () => {
        const units: Unit[] = [unit1];
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedUnits: [unit2],
        };

        const result = applyOperationToUnits(units, op);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual(unit1);
        expect(result).toContainEqual(unit2);
      });

      it('removes units when shrinking (redo shrink)', () => {
        const units: Unit[] = [unit1, unit2];
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 5,
          nextSize: 3,
          removedUnits: [unit2],
        };

        const result = applyOperationToUnits(units, op);

        expect(result).toHaveLength(1);
        expect(result).toContainEqual(unit1);
      });
    });

    describe('applyOperationToGridSize', () => {
      it('returns new size for resize_grid operation', () => {
        const op: Operation = {
          type: 'resize_grid',
          prevSize: 3,
          nextSize: 5,
          removedUnits: [],
        };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBe(5);
      });

      it('returns null for non-grid-size operations', () => {
        const op: Operation = { type: 'add_unit', unit: unit1 };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBeNull();
      });

      it('finds resize_grid in batch operations', () => {
        const op: Operation = {
          type: 'batch',
          operations: [
            { type: 'add_unit', unit: unit1 },
            {
              type: 'resize_grid',
              prevSize: 3,
              nextSize: 6,
              removedUnits: [],
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
            { type: 'add_unit', unit: unit1 },
          ],
        };

        const result = applyOperationToGridSize(3, op);

        expect(result).toBeNull();
      });
    });
  });

  describe('getUnitsOutOfBounds', () => {
    it('returns empty array when all units are in bounds', () => {
      const units: Unit[] = [
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

      const result = getUnitsOutOfBounds(units, 3);

      expect(result).toHaveLength(0);
    });

    it('returns units outside given grid size', () => {
      const units: Unit[] = [
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

      const result = getUnitsOutOfBounds(units, 3);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('shape-2');
    });

    it('considers unit span when checking bounds', () => {
      const units: Unit[] = [
        {
          id: 'fg-1',
          type: 'flying_geese',
          position: { row: 2, col: 2 },
          span: { rows: 1, cols: 2 },
          direction: 'right',
          patchFabricRoles: { goose: 'feature', sky1: 'background', sky2: 'background' },
        } as Unit,
      ];

      // Position (2,2) with span (1,2) means it occupies (2,2) and (2,3)
      // For grid size 3, col 3 is out of bounds
      const result = getUnitsOutOfBounds(units, 3);

      expect(result).toHaveLength(1);
    });

    it('returns all out-of-bounds units', () => {
      const units: Unit[] = [
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

      const result = getUnitsOutOfBounds(units, 4);

      expect(result).toHaveLength(3);
    });
  });
});
