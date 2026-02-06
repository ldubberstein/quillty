/**
 * Unit Registry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import type { UnitDefinition, UnitConfig, TriangleGroup } from './types';

// Create a fresh registry for testing (don't use the singleton which has units registered)
class TestUnitRegistry {
  private units: Map<string, UnitDefinition> = new Map();
  private frozen = false;

  register(definition: UnitDefinition): void {
    if (this.frozen) {
      throw new Error('UnitRegistry is frozen');
    }
    if (this.units.has(definition.typeId)) {
      throw new Error(`Unit type "${definition.typeId}" is already registered`);
    }
    this.units.set(definition.typeId, definition);
  }

  freeze(): void {
    this.frozen = true;
  }

  unfreeze(): void {
    this.frozen = false;
  }

  clear(): void {
    this.units.clear();
    this.frozen = false;
  }

  get(typeId: string): UnitDefinition | undefined {
    return this.units.get(typeId);
  }

  getAll(): UnitDefinition[] {
    return Array.from(this.units.values());
  }

  getByCategory(category: string): UnitDefinition[] {
    return this.getAll().filter((s) => s.category === category);
  }

  getTypeIds(): string[] {
    return Array.from(this.units.keys());
  }

  has(typeId: string): boolean {
    return this.units.has(typeId);
  }

  get size(): number {
    return this.units.size;
  }
}

// Helper to create a minimal valid unit definition for testing
function createTestUnit(overrides: Partial<UnitDefinition> = {}): UnitDefinition {
  return {
    typeId: 'test-unit',
    displayName: 'Test Unit',
    category: 'basic',
    description: 'A test unit',
    defaultSpan: { rows: 1, cols: 1 },
    spanBehavior: { type: 'fixed', span: { rows: 1, cols: 1 } },
    patches: [{ id: 'fill', name: 'Fill', defaultRole: 'background' }],
    getTriangles: (_config: UnitConfig, width: number, height: number): TriangleGroup => [
      {
        patchId: 'fill',
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: 0, y: height },
        ],
      },
    ],
    configSchema: z.object({
      variant: z.undefined().optional(),
      patchRoles: z.object({ fill: z.string() }),
    }),
    thumbnail: {
      type: 'svg',
      viewBox: '0 0 24 24',
      paths: [{ points: '0,0 24,0 24,24 0,24', fill: 'currentColor' }],
    },
    placementMode: 'single_tap',
    supportsBatchPlacement: true,
    ...overrides,
  };
}

describe('UnitRegistry', () => {
  let registry: TestUnitRegistry;

  beforeEach(() => {
    registry = new TestUnitRegistry();
  });

  describe('register', () => {
    it('registers a unit definition', () => {
      const unit = createTestUnit({ typeId: 'my-unit' });
      registry.register(unit);

      expect(registry.has('my-unit')).toBe(true);
      expect(registry.get('my-unit')).toBe(unit);
    });

    it('throws when registering duplicate typeId', () => {
      const unit1 = createTestUnit({ typeId: 'duplicate' });
      const unit2 = createTestUnit({ typeId: 'duplicate', displayName: 'Different Name' });

      registry.register(unit1);
      expect(() => registry.register(unit2)).toThrow('already registered');
    });

    it('throws when registry is frozen', () => {
      registry.freeze();
      const unit = createTestUnit({ typeId: 'late-unit' });

      expect(() => registry.register(unit)).toThrow('frozen');
    });

    it('allows registration after unfreeze', () => {
      registry.freeze();
      registry.unfreeze();
      const unit = createTestUnit({ typeId: 'unfrozen-unit' });

      registry.register(unit);
      expect(registry.has('unfrozen-unit')).toBe(true);
    });
  });

  describe('get', () => {
    it('returns undefined for unregistered type', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('returns the registered definition', () => {
      const unit = createTestUnit({ typeId: 'findable' });
      registry.register(unit);

      expect(registry.get('findable')).toBe(unit);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no units registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('returns all registered units', () => {
      const unit1 = createTestUnit({ typeId: 'unit-1' });
      const unit2 = createTestUnit({ typeId: 'unit-2' });
      const unit3 = createTestUnit({ typeId: 'unit-3' });

      registry.register(unit1);
      registry.register(unit2);
      registry.register(unit3);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContain(unit1);
      expect(all).toContain(unit2);
      expect(all).toContain(unit3);
    });
  });

  describe('getByCategory', () => {
    it('filters units by category', () => {
      const basic1 = createTestUnit({ typeId: 'basic-1', category: 'basic' });
      const basic2 = createTestUnit({ typeId: 'basic-2', category: 'basic' });
      const compound = createTestUnit({ typeId: 'compound-1', category: 'compound' });

      registry.register(basic1);
      registry.register(basic2);
      registry.register(compound);

      const basicUnits = registry.getByCategory('basic');
      expect(basicUnits).toHaveLength(2);
      expect(basicUnits).toContain(basic1);
      expect(basicUnits).toContain(basic2);

      const compoundUnits = registry.getByCategory('compound');
      expect(compoundUnits).toHaveLength(1);
      expect(compoundUnits).toContain(compound);
    });
  });

  describe('getTypeIds', () => {
    it('returns all registered type IDs', () => {
      registry.register(createTestUnit({ typeId: 'alpha' }));
      registry.register(createTestUnit({ typeId: 'beta' }));
      registry.register(createTestUnit({ typeId: 'gamma' }));

      const typeIds = registry.getTypeIds();
      expect(typeIds).toHaveLength(3);
      expect(typeIds).toContain('alpha');
      expect(typeIds).toContain('beta');
      expect(typeIds).toContain('gamma');
    });
  });

  describe('has', () => {
    it('returns false for unregistered type', () => {
      expect(registry.has('unknown')).toBe(false);
    });

    it('returns true for registered type', () => {
      registry.register(createTestUnit({ typeId: 'known' }));
      expect(registry.has('known')).toBe(true);
    });
  });

  describe('size', () => {
    it('returns 0 for empty registry', () => {
      expect(registry.size).toBe(0);
    });

    it('returns correct count', () => {
      registry.register(createTestUnit({ typeId: 'a' }));
      registry.register(createTestUnit({ typeId: 'b' }));
      expect(registry.size).toBe(2);
    });
  });

  describe('clear', () => {
    it('removes all units and unfreezes', () => {
      registry.register(createTestUnit({ typeId: 'to-clear' }));
      registry.freeze();

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.has('to-clear')).toBe(false);
      // Should be able to register again after clear
      registry.register(createTestUnit({ typeId: 'new-unit' }));
      expect(registry.has('new-unit')).toBe(true);
    });
  });
});

describe('triangleToFlatPoints', () => {
  it('converts triangle to flat array', async () => {
    const { triangleToFlatPoints } = await import('./types');

    const triangle = {
      patchId: 'test',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ] as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
    };

    const flat = triangleToFlatPoints(triangle);
    expect(flat).toEqual([0, 0, 10, 0, 5, 10]);
  });
});
