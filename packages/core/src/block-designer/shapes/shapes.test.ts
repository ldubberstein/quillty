/**
 * Unit Definitions Tests
 *
 * Tests for all registered unit definitions (Square, HST, QST, Flying Geese)
 */

import { describe, it, expect } from 'vitest';
import { unitRegistry } from '../shape-registry';
import { squareDefinition } from './square';
import { hstDefinition } from './hst';
import { qstDefinition } from './qst';
import { flyingGeeseDefinition } from './flyingGeese';

describe('Unit Registration', () => {
  it('registers all 4 units', () => {
    expect(unitRegistry.size).toBeGreaterThanOrEqual(4);
    expect(unitRegistry.has('square')).toBe(true);
    expect(unitRegistry.has('hst')).toBe(true);
    expect(unitRegistry.has('qst')).toBe(true);
    expect(unitRegistry.has('flying_geese')).toBe(true);
  });

  it('can retrieve registered units', () => {
    expect(unitRegistry.get('square')).toBe(squareDefinition);
    expect(unitRegistry.get('hst')).toBe(hstDefinition);
    expect(unitRegistry.get('qst')).toBe(qstDefinition);
    expect(unitRegistry.get('flying_geese')).toBe(flyingGeeseDefinition);
  });
});

describe('Square Definition', () => {
  const def = squareDefinition;

  it('has correct metadata', () => {
    expect(def.typeId).toBe('square');
    expect(def.displayName).toBe('Square');
    expect(def.category).toBe('basic');
    expect(def.defaultSpan).toEqual({ rows: 1, cols: 1 });
  });

  it('has one patch (fill)', () => {
    expect(def.patches).toHaveLength(1);
    expect(def.patches[0].id).toBe('fill');
  });

  it('has no variants', () => {
    expect(def.variants).toBeUndefined();
    expect(def.defaultVariant).toBeUndefined();
  });

  it('generates 2 triangles', () => {
    const triangles = def.getTriangles(
      { patchRoles: { fill: 'background' } },
      100,
      100
    );

    expect(triangles).toHaveLength(2);
    expect(triangles[0].patchId).toBe('fill');
    expect(triangles[1].patchId).toBe('fill');
  });

  it('triangles cover the full square', () => {
    const triangles = def.getTriangles(
      { patchRoles: { fill: 'background' } },
      100,
      100
    );

    // Both triangles should have corners at (0,0), (100,0), (0,100), (100,100)
    const allPoints = triangles.flatMap((t) => t.points);
    const corners = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ];

    for (const corner of corners) {
      expect(allPoints.some((p) => p.x === corner.x && p.y === corner.y)).toBe(true);
    }
  });

  it('supports single_tap placement', () => {
    expect(def.placementMode).toBe('single_tap');
    expect(def.supportsBatchPlacement).toBe(true);
  });
});

describe('HST Definition', () => {
  const def = hstDefinition;

  it('has correct metadata', () => {
    expect(def.typeId).toBe('hst');
    expect(def.displayName).toBe('Half-Square Triangle');
    expect(def.category).toBe('basic');
    expect(def.defaultSpan).toEqual({ rows: 1, cols: 1 });
  });

  it('has two patches (primary, secondary)', () => {
    expect(def.patches).toHaveLength(2);
    expect(def.patches.map((p) => p.id)).toContain('primary');
    expect(def.patches.map((p) => p.id)).toContain('secondary');
  });

  it('has 4 variants', () => {
    expect(def.variants).toHaveLength(4);
    const variantIds = def.variants!.map((v) => v.id);
    expect(variantIds).toContain('nw');
    expect(variantIds).toContain('ne');
    expect(variantIds).toContain('sw');
    expect(variantIds).toContain('se');
  });

  it('default variant is nw', () => {
    expect(def.defaultVariant).toBe('nw');
  });

  it('generates 2 triangles for each variant', () => {
    const variants = ['nw', 'ne', 'sw', 'se'] as const;

    for (const variant of variants) {
      const triangles = def.getTriangles(
        { variant, patchRoles: { primary: 'background', secondary: 'feature' } },
        100,
        100
      );

      expect(triangles).toHaveLength(2);
      expect(triangles.map((t) => t.patchId)).toContain('primary');
      expect(triangles.map((t) => t.patchId)).toContain('secondary');
    }
  });

  it('rotates variants correctly (clockwise)', () => {
    expect(def.rotateVariant!('nw')).toBe('ne');
    expect(def.rotateVariant!('ne')).toBe('se');
    expect(def.rotateVariant!('se')).toBe('sw');
    expect(def.rotateVariant!('sw')).toBe('nw');
  });

  it('flips variants horizontally', () => {
    expect(def.flipHorizontalVariant!('nw')).toBe('ne');
    expect(def.flipHorizontalVariant!('ne')).toBe('nw');
    expect(def.flipHorizontalVariant!('sw')).toBe('se');
    expect(def.flipHorizontalVariant!('se')).toBe('sw');
  });

  it('flips variants vertically', () => {
    expect(def.flipVerticalVariant!('nw')).toBe('sw');
    expect(def.flipVerticalVariant!('sw')).toBe('nw');
    expect(def.flipVerticalVariant!('ne')).toBe('se');
    expect(def.flipVerticalVariant!('se')).toBe('ne');
  });
});

describe('QST Definition', () => {
  const def = qstDefinition;

  it('has correct metadata', () => {
    expect(def.typeId).toBe('qst');
    expect(def.displayName).toBe('Quarter-Square Triangle');
    expect(def.category).toBe('basic');
    expect(def.defaultSpan).toEqual({ rows: 1, cols: 1 });
  });

  it('has four patches', () => {
    expect(def.patches).toHaveLength(4);
    const patchIds = def.patches.map((p) => p.id);
    expect(patchIds).toContain('top');
    expect(patchIds).toContain('right');
    expect(patchIds).toContain('bottom');
    expect(patchIds).toContain('left');
  });

  it('has no variants (rotation via color cycling)', () => {
    expect(def.variants).toBeUndefined();
    expect(def.defaultVariant).toBeUndefined();
  });

  it('generates 4 triangles meeting at center', () => {
    const triangles = def.getTriangles(
      {
        patchRoles: {
          top: 'background',
          right: 'feature',
          bottom: 'accent1',
          left: 'accent2',
        },
      },
      100,
      100
    );

    expect(triangles).toHaveLength(4);

    const patchIds = triangles.map((t) => t.patchId);
    expect(patchIds).toContain('top');
    expect(patchIds).toContain('right');
    expect(patchIds).toContain('bottom');
    expect(patchIds).toContain('left');

    // All triangles should share the center point
    const center = { x: 50, y: 50 };
    for (const triangle of triangles) {
      expect(triangle.points.some((p) => p.x === center.x && p.y === center.y)).toBe(true);
    }
  });

  it('rotates part roles clockwise', () => {
    const roles = {
      top: 'a',
      right: 'b',
      bottom: 'c',
      left: 'd',
    };

    const rotated = def.rotatePartRoles!(roles);

    expect(rotated.top).toBe('d'); // left -> top
    expect(rotated.right).toBe('a'); // top -> right
    expect(rotated.bottom).toBe('b'); // right -> bottom
    expect(rotated.left).toBe('c'); // bottom -> left
  });

  it('flips part roles horizontally', () => {
    const roles = {
      top: 'a',
      right: 'b',
      bottom: 'c',
      left: 'd',
    };

    const flipped = def.flipHorizontalPartRoles!(roles);

    expect(flipped.top).toBe('a'); // top stays
    expect(flipped.right).toBe('d'); // left -> right
    expect(flipped.bottom).toBe('c'); // bottom stays
    expect(flipped.left).toBe('b'); // right -> left
  });

  it('flips part roles vertically', () => {
    const roles = {
      top: 'a',
      right: 'b',
      bottom: 'c',
      left: 'd',
    };

    const flipped = def.flipVerticalPartRoles!(roles);

    expect(flipped.top).toBe('c'); // bottom -> top
    expect(flipped.right).toBe('b'); // right stays
    expect(flipped.bottom).toBe('a'); // top -> bottom
    expect(flipped.left).toBe('d'); // left stays
  });
});

describe('Flying Geese Definition', () => {
  const def = flyingGeeseDefinition;

  it('has correct metadata', () => {
    expect(def.typeId).toBe('flying_geese');
    expect(def.displayName).toBe('Flying Geese');
    expect(def.category).toBe('compound');
  });

  it('has three patches', () => {
    expect(def.patches).toHaveLength(3);
    const patchIds = def.patches.map((p) => p.id);
    expect(patchIds).toContain('goose');
    expect(patchIds).toContain('sky1');
    expect(patchIds).toContain('sky2');
  });

  it('has 4 direction variants', () => {
    expect(def.variants).toHaveLength(4);
    const variantIds = def.variants!.map((v) => v.id);
    expect(variantIds).toContain('up');
    expect(variantIds).toContain('down');
    expect(variantIds).toContain('left');
    expect(variantIds).toContain('right');
  });

  it('default variant is right', () => {
    expect(def.defaultVariant).toBe('right');
  });

  it('has variant-dependent span', () => {
    expect(def.spanBehavior.type).toBe('variant_dependent');
    if (def.spanBehavior.type === 'variant_dependent') {
      // Horizontal directions
      expect(def.spanBehavior.getSpan('left')).toEqual({ rows: 1, cols: 2 });
      expect(def.spanBehavior.getSpan('right')).toEqual({ rows: 1, cols: 2 });
      // Vertical directions
      expect(def.spanBehavior.getSpan('up')).toEqual({ rows: 2, cols: 1 });
      expect(def.spanBehavior.getSpan('down')).toEqual({ rows: 2, cols: 1 });
    }
  });

  it('generates 3 triangles for each direction', () => {
    const directions = ['up', 'down', 'left', 'right'] as const;

    for (const direction of directions) {
      const isHorizontal = direction === 'left' || direction === 'right';
      const width = isHorizontal ? 200 : 100;
      const height = isHorizontal ? 100 : 200;

      const triangles = def.getTriangles(
        {
          variant: direction,
          patchRoles: { goose: 'background', sky1: 'feature', sky2: 'accent1' },
        },
        width,
        height
      );

      expect(triangles).toHaveLength(3);
      const patchIds = triangles.map((t) => t.patchId);
      expect(patchIds).toContain('goose');
      expect(patchIds).toContain('sky1');
      expect(patchIds).toContain('sky2');
    }
  });

  it('rotates direction variants correctly (clockwise)', () => {
    expect(def.rotateVariant!('up')).toBe('right');
    expect(def.rotateVariant!('right')).toBe('down');
    expect(def.rotateVariant!('down')).toBe('left');
    expect(def.rotateVariant!('left')).toBe('up');
  });

  it('flips direction horizontally', () => {
    expect(def.flipHorizontalVariant!('left')).toBe('right');
    expect(def.flipHorizontalVariant!('right')).toBe('left');
    expect(def.flipHorizontalVariant!('up')).toBe('up');
    expect(def.flipHorizontalVariant!('down')).toBe('down');
  });

  it('flips direction vertically', () => {
    expect(def.flipVerticalVariant!('up')).toBe('down');
    expect(def.flipVerticalVariant!('down')).toBe('up');
    expect(def.flipVerticalVariant!('left')).toBe('left');
    expect(def.flipVerticalVariant!('right')).toBe('right');
  });

  it('uses two_tap placement mode', () => {
    expect(def.placementMode).toBe('two_tap');
    expect(def.supportsBatchPlacement).toBe(false);
  });

  it('validates placement and returns adjacent cells', () => {
    const mockIsCellOccupied = (pos: { row: number; col: number }) => {
      // (0,1) and (1,0) are occupied - adjacent to (1,1)
      return (pos.row === 0 && pos.col === 1) || (pos.row === 1 && pos.col === 0);
    };

    // Position (1,1) has 4 adjacent: (0,1), (2,1), (1,0), (1,2)
    // With (0,1) and (1,0) occupied, should have 2 valid
    const result = def.validatePlacement!({ row: 1, col: 1 }, 3, mockIsCellOccupied);

    expect(result.valid).toBe(true);
    expect(result.validAdjacentCells).toBeDefined();
    expect(result.validAdjacentCells!.length).toBe(2);
    expect(result.validAdjacentCells).toContainEqual({ row: 2, col: 1 }); // down
    expect(result.validAdjacentCells).toContainEqual({ row: 1, col: 2 }); // right
  });

  it('returns invalid when no adjacent cells available', () => {
    // All cells occupied
    const mockAllOccupied = () => true;

    const result = def.validatePlacement!({ row: 1, col: 1 }, 3, mockAllOccupied);

    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('respects grid boundaries in placement validation', () => {
    const mockNoneOccupied = () => false;

    // Corner position - only 2 adjacent cells in bounds
    const result = def.validatePlacement!({ row: 0, col: 0 }, 3, mockNoneOccupied);

    expect(result.valid).toBe(true);
    expect(result.validAdjacentCells).toHaveLength(2);
    expect(result.validAdjacentCells).toContainEqual({ row: 0, col: 1 });
    expect(result.validAdjacentCells).toContainEqual({ row: 1, col: 0 });
  });
});

describe('Unit Definition Schemas', () => {
  it('Square config schema validates correctly', () => {
    const validConfig = { patchRoles: { fill: 'background' } };
    expect(() => squareDefinition.configSchema.parse(validConfig)).not.toThrow();

    const invalidConfig = { patchRoles: {} };
    expect(() => squareDefinition.configSchema.parse(invalidConfig)).toThrow();
  });

  it('HST config schema validates correctly', () => {
    const validConfig = {
      variant: 'nw',
      patchRoles: { primary: 'background', secondary: 'feature' },
    };
    expect(() => hstDefinition.configSchema.parse(validConfig)).not.toThrow();

    const invalidVariant = {
      variant: 'invalid',
      patchRoles: { primary: 'background', secondary: 'feature' },
    };
    expect(() => hstDefinition.configSchema.parse(invalidVariant)).toThrow();
  });

  it('QST config schema validates correctly', () => {
    const validConfig = {
      patchRoles: { top: 'a', right: 'b', bottom: 'c', left: 'd' },
    };
    expect(() => qstDefinition.configSchema.parse(validConfig)).not.toThrow();

    const missingPatch = {
      patchRoles: { top: 'a', right: 'b', bottom: 'c' },
    };
    expect(() => qstDefinition.configSchema.parse(missingPatch)).toThrow();
  });

  it('Flying Geese config schema validates correctly', () => {
    const validConfig = {
      variant: 'right',
      patchRoles: { goose: 'a', sky1: 'b', sky2: 'c' },
    };
    expect(() => flyingGeeseDefinition.configSchema.parse(validConfig)).not.toThrow();

    const invalidDirection = {
      variant: 'diagonal',
      patchRoles: { goose: 'a', sky1: 'b', sky2: 'c' },
    };
    expect(() => flyingGeeseDefinition.configSchema.parse(invalidDirection)).toThrow();
  });
});
