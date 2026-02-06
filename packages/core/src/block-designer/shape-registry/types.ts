/**
 * Unit Registry Types
 *
 * Defines the interfaces for registering units in the unit registry.
 * Each unit definition is self-contained with metadata, geometry, and UI info.
 */

import type { z } from 'zod';
import type { FabricRoleId, GridPosition, Span } from '../types';

// =============================================================================
// Geometry Types
// =============================================================================

/** A 2D point */
export interface Point {
  x: number;
  y: number;
}

/** A triangle defined by 3 points, associated with a patch ID for coloring */
export interface Triangle {
  /** Which patch of the unit this triangle belongs to (for color lookup) */
  patchId: string;
  /** The 3 vertices of the triangle */
  points: [Point, Point, Point];
}

/** A group of triangles that make up a unit's geometry */
export type TriangleGroup = Triangle[];

/** Convert a triangle to flat points array for Konva rendering */
export function triangleToFlatPoints(triangle: Triangle): number[] {
  return triangle.points.flatMap((p) => [p.x, p.y]);
}

// =============================================================================
// Unit Configuration (Instance Data)
// =============================================================================

/**
 * Configuration stored per unit instance.
 * This is the data that varies between instances of the same unit type.
 */
export interface UnitConfig {
  /** Variant identifier (e.g., 'nw', 'up') - optional for units without variants */
  variant?: string;
  /** Fabric roles for each patch, keyed by patch ID */
  patchRoles: Record<string, FabricRoleId>;
}

// =============================================================================
// Patch & Variant Definitions
// =============================================================================

/** Definition of a colorable patch within a unit */
export interface PatchDefinition {
  /** Unique identifier for this patch within the unit */
  id: string;
  /** Human-readable name for UI display */
  name: string;
  /** Default fabric role when creating a new instance */
  defaultRole: FabricRoleId;
}

/** Definition of a unit variant (orientation/rotation preset) */
export interface VariantDefinition {
  /** Unique identifier for this variant */
  id: string;
  /** Human-readable label */
  label: string;
  /** Optional Unicode symbol for compact display */
  symbol?: string;
}

// =============================================================================
// Thumbnail Definition
// =============================================================================

/** SVG path for thumbnail rendering */
export interface SvgPath {
  /** SVG polygon points attribute */
  points: string;
  /** Fill color or 'currentColor' for theme-aware coloring */
  fill: string;
}

/** Thumbnail can be an SVG definition or a custom render function */
export type ThumbnailDefinition =
  | {
      type: 'svg';
      /** SVG viewBox attribute */
      viewBox: string;
      /** Array of polygon paths */
      paths: SvgPath[];
    }
  | {
      type: 'render';
      /** Custom render function returning a renderable element (React.ReactNode in web context) */
      render: () => unknown;
    };

// =============================================================================
// Placement Modes
// =============================================================================

/**
 * How the unit is placed on the grid:
 * - single_tap: Click once to place (Square, HST, QST)
 * - two_tap: Click twice to define direction/span (Flying Geese)
 */
export type PlacementMode = 'single_tap' | 'two_tap';

/** Result of placement validation */
export interface PlacementValidation {
  /** Whether placement is valid at this position */
  valid: boolean;
  /** Human-readable reason if invalid */
  reason?: string;
  /** For two_tap mode: valid adjacent cells for second tap */
  validAdjacentCells?: GridPosition[];
}

// =============================================================================
// Span Behavior
// =============================================================================

/**
 * How the unit's span (grid cells occupied) is determined:
 * - fixed: Always the same span
 * - variant_dependent: Span changes based on variant (e.g., Flying Geese direction)
 */
export type SpanBehavior =
  | { type: 'fixed'; span: Span }
  | { type: 'variant_dependent'; getSpan: (variant: string) => Span };

// =============================================================================
// Unit Category
// =============================================================================

/**
 * Unit categories for UI organization in the unit library:
 * - basic: Simple units (Square, HST, QST)
 * - compound: Multi-cell units (Flying Geese)
 * - advanced: Complex units (future)
 */
export type UnitCategory = 'basic' | 'compound' | 'advanced';

// =============================================================================
// Unit Definition Interface
// =============================================================================

/**
 * A UnitDefinition is the single source of truth for a unit type.
 * It contains all metadata, geometry functions, validation, and UI info.
 *
 * To add a new unit to the system:
 * 1. Create a file implementing UnitDefinition
 * 2. Call unitRegistry.register(definition) at module load
 * 3. The unit will automatically appear in the UI
 */
export interface UnitDefinition<TVariant extends string = string> {
  // === Identity ===

  /** Unique identifier for this unit type (e.g., 'hst', 'flying_geese') */
  readonly typeId: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Category for UI organization */
  readonly category: UnitCategory;

  /** Description for tooltips/help text */
  readonly description: string;

  // === Geometry Configuration ===

  /** Default span (grid cells occupied) */
  readonly defaultSpan: Span;

  /** How span is determined (fixed or variant-dependent) */
  readonly spanBehavior: SpanBehavior;

  /** Colorable patches within the unit */
  readonly patches: readonly PatchDefinition[];

  // === Variants (Optional) ===

  /** Available variants/orientations (undefined if no variants) */
  readonly variants?: readonly VariantDefinition[];

  /** Default variant when creating a new instance */
  readonly defaultVariant?: TVariant;

  // === Geometry Functions ===

  /**
   * Generate triangle geometry for rendering.
   * @param config - Unit instance configuration (variant, patchRoles)
   * @param width - Available width in pixels
   * @param height - Available height in pixels
   * @returns Array of triangles with patch IDs for coloring
   */
  getTriangles(config: UnitConfig, width: number, height: number): TriangleGroup;

  /**
   * Get the variant after 90° clockwise rotation.
   * Return undefined if the unit doesn't rotate (e.g., Square).
   */
  rotateVariant?(currentVariant: TVariant): TVariant;

  /**
   * Get the variant after horizontal flip.
   * Return undefined if the unit doesn't flip horizontally.
   */
  flipHorizontalVariant?(currentVariant: TVariant): TVariant;

  /**
   * Get the variant after vertical flip.
   * Return undefined if the unit doesn't flip vertically.
   */
  flipVerticalVariant?(currentVariant: TVariant): TVariant;

  /**
   * For units that rotate by cycling patch colors (like QST),
   * return the new patchRoles after rotation.
   */
  rotatePartRoles?(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId>;

  /**
   * For units that flip by swapping patch colors,
   * return the new patchRoles after horizontal flip.
   */
  flipHorizontalPartRoles?(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId>;

  /**
   * For units that flip by swapping patch colors,
   * return the new patchRoles after vertical flip.
   */
  flipVerticalPartRoles?(currentRoles: Record<string, FabricRoleId>): Record<string, FabricRoleId>;

  // === Validation ===

  /** Zod schema for validating unit config */
  readonly configSchema: z.ZodType<UnitConfig>;

  /**
   * Validate placement at a given position.
   * Used for units with special placement requirements (e.g., Flying Geese needs 2 cells).
   */
  validatePlacement?(
    position: GridPosition,
    gridSize: number,
    isCellOccupied: (pos: GridPosition) => boolean
  ): PlacementValidation;

  // === UI Metadata ===

  /** Thumbnail definition for unit library */
  readonly thumbnail: ThumbnailDefinition;

  /** How the unit is placed (single tap vs two tap) */
  readonly placementMode: PlacementMode;

  /** Whether the unit supports batch placement (shift+click range fill) */
  readonly supportsBatchPlacement: boolean;

  /** Whether this variant should span 2 columns in the unit picker UI */
  readonly wideInPicker?: boolean;
}

// =============================================================================
// Registry Interface
// =============================================================================

/** Interface for the unit registry */
export interface IUnitRegistry {
  /** Register a unit definition */
  register(definition: UnitDefinition): void;

  /** Get a unit definition by type ID */
  get(typeId: string): UnitDefinition | undefined;

  /** Get all registered unit definitions */
  getAll(): UnitDefinition[];

  /** Get units filtered by category */
  getByCategory(category: UnitCategory): UnitDefinition[];

  /** Get all registered type IDs */
  getTypeIds(): string[];

  /** Check if a unit type is registered */
  has(typeId: string): boolean;
}
