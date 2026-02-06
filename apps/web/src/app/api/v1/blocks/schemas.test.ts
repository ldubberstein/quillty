import { describe, it, expect } from 'vitest';
import {
  CreateBlockInputSchema,
  UpdateBlockInputSchema,
  BlockDesignDataSchema,
  DifficultySchema,
} from './schemas';

describe('Block API Schemas', () => {
  // Valid test data
  const validDesignData = {
    version: 1 as const,
    units: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'square' as const,
        position: { row: 0, col: 0 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'background',
      },
    ],
    previewPalette: {
      roles: [
        { id: 'background', name: 'Background', color: '#FFFFFF' },
        { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      ],
    },
  };

  describe('DifficultySchema', () => {
    it('should accept valid difficulty levels', () => {
      expect(DifficultySchema.parse('beginner')).toBe('beginner');
      expect(DifficultySchema.parse('intermediate')).toBe('intermediate');
      expect(DifficultySchema.parse('advanced')).toBe('advanced');
    });

    it('should reject invalid difficulty levels', () => {
      expect(() => DifficultySchema.parse('easy')).toThrow();
      expect(() => DifficultySchema.parse('')).toThrow();
    });
  });

  describe('BlockDesignDataSchema', () => {
    it('should accept valid design data', () => {
      const result = BlockDesignDataSchema.parse(validDesignData);
      expect(result.units).toHaveLength(1);
      expect(result.previewPalette.roles).toHaveLength(2);
    });

    it('should accept design data without version', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { version: _version, ...dataWithoutVersion } = validDesignData;
      const result = BlockDesignDataSchema.parse(dataWithoutVersion);
      expect(result.version).toBeUndefined();
    });

    it('should accept empty units array', () => {
      const invalidData = {
        ...validDesignData,
        units: [],
      };
      // Empty units array is technically valid per schema
      const result = BlockDesignDataSchema.parse(invalidData);
      expect(result.units).toHaveLength(0);
    });

    it('should reject missing previewPalette', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { previewPalette: _previewPalette, ...invalidData } = validDesignData;
      expect(() => BlockDesignDataSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid shape structure', () => {
      const invalidData = {
        ...validDesignData,
        units: [{ invalid: 'shape' }],
      };
      expect(() => BlockDesignDataSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CreateBlockInputSchema', () => {
    const validInput = {
      name: 'My Block',
      gridSize: 3 as const,
      designData: validDesignData,
    };

    it('should accept valid create input', () => {
      const result = CreateBlockInputSchema.parse(validInput);
      expect(result.name).toBe('My Block');
      expect(result.gridSize).toBe(3);
      expect(result.difficulty).toBe('beginner'); // default
    });

    it('should accept optional fields', () => {
      const inputWithOptionals = {
        ...validInput,
        description: 'A beautiful block',
        difficulty: 'advanced' as const,
        thumbnailUrl: 'https://example.com/thumb.png',
      };
      const result = CreateBlockInputSchema.parse(inputWithOptionals);
      expect(result.description).toBe('A beautiful block');
      expect(result.difficulty).toBe('advanced');
      expect(result.thumbnailUrl).toBe('https://example.com/thumb.png');
    });

    it('should accept null description', () => {
      const inputWithNullDesc = {
        ...validInput,
        description: null,
      };
      const result = CreateBlockInputSchema.parse(inputWithNullDesc);
      expect(result.description).toBeNull();
    });

    it('should reject empty name', () => {
      const invalidInput = { ...validInput, name: '' };
      expect(() => CreateBlockInputSchema.parse(invalidInput)).toThrow();
    });

    it('should reject name over 100 characters', () => {
      const invalidInput = { ...validInput, name: 'a'.repeat(101) };
      expect(() => CreateBlockInputSchema.parse(invalidInput)).toThrow();
    });

    it('should reject description over 500 characters', () => {
      const invalidInput = { ...validInput, description: 'a'.repeat(501) };
      expect(() => CreateBlockInputSchema.parse(invalidInput)).toThrow();
    });

    it('should only accept valid grid sizes (2-9)', () => {
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 2 }).gridSize).toBe(2);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 3 }).gridSize).toBe(3);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 4 }).gridSize).toBe(4);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 5 }).gridSize).toBe(5);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 6 }).gridSize).toBe(6);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 7 }).gridSize).toBe(7);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 8 }).gridSize).toBe(8);
      expect(CreateBlockInputSchema.parse({ ...validInput, gridSize: 9 }).gridSize).toBe(9);

      expect(() => CreateBlockInputSchema.parse({ ...validInput, gridSize: 1 })).toThrow();
      expect(() => CreateBlockInputSchema.parse({ ...validInput, gridSize: 10 })).toThrow();
    });

    it('should reject invalid thumbnail URL', () => {
      const invalidInput = { ...validInput, thumbnailUrl: 'not-a-url' };
      expect(() => CreateBlockInputSchema.parse(invalidInput)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => CreateBlockInputSchema.parse({})).toThrow();
      expect(() => CreateBlockInputSchema.parse({ name: 'Test' })).toThrow();
      expect(() => CreateBlockInputSchema.parse({ name: 'Test', gridSize: 3 })).toThrow();
    });
  });

  describe('UpdateBlockInputSchema', () => {
    it('should accept partial updates', () => {
      const result = UpdateBlockInputSchema.parse({ name: 'New Name' });
      expect(result.name).toBe('New Name');
      expect(result.gridSize).toBeUndefined();
    });

    it('should accept empty update (all fields optional)', () => {
      const result = UpdateBlockInputSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept full update', () => {
      const fullUpdate = {
        name: 'Updated Block',
        description: 'New description',
        gridSize: 4 as const,
        designData: validDesignData,
        difficulty: 'intermediate' as const,
        thumbnailUrl: 'https://example.com/new-thumb.png',
      };
      const result = UpdateBlockInputSchema.parse(fullUpdate);
      expect(result.name).toBe('Updated Block');
      expect(result.gridSize).toBe(4);
    });

    it('should apply same validation rules as create', () => {
      expect(() => UpdateBlockInputSchema.parse({ name: '' })).toThrow();
      expect(() => UpdateBlockInputSchema.parse({ name: 'a'.repeat(101) })).toThrow();
      expect(() => UpdateBlockInputSchema.parse({ gridSize: 10 })).toThrow();
    });
  });
});
