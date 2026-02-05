/**
 * QST Geometry Tests
 *
 * Tests for quarter-square triangle geometry calculations.
 */

import { describe, it, expect } from 'vitest';
import { getQstTriangles } from './qst';

describe('getQstTriangles', () => {
  const width = 100;
  const height = 100;

  it('returns four triangles meeting at the center', () => {
    const result = getQstTriangles(width, height);

    // Should have all four triangles
    expect(result).toHaveProperty('top');
    expect(result).toHaveProperty('right');
    expect(result).toHaveProperty('bottom');
    expect(result).toHaveProperty('left');
  });

  it('all triangles share the center point', () => {
    const result = getQstTriangles(width, height);
    const center = { x: width / 2, y: height / 2 };

    // Each triangle should have the center point
    expect(result.top.points).toContainEqual(center);
    expect(result.right.points).toContainEqual(center);
    expect(result.bottom.points).toContainEqual(center);
    expect(result.left.points).toContainEqual(center);
  });

  describe('top triangle', () => {
    it('has correct points: top-left, top-right, center', () => {
      const result = getQstTriangles(width, height);

      expect(result.top.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 50 },
      ]);
    });
  });

  describe('right triangle', () => {
    it('has correct points: top-right, bottom-right, center', () => {
      const result = getQstTriangles(width, height);

      expect(result.right.points).toEqual([
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 50, y: 50 },
      ]);
    });
  });

  describe('bottom triangle', () => {
    it('has correct points: bottom-right, bottom-left, center', () => {
      const result = getQstTriangles(width, height);

      expect(result.bottom.points).toEqual([
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 50, y: 50 },
      ]);
    });
  });

  describe('left triangle', () => {
    it('has correct points: bottom-left, top-left, center', () => {
      const result = getQstTriangles(width, height);

      expect(result.left.points).toEqual([
        { x: 0, y: 100 },
        { x: 0, y: 0 },
        { x: 50, y: 50 },
      ]);
    });
  });

  it('handles non-square dimensions', () => {
    const result = getQstTriangles(200, 100);

    // Center should be at (100, 50)
    const center = { x: 100, y: 50 };
    expect(result.top.points).toContainEqual(center);
    expect(result.right.points).toContainEqual({ x: 200, y: 0 });
    expect(result.bottom.points).toContainEqual({ x: 0, y: 100 });
  });

  it('each triangle has exactly 3 points', () => {
    const result = getQstTriangles(width, height);

    expect(result.top.points).toHaveLength(3);
    expect(result.right.points).toHaveLength(3);
    expect(result.bottom.points).toHaveLength(3);
    expect(result.left.points).toHaveLength(3);
  });

  it('all points are within bounds', () => {
    const result = getQstTriangles(width, height);

    const allPoints = [
      ...result.top.points,
      ...result.right.points,
      ...result.bottom.points,
      ...result.left.points,
    ];

    for (const point of allPoints) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(height);
    }
  });

  it('handles small dimensions', () => {
    const result = getQstTriangles(10, 10);

    expect(result.top.points).toContainEqual({ x: 5, y: 5 });
    expect(result.right.points).toContainEqual({ x: 5, y: 5 });
  });

  it('handles zero dimensions gracefully', () => {
    const result = getQstTriangles(0, 0);

    // Should return triangles with all points at (0, 0)
    expect(result.top.points).toContainEqual({ x: 0, y: 0 });
  });
});
