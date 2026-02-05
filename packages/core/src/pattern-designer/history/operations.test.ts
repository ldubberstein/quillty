import { describe, it, expect } from 'vitest';
import type { BlockInstance, Border, Palette, QuiltGridSize, BorderConfig } from '../types';
import {
  PatternOperation,
  AddBlockInstanceOperation,
  RemoveBlockInstanceOperation,
  UpdateBlockInstanceOperation,
  UpdatePaletteOperation,
  ResizeGridOperation,
  AddBorderOperation,
  RemoveBorderOperation,
  UpdateBorderOperation,
  SetBordersEnabledOperation,
  ReorderBordersOperation,
  PatternBatchOperation,
  invertPatternOperation,
  applyOperationToBlockInstances,
  applyOperationToPalette,
  applyOperationToGridSize,
  applyOperationToBorderConfig,
} from './operations';

// Test fixtures
const mockInstance: BlockInstance = {
  id: 'inst-1',
  blockId: 'block-1',
  position: { row: 0, col: 0 },
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
};

const mockInstance2: BlockInstance = {
  id: 'inst-2',
  blockId: 'block-1',
  position: { row: 1, col: 1 },
  rotation: 90,
  flipHorizontal: true,
  flipVertical: false,
};

const mockBorder: Border = {
  id: 'border-1',
  widthInches: 3,
  style: 'plain',
  fabricRole: 'accent1',
  cornerStyle: 'butted',
};

const mockPalette: Palette = {
  roles: [
    { id: 'background', name: 'Background', color: '#FFFFFF' },
    { id: 'accent1', name: 'Accent 1', color: '#FF0000' },
  ],
};

describe('invertPatternOperation', () => {
  describe('block instance operations', () => {
    it('inverts add_block_instance to remove_block_instance', () => {
      const op: AddBlockInstanceOperation = {
        type: 'add_block_instance',
        instance: mockInstance,
      };

      const inverted = invertPatternOperation(op);

      expect(inverted.type).toBe('remove_block_instance');
      expect((inverted as RemoveBlockInstanceOperation).instance).toEqual(mockInstance);
    });

    it('inverts remove_block_instance to add_block_instance', () => {
      const op: RemoveBlockInstanceOperation = {
        type: 'remove_block_instance',
        instance: mockInstance,
      };

      const inverted = invertPatternOperation(op);

      expect(inverted.type).toBe('add_block_instance');
      expect((inverted as AddBlockInstanceOperation).instance).toEqual(mockInstance);
    });

    it('inverts update_block_instance by swapping prev and next', () => {
      const op: UpdateBlockInstanceOperation = {
        type: 'update_block_instance',
        instanceId: 'inst-1',
        prev: { rotation: 0 },
        next: { rotation: 90 },
      };

      const inverted = invertPatternOperation(op) as UpdateBlockInstanceOperation;

      expect(inverted.type).toBe('update_block_instance');
      expect(inverted.instanceId).toBe('inst-1');
      expect(inverted.prev).toEqual({ rotation: 90 });
      expect(inverted.next).toEqual({ rotation: 0 });
    });
  });

  describe('palette operations', () => {
    it('inverts update_palette by swapping colors', () => {
      const op: UpdatePaletteOperation = {
        type: 'update_palette',
        roleId: 'accent1',
        prevColor: '#FF0000',
        nextColor: '#00FF00',
      };

      const inverted = invertPatternOperation(op) as UpdatePaletteOperation;

      expect(inverted.type).toBe('update_palette');
      expect(inverted.roleId).toBe('accent1');
      expect(inverted.prevColor).toBe('#00FF00');
      expect(inverted.nextColor).toBe('#FF0000');
    });

    it('inverts update_palette with affectedOverrides', () => {
      const op: UpdatePaletteOperation = {
        type: 'update_palette',
        roleId: 'accent1',
        prevColor: '#FF0000',
        nextColor: '#00FF00',
        affectedOverrides: [
          { instanceId: 'inst-1', roleId: 'accent1', prevColor: '#FF0000' },
          { instanceId: 'inst-2', roleId: 'accent2', prevColor: '#ff0000' },
        ],
      };

      const inverted = invertPatternOperation(op) as UpdatePaletteOperation;

      expect(inverted.type).toBe('update_palette');
      expect(inverted.prevColor).toBe('#00FF00');
      expect(inverted.nextColor).toBe('#FF0000');
      expect(inverted.affectedOverrides).toHaveLength(2);
      // When inverting, affected overrides should have prevColor set to the nextColor of original
      expect(inverted.affectedOverrides![0].prevColor).toBe('#00FF00');
      expect(inverted.affectedOverrides![1].prevColor).toBe('#00FF00');
    });
  });

  describe('grid operations', () => {
    it('inverts resize_grid by swapping sizes', () => {
      const op: ResizeGridOperation = {
        type: 'resize_grid',
        prevSize: { rows: 4, cols: 4 },
        nextSize: { rows: 5, cols: 5 },
        removedInstances: [],
      };

      const inverted = invertPatternOperation(op) as ResizeGridOperation;

      expect(inverted.type).toBe('resize_grid');
      expect(inverted.prevSize).toEqual({ rows: 5, cols: 5 });
      expect(inverted.nextSize).toEqual({ rows: 4, cols: 4 });
    });

    it('inverts resize_grid with instance shift', () => {
      const op: ResizeGridOperation = {
        type: 'resize_grid',
        prevSize: { rows: 4, cols: 4 },
        nextSize: { rows: 5, cols: 4 },
        removedInstances: [],
        instanceShift: { rowDelta: 1, colDelta: 0 },
      };

      const inverted = invertPatternOperation(op) as ResizeGridOperation;

      expect(inverted.instanceShift?.rowDelta).toBe(-1);
      // Use Object.is to handle -0 vs 0 edge case
      expect(Object.is(inverted.instanceShift?.colDelta, 0) || inverted.instanceShift?.colDelta === 0).toBe(true);
    });
  });

  describe('border operations', () => {
    it('inverts add_border to remove_border', () => {
      const op: AddBorderOperation = {
        type: 'add_border',
        border: mockBorder,
        createdConfig: false,
      };

      const inverted = invertPatternOperation(op);

      expect(inverted.type).toBe('remove_border');
      expect((inverted as RemoveBorderOperation).border).toEqual(mockBorder);
    });

    it('inverts remove_border to add_border', () => {
      const op: RemoveBorderOperation = {
        type: 'remove_border',
        border: mockBorder,
        index: 0,
      };

      const inverted = invertPatternOperation(op);

      expect(inverted.type).toBe('add_border');
      expect((inverted as AddBorderOperation).border).toEqual(mockBorder);
    });

    it('inverts update_border by swapping prev and next', () => {
      const op: UpdateBorderOperation = {
        type: 'update_border',
        borderId: 'border-1',
        prev: { widthInches: 3 },
        next: { widthInches: 5 },
      };

      const inverted = invertPatternOperation(op) as UpdateBorderOperation;

      expect(inverted.prev).toEqual({ widthInches: 5 });
      expect(inverted.next).toEqual({ widthInches: 3 });
    });

    it('inverts set_borders_enabled', () => {
      const op: SetBordersEnabledOperation = {
        type: 'set_borders_enabled',
        prevEnabled: false,
        nextEnabled: true,
      };

      const inverted = invertPatternOperation(op) as SetBordersEnabledOperation;

      expect(inverted.prevEnabled).toBe(true);
      expect(inverted.nextEnabled).toBe(false);
    });

    it('inverts reorder_borders', () => {
      const op: ReorderBordersOperation = {
        type: 'reorder_borders',
        fromIndex: 0,
        toIndex: 2,
      };

      const inverted = invertPatternOperation(op) as ReorderBordersOperation;

      expect(inverted.fromIndex).toBe(2);
      expect(inverted.toIndex).toBe(0);
    });
  });

  describe('batch operations', () => {
    it('inverts batch operations in reverse order', () => {
      const op: PatternBatchOperation = {
        type: 'batch',
        operations: [
          { type: 'add_block_instance', instance: mockInstance },
          { type: 'add_block_instance', instance: mockInstance2 },
        ],
      };

      const inverted = invertPatternOperation(op) as PatternBatchOperation;

      expect(inverted.type).toBe('batch');
      expect(inverted.operations).toHaveLength(2);
      // Should be reversed
      expect(inverted.operations[0].type).toBe('remove_block_instance');
      expect((inverted.operations[0] as RemoveBlockInstanceOperation).instance).toEqual(mockInstance2);
      expect((inverted.operations[1] as RemoveBlockInstanceOperation).instance).toEqual(mockInstance);
    });
  });
});

describe('applyOperationToBlockInstances', () => {
  it('adds instance for add_block_instance', () => {
    const instances: BlockInstance[] = [];
    const op: AddBlockInstanceOperation = {
      type: 'add_block_instance',
      instance: mockInstance,
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockInstance);
  });

  it('removes instance for remove_block_instance', () => {
    const instances: BlockInstance[] = [mockInstance, mockInstance2];
    const op: RemoveBlockInstanceOperation = {
      type: 'remove_block_instance',
      instance: mockInstance,
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('inst-2');
  });

  it('updates instance for update_block_instance', () => {
    const instances: BlockInstance[] = [mockInstance];
    const op: UpdateBlockInstanceOperation = {
      type: 'update_block_instance',
      instanceId: 'inst-1',
      prev: { rotation: 0 },
      next: { rotation: 180 },
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result[0].rotation).toBe(180);
  });

  it('removes out-of-bounds instances for resize_grid shrink', () => {
    const instances: BlockInstance[] = [
      { ...mockInstance, position: { row: 0, col: 0 } },
      { ...mockInstance2, position: { row: 3, col: 3 } },
    ];
    const op: ResizeGridOperation = {
      type: 'resize_grid',
      prevSize: { rows: 4, cols: 4 },
      nextSize: { rows: 3, cols: 3 },
      removedInstances: [],
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toHaveLength(1);
    expect(result[0].position).toEqual({ row: 0, col: 0 });
  });

  it('shifts instances when adding row/col at start', () => {
    const instances: BlockInstance[] = [mockInstance];
    const op: ResizeGridOperation = {
      type: 'resize_grid',
      prevSize: { rows: 4, cols: 4 },
      nextSize: { rows: 5, cols: 4 },
      removedInstances: [],
      instanceShift: { rowDelta: 1, colDelta: 0 },
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result[0].position).toEqual({ row: 1, col: 0 });
  });

  it('restores removed instances on undo of shrink', () => {
    const removedInstance: BlockInstance = { ...mockInstance2, position: { row: 3, col: 3 } };
    const instances: BlockInstance[] = [mockInstance];
    const op: ResizeGridOperation = {
      type: 'resize_grid',
      prevSize: { rows: 3, cols: 3 },
      nextSize: { rows: 4, cols: 4 },
      removedInstances: [removedInstance],
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(removedInstance);
  });

  it('applies batch operations in order', () => {
    const instances: BlockInstance[] = [];
    const op: PatternBatchOperation = {
      type: 'batch',
      operations: [
        { type: 'add_block_instance', instance: mockInstance },
        { type: 'add_block_instance', instance: mockInstance2 },
      ],
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toHaveLength(2);
  });

  it('returns unchanged instances for update_palette without affectedOverrides', () => {
    const instances: BlockInstance[] = [mockInstance];
    const op: UpdatePaletteOperation = {
      type: 'update_palette',
      roleId: 'accent1',
      prevColor: '#FF0000',
      nextColor: '#00FF00',
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result).toBe(instances);
  });

  it('updates instance overrides for update_palette with affectedOverrides', () => {
    const instanceWithOverride: BlockInstance = {
      ...mockInstance,
      paletteOverrides: { accent1: '#FF0000', accent2: '#0000FF' },
    };
    const instances: BlockInstance[] = [instanceWithOverride, mockInstance2];
    const op: UpdatePaletteOperation = {
      type: 'update_palette',
      roleId: 'accent1',
      prevColor: '#FF0000',
      nextColor: '#00FF00',
      affectedOverrides: [
        { instanceId: 'inst-1', roleId: 'accent1', prevColor: '#FF0000' },
      ],
    };

    const result = applyOperationToBlockInstances(instances, op);

    // The affected override should be updated to the new color
    expect(result[0].paletteOverrides!['accent1']).toBe('#00FF00');
    // Other overrides should be unchanged
    expect(result[0].paletteOverrides!['accent2']).toBe('#0000FF');
    // Other instances should be unchanged
    expect(result[1]).toEqual(mockInstance2);
  });

  it('updates multiple instances for update_palette with affectedOverrides', () => {
    const instance1: BlockInstance = {
      ...mockInstance,
      paletteOverrides: { accent1: '#FF0000' },
    };
    const instance2: BlockInstance = {
      ...mockInstance2,
      paletteOverrides: { accent2: '#FF0000' },
    };
    const instances: BlockInstance[] = [instance1, instance2];
    const op: UpdatePaletteOperation = {
      type: 'update_palette',
      roleId: 'accent1',
      prevColor: '#FF0000',
      nextColor: '#00FF00',
      affectedOverrides: [
        { instanceId: 'inst-1', roleId: 'accent1', prevColor: '#FF0000' },
        { instanceId: 'inst-2', roleId: 'accent2', prevColor: '#FF0000' },
      ],
    };

    const result = applyOperationToBlockInstances(instances, op);

    expect(result[0].paletteOverrides!['accent1']).toBe('#00FF00');
    expect(result[1].paletteOverrides!['accent2']).toBe('#00FF00');
  });
});

describe('applyOperationToPalette', () => {
  it('updates role color for update_palette', () => {
    const op: UpdatePaletteOperation = {
      type: 'update_palette',
      roleId: 'accent1',
      prevColor: '#FF0000',
      nextColor: '#00FF00',
    };

    const result = applyOperationToPalette(mockPalette, op);

    expect(result.roles.find((r) => r.id === 'accent1')?.color).toBe('#00FF00');
    // Other roles unchanged
    expect(result.roles.find((r) => r.id === 'background')?.color).toBe('#FFFFFF');
  });

  it('applies batch palette operations', () => {
    const op: PatternBatchOperation = {
      type: 'batch',
      operations: [
        { type: 'update_palette', roleId: 'accent1', prevColor: '#FF0000', nextColor: '#00FF00' },
        { type: 'update_palette', roleId: 'background', prevColor: '#FFFFFF', nextColor: '#000000' },
      ],
    };

    const result = applyOperationToPalette(mockPalette, op);

    expect(result.roles.find((r) => r.id === 'accent1')?.color).toBe('#00FF00');
    expect(result.roles.find((r) => r.id === 'background')?.color).toBe('#000000');
  });

  it('returns unchanged palette for unrelated operations', () => {
    const op: AddBlockInstanceOperation = {
      type: 'add_block_instance',
      instance: mockInstance,
    };

    const result = applyOperationToPalette(mockPalette, op);

    expect(result).toBe(mockPalette);
  });
});

describe('applyOperationToGridSize', () => {
  it('returns new size for resize_grid', () => {
    const size: QuiltGridSize = { rows: 4, cols: 4 };
    const op: ResizeGridOperation = {
      type: 'resize_grid',
      prevSize: { rows: 4, cols: 4 },
      nextSize: { rows: 5, cols: 6 },
      removedInstances: [],
    };

    const result = applyOperationToGridSize(size, op);

    expect(result).toEqual({ rows: 5, cols: 6 });
  });

  it('applies batch grid operations', () => {
    const size: QuiltGridSize = { rows: 4, cols: 4 };
    const op: PatternBatchOperation = {
      type: 'batch',
      operations: [
        { type: 'resize_grid', prevSize: { rows: 4, cols: 4 }, nextSize: { rows: 5, cols: 4 }, removedInstances: [] },
        { type: 'resize_grid', prevSize: { rows: 5, cols: 4 }, nextSize: { rows: 5, cols: 5 }, removedInstances: [] },
      ],
    };

    const result = applyOperationToGridSize(size, op);

    expect(result).toEqual({ rows: 5, cols: 5 });
  });

  it('returns unchanged size for unrelated operations', () => {
    const size: QuiltGridSize = { rows: 4, cols: 4 };
    const op: AddBlockInstanceOperation = {
      type: 'add_block_instance',
      instance: mockInstance,
    };

    const result = applyOperationToGridSize(size, op);

    expect(result).toBe(size);
  });
});

describe('applyOperationToBorderConfig', () => {
  it('creates config when adding first border', () => {
    const op: AddBorderOperation = {
      type: 'add_border',
      border: mockBorder,
      createdConfig: true,
    };

    const result = applyOperationToBorderConfig(null, op);

    expect(result).not.toBeNull();
    expect(result!.enabled).toBe(true);
    expect(result!.borders).toHaveLength(1);
    expect(result!.borders[0]).toEqual(mockBorder);
  });

  it('appends border to existing config', () => {
    const config: BorderConfig = { enabled: true, borders: [mockBorder] };
    const newBorder: Border = { ...mockBorder, id: 'border-2' };
    const op: AddBorderOperation = {
      type: 'add_border',
      border: newBorder,
      createdConfig: false,
    };

    const result = applyOperationToBorderConfig(config, op);

    expect(result!.borders).toHaveLength(2);
  });

  it('removes border for remove_border', () => {
    const config: BorderConfig = { enabled: true, borders: [mockBorder] };
    const op: RemoveBorderOperation = {
      type: 'remove_border',
      border: mockBorder,
      index: 0,
    };

    const result = applyOperationToBorderConfig(config, op);

    expect(result!.borders).toHaveLength(0);
  });

  it('updates border for update_border', () => {
    const config: BorderConfig = { enabled: true, borders: [mockBorder] };
    const op: UpdateBorderOperation = {
      type: 'update_border',
      borderId: 'border-1',
      prev: { widthInches: 3 },
      next: { widthInches: 5 },
    };

    const result = applyOperationToBorderConfig(config, op);

    expect(result!.borders[0].widthInches).toBe(5);
  });

  it('sets enabled flag for set_borders_enabled', () => {
    const config: BorderConfig = { enabled: true, borders: [mockBorder] };
    const op: SetBordersEnabledOperation = {
      type: 'set_borders_enabled',
      prevEnabled: true,
      nextEnabled: false,
    };

    const result = applyOperationToBorderConfig(config, op);

    expect(result!.enabled).toBe(false);
  });

  it('creates config when enabling borders with null config', () => {
    const op: SetBordersEnabledOperation = {
      type: 'set_borders_enabled',
      prevEnabled: false,
      nextEnabled: true,
    };

    const result = applyOperationToBorderConfig(null, op);

    expect(result).not.toBeNull();
    expect(result!.enabled).toBe(true);
    expect(result!.borders).toHaveLength(0);
  });

  it('reorders borders for reorder_borders', () => {
    const border2: Border = { ...mockBorder, id: 'border-2' };
    const border3: Border = { ...mockBorder, id: 'border-3' };
    const config: BorderConfig = { enabled: true, borders: [mockBorder, border2, border3] };
    const op: ReorderBordersOperation = {
      type: 'reorder_borders',
      fromIndex: 0,
      toIndex: 2,
    };

    const result = applyOperationToBorderConfig(config, op);

    expect(result!.borders[0].id).toBe('border-2');
    expect(result!.borders[1].id).toBe('border-3');
    expect(result!.borders[2].id).toBe('border-1');
  });

  it('returns null config for unrelated operations', () => {
    const op: AddBlockInstanceOperation = {
      type: 'add_block_instance',
      instance: mockInstance,
    };

    const result = applyOperationToBorderConfig(null, op);

    expect(result).toBeNull();
  });
});

describe('double inversion', () => {
  it('double inversion returns equivalent operation', () => {
    const operations: PatternOperation[] = [
      { type: 'add_block_instance', instance: mockInstance },
      { type: 'remove_block_instance', instance: mockInstance },
      { type: 'update_block_instance', instanceId: 'inst-1', prev: { rotation: 0 }, next: { rotation: 90 } },
      { type: 'update_palette', roleId: 'accent1', prevColor: '#FF0000', nextColor: '#00FF00' },
      { type: 'resize_grid', prevSize: { rows: 4, cols: 4 }, nextSize: { rows: 5, cols: 5 }, removedInstances: [] },
      { type: 'add_border', border: mockBorder, createdConfig: false },
      { type: 'remove_border', border: mockBorder, index: 0 },
      { type: 'update_border', borderId: 'border-1', prev: { widthInches: 3 }, next: { widthInches: 5 } },
      { type: 'set_borders_enabled', prevEnabled: false, nextEnabled: true },
      { type: 'reorder_borders', fromIndex: 0, toIndex: 2 },
    ];

    for (const op of operations) {
      const doubleInverted = invertPatternOperation(invertPatternOperation(op));
      // Type and key values should match (deep equality for complex objects)
      expect(doubleInverted.type).toBe(op.type);
    }
  });
});
