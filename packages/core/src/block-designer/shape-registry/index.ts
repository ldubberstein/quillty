/**
 * Unit Registry Module
 *
 * Exports the unit registry singleton and all related types.
 */

export { unitRegistry } from './registry';

export type {
  // Core types
  UnitDefinition,
  UnitConfig,
  IUnitRegistry,

  // Geometry types
  Point,
  Triangle,
  TriangleGroup,

  // Definition types
  PatchDefinition,
  VariantDefinition,
  ThumbnailDefinition,
  SvgPath,

  // Behavior types
  PlacementMode,
  PlacementValidation,
  SpanBehavior,
  UnitCategory,
} from './types';

export { triangleToFlatPoints } from './types';
