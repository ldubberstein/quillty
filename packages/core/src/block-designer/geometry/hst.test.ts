/**
 * HST Geometry Tests
 *
 * Tests for half-square triangle geometry calculations.
 */

import { describe, it, expect } from 'vitest';
import { getHstTriangles, triangleToFlatPoints, HST_VARIANT_INFO } from './hst';
import type { HstVariant } from '../types';

describe('getHstTriangles', () => {
  const width = 100;
  const height = 100;

  describe('nw variant (◸)', () => {
    it('returns correct primary triangle for top-left', () => {
      const result = getHstTriangles('nw', width, height);

      // Primary fills top-left: points at (0,0), (width,0), (0,height)
      expect(result.primary.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ]);
    });

    it('returns correct secondary triangle for bottom-right', () => {
      const result = getHstTriangles('nw', width, height);

      // Secondary fills bottom-right: points at (width,0), (width,height), (0,height)
      expect(result.secondary.points).toEqual([
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
    });
  });

  describe('ne variant (◹)', () => {
    it('returns correct primary triangle for top-right', () => {
      const result = getHstTriangles('ne', width, height);

      // Primary fills top-right: points at (0,0), (width,0), (width,height)
      expect(result.primary.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ]);
    });

    it('returns correct secondary triangle for bottom-left', () => {
      const result = getHstTriangles('ne', width, height);

      // Secondary fills bottom-left: points at (0,0), (width,height), (0,height)
      expect(result.secondary.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
    });
  });

  describe('sw variant (◺)', () => {
    it('returns correct primary triangle for bottom-left', () => {
      const result = getHstTriangles('sw', width, height);

      // Primary fills bottom-left: points at (0,0), (0,height), (width,height)
      expect(result.primary.points).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
      ]);
    });

    it('returns correct secondary triangle for top-right', () => {
      const result = getHstTriangles('sw', width, height);

      // Secondary fills top-right: points at (0,0), (width,0), (width,height)
      expect(result.secondary.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ]);
    });
  });

  describe('se variant (◿)', () => {
    it('returns correct primary triangle for bottom-right', () => {
      const result = getHstTriangles('se', width, height);

      // Primary fills bottom-right: points at (width,0), (width,height), (0,height)
      expect(result.primary.points).toEqual([
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
    });

    it('returns correct secondary triangle for top-left', () => {
      const result = getHstTriangles('se', width, height);

      // Secondary fills top-left: points at (0,0), (width,0), (0,height)
      expect(result.secondary.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ]);
    });
  });

  it('handles non-square dimensions', () => {
    const result = getHstTriangles('nw', 200, 100);

    expect(result.primary.points).toContainEqual({ x: 200, y: 0 });
    expect(result.primary.points).toContainEqual({ x: 0, y: 100 });
  });

  it.each(['nw', 'ne', 'sw', 'se'] as HstVariant[])(
    'returns valid triangles for variant %s',
    (variant) => {
      const result = getHstTriangles(variant, width, height);

      // Each triangle should have exactly 3 points
      expect(result.primary.points).toHaveLength(3);
      expect(result.secondary.points).toHaveLength(3);

      // All points should be within bounds
      for (const point of result.primary.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(height);
      }
    }
  );
});

describe('triangleToFlatPoints', () => {
  it('converts triangle to flat array', () => {
    const triangle = {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ] as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
    };

    const result = triangleToFlatPoints(triangle);

    expect(result).toEqual([0, 0, 100, 0, 0, 100]);
  });

  it('returns array of length 6', () => {
    const triangles = getHstTriangles('nw', 100, 100);
    const flatPoints = triangleToFlatPoints(triangles.primary);

    expect(flatPoints).toHaveLength(6);
  });

  it('maintains point order', () => {
    const triangle = {
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ] as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
    };

    const result = triangleToFlatPoints(triangle);

    expect(result[0]).toBe(10); // x1
    expect(result[1]).toBe(20); // y1
    expect(result[2]).toBe(30); // x2
    expect(result[3]).toBe(40); // y2
    expect(result[4]).toBe(50); // x3
    expect(result[5]).toBe(60); // y3
  });
});

describe('HST_VARIANT_INFO', () => {
  it('contains all four variants', () => {
    expect(HST_VARIANT_INFO).toHaveProperty('nw');
    expect(HST_VARIANT_INFO).toHaveProperty('ne');
    expect(HST_VARIANT_INFO).toHaveProperty('sw');
    expect(HST_VARIANT_INFO).toHaveProperty('se');
  });

  it('has correct symbols for each variant', () => {
    expect(HST_VARIANT_INFO.nw.symbol).toBe('◸');
    expect(HST_VARIANT_INFO.ne.symbol).toBe('◹');
    expect(HST_VARIANT_INFO.sw.symbol).toBe('◺');
    expect(HST_VARIANT_INFO.se.symbol).toBe('◿');
  });

  it('has labels for each variant', () => {
    expect(HST_VARIANT_INFO.nw.label).toBe('NW');
    expect(HST_VARIANT_INFO.ne.label).toBe('NE');
    expect(HST_VARIANT_INFO.sw.label).toBe('SW');
    expect(HST_VARIANT_INFO.se.label).toBe('SE');
  });
});
