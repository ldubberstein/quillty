import { describe, it, expect } from 'vitest';
import { getRectangularRange } from './grid';

describe('getRectangularRange', () => {
  describe('single cell range', () => {
    it('returns single position when start equals end', () => {
      const result = getRectangularRange({ row: 2, col: 3 }, { row: 2, col: 3 });
      expect(result).toEqual([{ row: 2, col: 3 }]);
    });

    it('works for origin cell', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 0, col: 0 });
      expect(result).toEqual([{ row: 0, col: 0 }]);
    });
  });

  describe('horizontal range (same row)', () => {
    it('returns range from left to right', () => {
      const result = getRectangularRange({ row: 1, col: 0 }, { row: 1, col: 3 });
      expect(result).toEqual([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
      ]);
    });

    it('returns same range when direction is reversed (right to left)', () => {
      const result = getRectangularRange({ row: 1, col: 3 }, { row: 1, col: 0 });
      expect(result).toEqual([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
      ]);
    });
  });

  describe('vertical range (same column)', () => {
    it('returns range from top to bottom', () => {
      const result = getRectangularRange({ row: 0, col: 2 }, { row: 3, col: 2 });
      expect(result).toEqual([
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
      ]);
    });

    it('returns same range when direction is reversed (bottom to top)', () => {
      const result = getRectangularRange({ row: 3, col: 2 }, { row: 0, col: 2 });
      expect(result).toEqual([
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
      ]);
    });
  });

  describe('rectangular range (multiple rows and columns)', () => {
    it('returns all positions in rectangle from top-left to bottom-right', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 2, col: 2 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ]);
    });

    it('returns same range from bottom-right to top-left', () => {
      const result = getRectangularRange({ row: 2, col: 2 }, { row: 0, col: 0 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ]);
    });

    it('returns same range from top-right to bottom-left', () => {
      const result = getRectangularRange({ row: 0, col: 2 }, { row: 2, col: 0 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ]);
    });

    it('returns same range from bottom-left to top-right', () => {
      const result = getRectangularRange({ row: 2, col: 0 }, { row: 0, col: 2 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ]);
    });
  });

  describe('non-square rectangles', () => {
    it('handles wide rectangle (more cols than rows)', () => {
      const result = getRectangularRange({ row: 1, col: 0 }, { row: 2, col: 4 });
      expect(result).toEqual([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
      ]);
    });

    it('handles tall rectangle (more rows than cols)', () => {
      const result = getRectangularRange({ row: 0, col: 1 }, { row: 4, col: 2 });
      expect(result).toEqual([
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
      ]);
    });
  });

  describe('offset ranges', () => {
    it('handles range not starting at origin', () => {
      const result = getRectangularRange({ row: 5, col: 5 }, { row: 7, col: 7 });
      expect(result).toEqual([
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },
        { row: 7, col: 7 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles 2x2 rectangle', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 1, col: 1 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ]);
    });

    it('handles adjacent cells horizontally', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 0, col: 1 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ]);
    });

    it('handles adjacent cells vertically', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 1, col: 0 });
      expect(result).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ]);
    });
  });

  describe('ordering consistency', () => {
    it('always returns positions in row-major order (row by row, left to right)', () => {
      const result = getRectangularRange({ row: 1, col: 1 }, { row: 3, col: 3 });

      // Verify row-major ordering
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];

        // Either same row with higher col, or next row
        const isValidOrder =
          (current.row === next.row && current.col < next.col) ||
          (current.row < next.row && next.col <= result[0].col + (result.filter(p => p.row === result[0].row).length - 1));

        expect(isValidOrder || current.row < next.row).toBe(true);
      }
    });
  });

  describe('count verification', () => {
    it('returns correct number of positions for 3x3 grid', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 2, col: 2 });
      expect(result.length).toBe(9); // 3 * 3
    });

    it('returns correct number of positions for 4x5 grid', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 3, col: 4 });
      expect(result.length).toBe(20); // 4 * 5
    });

    it('returns correct number of positions for 1x10 row', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 0, col: 9 });
      expect(result.length).toBe(10); // 1 * 10
    });

    it('returns correct number of positions for 10x1 column', () => {
      const result = getRectangularRange({ row: 0, col: 0 }, { row: 9, col: 0 });
      expect(result.length).toBe(10); // 10 * 1
    });
  });
});
