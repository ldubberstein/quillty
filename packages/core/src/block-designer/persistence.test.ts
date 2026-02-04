import { describe, it, expect } from 'vitest';
import {
  serializeBlockForDb,
  deserializeBlockFromDb,
  extractHashtags,
  validateBlockForPublish,
  type BlockDesignData,
} from './persistence';
import type { Block, Shape, Palette, GridSize } from './types';

// Helper to create a minimal valid Block
function createTestBlock(overrides: Partial<Block> = {}): Block {
  const defaultPalette: Palette = {
    roles: [
      { id: 'background', name: 'Background', color: '#FFFFFF' },
      { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1', name: 'Accent 1', color: '#8B4513' },
      { id: 'accent2', name: 'Accent 2', color: '#DAA520' },
    ],
  };

  return {
    id: 'block-123',
    creatorId: 'user-456',
    derivedFromBlockId: null,
    title: 'Test Block',
    description: 'A test block',
    hashtags: [],
    gridSize: 3,
    shapes: [],
    previewPalette: defaultPalette,
    status: 'draft',
    publishedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Helper to create a test shape
function createSquareShape(row: number, col: number, fabricRole = 'background'): Shape {
  return {
    id: `shape-${row}-${col}`,
    type: 'square',
    position: { row, col },
    span: { rows: 1, cols: 1 },
    fabricRole,
  };
}

describe('serializeBlockForDb', () => {
  it('serializes a block with shapes to database format', () => {
    const shape = createSquareShape(0, 0, 'feature');
    const block = createTestBlock({
      title: 'My Block',
      description: 'Description here',
      gridSize: 3,
      shapes: [shape],
    });

    const result = serializeBlockForDb(block);

    expect(result.name).toBe('My Block');
    expect(result.description).toBe('Description here');
    expect(result.gridSize).toBe(3);
    expect(result.pieceCount).toBe(1);
    expect(result.designData.version).toBe(1);
    expect(result.designData.shapes).toEqual([shape]);
    expect(result.designData.previewPalette).toEqual(block.previewPalette);
  });

  it('uses default title when title is empty', () => {
    const block = createTestBlock({ title: '' });
    const result = serializeBlockForDb(block);
    expect(result.name).toBe('Untitled Block');
  });

  it('preserves null description', () => {
    const block = createTestBlock({ description: null });
    const result = serializeBlockForDb(block);
    expect(result.description).toBeNull();
  });

  it('calculates correct piece count', () => {
    const shapes = [
      createSquareShape(0, 0),
      createSquareShape(0, 1),
      createSquareShape(1, 0),
    ];
    const block = createTestBlock({ shapes });
    const result = serializeBlockForDb(block);
    expect(result.pieceCount).toBe(3);
  });
});

describe('deserializeBlockFromDb', () => {
  it('deserializes a database record to Block format', () => {
    const designData: BlockDesignData = {
      version: 1,
      shapes: [createSquareShape(0, 0)],
      previewPalette: {
        roles: [{ id: 'test', name: 'Test', color: '#FF0000' }],
      },
    };

    const dbBlock = {
      id: 'block-123',
      creator_id: 'user-456',
      name: 'DB Block',
      description: 'From database',
      grid_size: 4,
      design_data: designData,
      status: 'published' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      published_at: '2024-01-02T12:00:00Z',
    };

    const result = deserializeBlockFromDb(dbBlock);

    expect(result.id).toBe('block-123');
    expect(result.creatorId).toBe('user-456');
    expect(result.derivedFromBlockId).toBeNull();
    expect(result.title).toBe('DB Block');
    expect(result.description).toBe('From database');
    expect(result.gridSize).toBe(4);
    expect(result.shapes).toEqual(designData.shapes);
    expect(result.previewPalette).toEqual(designData.previewPalette);
    expect(result.status).toBe('published');
    expect(result.publishedAt).toBe('2024-01-02T12:00:00Z');
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result.updatedAt).toBe('2024-01-02T00:00:00Z');
  });

  it('handles null design_data with defaults', () => {
    const dbBlock = {
      id: 'block-123',
      creator_id: 'user-456',
      name: 'Empty Block',
      description: null,
      grid_size: 3,
      design_data: null,
      status: 'draft' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      published_at: null,
    };

    const result = deserializeBlockFromDb(dbBlock);

    expect(result.shapes).toEqual([]);
    expect(result.previewPalette.roles).toHaveLength(4);
    expect(result.previewPalette.roles[0].id).toBe('background');
  });

  it('handles missing shapes in design_data', () => {
    const dbBlock = {
      id: 'block-123',
      creator_id: 'user-456',
      name: 'Block',
      description: null,
      grid_size: 3,
      design_data: { version: 1 as const },
      status: 'draft' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      published_at: null,
    };

    const result = deserializeBlockFromDb(dbBlock);

    expect(result.shapes).toEqual([]);
  });
});

describe('extractHashtags', () => {
  it('extracts hashtags from description', () => {
    const description = 'Check out my #quilt with #modern design';
    const result = extractHashtags(description);
    expect(result).toEqual(['quilt', 'modern']);
  });

  it('returns empty array for empty string', () => {
    expect(extractHashtags('')).toEqual([]);
  });

  it('handles multiple hashtags', () => {
    const description = '#one #two #three #four';
    const result = extractHashtags(description);
    expect(result).toEqual(['one', 'two', 'three', 'four']);
  });

  it('converts hashtags to lowercase', () => {
    const description = '#UPPERCASE #MixedCase';
    const result = extractHashtags(description);
    expect(result).toEqual(['uppercase', 'mixedcase']);
  });

  it('handles hashtags with underscores', () => {
    const description = '#my_tag #another_one_here';
    const result = extractHashtags(description);
    expect(result).toEqual(['my_tag', 'another_one_here']);
  });

  it('handles hashtags with numbers', () => {
    const description = '#tag123 #2024trends';
    const result = extractHashtags(description);
    expect(result).toEqual(['tag123', '2024trends']);
  });

  it('ignores invalid hashtag characters', () => {
    const description = '#valid #invalid-dash #also_valid';
    const result = extractHashtags(description);
    expect(result).toEqual(['valid', 'invalid', 'also_valid']);
  });

  it('handles description with no hashtags', () => {
    const description = 'Just a regular description without tags';
    const result = extractHashtags(description);
    expect(result).toEqual([]);
  });
});

describe('validateBlockForPublish', () => {
  it('returns invalid for block with no shapes', () => {
    const block = createTestBlock({ shapes: [] });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Add at least one shape before publishing');
  });

  it('returns invalid when grid has empty cells (2x2 grid)', () => {
    const block = createTestBlock({
      gridSize: 2,
      shapes: [createSquareShape(0, 0)], // Only 1 of 4 cells filled
    });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('3 empty cells remaining. Fill all cells to publish.');
  });

  it('returns invalid with singular cell message', () => {
    const block = createTestBlock({
      gridSize: 2,
      shapes: [
        createSquareShape(0, 0),
        createSquareShape(0, 1),
        createSquareShape(1, 0),
        // Missing (1, 1)
      ],
    });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('1 empty cell remaining. Fill all cells to publish.');
  });

  it('returns valid when all cells are covered (2x2 grid)', () => {
    const block = createTestBlock({
      gridSize: 2,
      shapes: [
        createSquareShape(0, 0),
        createSquareShape(0, 1),
        createSquareShape(1, 0),
        createSquareShape(1, 1),
      ],
    });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('handles shapes that span multiple cells', () => {
    // A flying geese shape spans 2 cells
    const flyingGeeseShape: Shape = {
      id: 'fg-1',
      type: 'flying_geese',
      position: { row: 0, col: 0 },
      span: { rows: 1, cols: 2 }, // Horizontal flying geese
      direction: 'right',
      partFabricRoles: {
        goose: 'feature',
        sky1: 'background',
        sky2: 'background',
      },
    };

    const block = createTestBlock({
      gridSize: 2,
      shapes: [
        flyingGeeseShape, // Covers (0,0) and (0,1)
        createSquareShape(1, 0),
        createSquareShape(1, 1),
      ],
    });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(true);
  });

  it('validates a 3x3 grid correctly', () => {
    const shapes: Shape[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        shapes.push(createSquareShape(row, col));
      }
    }

    const block = createTestBlock({ gridSize: 3, shapes });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(true);
  });

  it('validates a 4x4 grid correctly', () => {
    const shapes: Shape[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        shapes.push(createSquareShape(row, col));
      }
    }

    const block = createTestBlock({ gridSize: 4, shapes });
    const result = validateBlockForPublish(block);

    expect(result.valid).toBe(true);
  });
});
