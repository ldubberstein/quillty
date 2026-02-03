/**
 * Flying Geese Geometry Tests
 *
 * Tests for Flying Geese triangle geometry calculations.
 */

import { describe, it, expect } from 'vitest';
import { getFlyingGeeseTriangles, FLYING_GEESE_DIRECTION_INFO } from './flyingGeese';
import type { FlyingGeeseDirection } from '../types';

describe('getFlyingGeeseTriangles', () => {
  describe('right direction (horizontal, goose points right)', () => {
    const width = 200; // 2 cells wide
    const height = 100; // 1 cell tall

    it('returns correct goose triangle pointing right', () => {
      const result = getFlyingGeeseTriangles('right', width, height);

      // Goose: left edge to right point
      expect(result.goose.points).toEqual([
        { x: 0, y: 0 },
        { x: 200, y: 50 }, // midpoint on right
        { x: 0, y: 100 },
      ]);
    });

    it('returns correct sky triangles', () => {
      const result = getFlyingGeeseTriangles('right', width, height);

      // Sky1: top-right corner
      expect(result.sky1.points).toEqual([
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 50 },
      ]);

      // Sky2: bottom-right corner
      expect(result.sky2.points).toEqual([
        { x: 0, y: 100 },
        { x: 200, y: 50 },
        { x: 200, y: 100 },
      ]);
    });
  });

  describe('left direction (horizontal, goose points left)', () => {
    const width = 200;
    const height = 100;

    it('returns correct goose triangle pointing left', () => {
      const result = getFlyingGeeseTriangles('left', width, height);

      // Goose: right edge to left point
      expect(result.goose.points).toEqual([
        { x: 200, y: 0 },
        { x: 0, y: 50 }, // midpoint on left
        { x: 200, y: 100 },
      ]);
    });

    it('returns correct sky triangles', () => {
      const result = getFlyingGeeseTriangles('left', width, height);

      // Sky1: top-left corner
      expect(result.sky1.points).toEqual([
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 0, y: 50 },
      ]);

      // Sky2: bottom-left corner
      expect(result.sky2.points).toEqual([
        { x: 0, y: 50 },
        { x: 200, y: 100 },
        { x: 0, y: 100 },
      ]);
    });
  });

  describe('down direction (vertical, goose points down)', () => {
    const width = 100; // 1 cell wide
    const height = 200; // 2 cells tall

    it('returns correct goose triangle pointing down', () => {
      const result = getFlyingGeeseTriangles('down', width, height);

      // Goose: top edge to bottom point
      expect(result.goose.points).toEqual([
        { x: 0, y: 0 },
        { x: 50, y: 200 }, // midpoint on bottom
        { x: 100, y: 0 },
      ]);
    });

    it('returns correct sky triangles', () => {
      const result = getFlyingGeeseTriangles('down', width, height);

      // Sky1: bottom-left corner
      expect(result.sky1.points).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 200 },
        { x: 50, y: 200 },
      ]);

      // Sky2: bottom-right corner
      expect(result.sky2.points).toEqual([
        { x: 100, y: 0 },
        { x: 50, y: 200 },
        { x: 100, y: 200 },
      ]);
    });
  });

  describe('up direction (vertical, goose points up)', () => {
    const width = 100;
    const height = 200;

    it('returns correct goose triangle pointing up', () => {
      const result = getFlyingGeeseTriangles('up', width, height);

      // Goose: bottom edge to top point
      expect(result.goose.points).toEqual([
        { x: 0, y: 200 },
        { x: 50, y: 0 }, // midpoint on top
        { x: 100, y: 200 },
      ]);
    });

    it('returns correct sky triangles', () => {
      const result = getFlyingGeeseTriangles('up', width, height);

      // Sky1: top-left corner
      expect(result.sky1.points).toEqual([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 0, y: 200 },
      ]);

      // Sky2: top-right corner
      expect(result.sky2.points).toEqual([
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 200 },
      ]);
    });
  });

  it.each(['up', 'down', 'left', 'right'] as FlyingGeeseDirection[])(
    'returns valid triangles for direction %s',
    (direction) => {
      const isHorizontal = direction === 'left' || direction === 'right';
      const width = isHorizontal ? 200 : 100;
      const height = isHorizontal ? 100 : 200;

      const result = getFlyingGeeseTriangles(direction, width, height);

      // Each triangle should have exactly 3 points
      expect(result.goose.points).toHaveLength(3);
      expect(result.sky1.points).toHaveLength(3);
      expect(result.sky2.points).toHaveLength(3);

      // All points should be within bounds
      const allTriangles = [result.goose, result.sky1, result.sky2];
      for (const triangle of allTriangles) {
        for (const point of triangle.points) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(width);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(height);
        }
      }
    }
  );

  it('handles different aspect ratios', () => {
    const result = getFlyingGeeseTriangles('right', 300, 150);

    // Goose should point to midpoint of height
    expect(result.goose.points).toContainEqual({ x: 300, y: 75 });
  });
});

describe('FLYING_GEESE_DIRECTION_INFO', () => {
  it('contains all four directions', () => {
    expect(FLYING_GEESE_DIRECTION_INFO).toHaveProperty('up');
    expect(FLYING_GEESE_DIRECTION_INFO).toHaveProperty('down');
    expect(FLYING_GEESE_DIRECTION_INFO).toHaveProperty('left');
    expect(FLYING_GEESE_DIRECTION_INFO).toHaveProperty('right');
  });

  it('has correct symbols for each direction', () => {
    expect(FLYING_GEESE_DIRECTION_INFO.up.symbol).toBe('▲');
    expect(FLYING_GEESE_DIRECTION_INFO.down.symbol).toBe('▼');
    expect(FLYING_GEESE_DIRECTION_INFO.left.symbol).toBe('◀');
    expect(FLYING_GEESE_DIRECTION_INFO.right.symbol).toBe('▶');
  });

  it('has labels for each direction', () => {
    expect(FLYING_GEESE_DIRECTION_INFO.up.label).toBe('Up');
    expect(FLYING_GEESE_DIRECTION_INFO.down.label).toBe('Down');
    expect(FLYING_GEESE_DIRECTION_INFO.left.label).toBe('Left');
    expect(FLYING_GEESE_DIRECTION_INFO.right.label).toBe('Right');
  });
});
