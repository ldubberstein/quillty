/**
 * Unit Registry
 *
 * Central registry for all unit definitions. Units register themselves
 * at module load time, enabling dynamic unit discovery without hardcoding.
 */

import type { UnitDefinition, UnitCategory, IUnitRegistry } from './types';

/**
 * UnitRegistry - Singleton that stores all registered unit definitions.
 *
 * Usage:
 * - Units call unitRegistry.register(definition) during module initialization
 * - UI components call unitRegistry.getAll() to discover available units
 * - Store/renderers call unitRegistry.get(typeId) to look up unit definitions
 */
class UnitRegistry implements IUnitRegistry {
  private units: Map<string, UnitDefinition> = new Map();
  private frozen = false;

  /**
   * Register a unit definition.
   * Should be called during module initialization (top-level side effect).
   *
   * @throws Error if registry is frozen or typeId already exists
   */
  register(definition: UnitDefinition): void {
    if (this.frozen) {
      throw new Error(
        `UnitRegistry is frozen. Cannot register "${definition.typeId}". ` +
          'Units must be registered during module initialization.'
      );
    }

    if (this.units.has(definition.typeId)) {
      throw new Error(
        `Unit type "${definition.typeId}" is already registered. ` +
          'Each unit type must have a unique typeId.'
      );
    }

    // Validate that required fields are present
    this.validateDefinition(definition);

    this.units.set(definition.typeId, definition);
  }

  /**
   * Validate a unit definition has all required fields and consistent data.
   */
  private validateDefinition(definition: UnitDefinition): void {
    if (!definition.typeId || typeof definition.typeId !== 'string') {
      throw new Error('Unit definition must have a non-empty typeId string');
    }

    if (!definition.displayName || typeof definition.displayName !== 'string') {
      throw new Error(`Unit "${definition.typeId}" must have a displayName`);
    }

    if (!definition.patches || definition.patches.length === 0) {
      throw new Error(`Unit "${definition.typeId}" must have at least one patch`);
    }

    if (typeof definition.getTriangles !== 'function') {
      throw new Error(`Unit "${definition.typeId}" must implement getTriangles()`);
    }

    // If variants are defined, defaultVariant should be one of them
    if (definition.variants && definition.variants.length > 0) {
      if (!definition.defaultVariant) {
        throw new Error(
          `Unit "${definition.typeId}" has variants but no defaultVariant`
        );
      }
      const variantIds = definition.variants.map((v) => v.id);
      if (!variantIds.includes(definition.defaultVariant)) {
        throw new Error(
          `Unit "${definition.typeId}" defaultVariant "${definition.defaultVariant}" ` +
            `is not in variants: ${variantIds.join(', ')}`
        );
      }
    }
  }

  /**
   * Freeze the registry after all units are registered.
   * This is called after initialization to catch late registrations.
   *
   * Note: Currently we don't freeze to allow hot-module reloading during dev.
   * In production, you can call freeze() after all unit modules are loaded.
   */
  freeze(): void {
    this.frozen = true;
  }

  /**
   * Unfreeze the registry (for hot-module reloading in development).
   */
  unfreeze(): void {
    this.frozen = false;
  }

  /**
   * Clear all registrations (for testing).
   */
  clear(): void {
    this.units.clear();
    this.frozen = false;
  }

  /**
   * Get a unit definition by type ID.
   * @returns The unit definition, or undefined if not found
   */
  get(typeId: string): UnitDefinition | undefined {
    return this.units.get(typeId);
  }

  /**
   * Get a unit definition by type ID, throwing if not found.
   * Use this when you expect the unit to exist.
   */
  getOrThrow(typeId: string): UnitDefinition {
    const definition = this.units.get(typeId);
    if (!definition) {
      throw new Error(
        `Unknown unit type: "${typeId}". ` +
          `Registered types: ${this.getTypeIds().join(', ') || '(none)'}`
      );
    }
    return definition;
  }

  /**
   * Get all registered unit definitions.
   * Results are ordered by registration order.
   */
  getAll(): UnitDefinition[] {
    return Array.from(this.units.values());
  }

  /**
   * Get units filtered by category.
   */
  getByCategory(category: UnitCategory): UnitDefinition[] {
    return this.getAll().filter((s) => s.category === category);
  }

  /**
   * Get all registered type IDs.
   */
  getTypeIds(): string[] {
    return Array.from(this.units.keys());
  }

  /**
   * Check if a unit type is registered.
   */
  has(typeId: string): boolean {
    return this.units.has(typeId);
  }

  /**
   * Get the number of registered units.
   */
  get size(): number {
    return this.units.size;
  }
}

/**
 * Singleton unit registry instance.
 * Import this to register units or look up definitions.
 *
 * @example
 * // In a unit definition file:
 * import { unitRegistry } from './registry';
 * unitRegistry.register(squareDefinition);
 *
 * @example
 * // In a UI component:
 * import { unitRegistry } from '@quillty/core';
 * const allUnits = unitRegistry.getAll();
 */
export const unitRegistry = new UnitRegistry();
