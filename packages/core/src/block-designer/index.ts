/**
 * Block Designer Module
 *
 * Exports types, schemas, and constants for the Block Designer feature
 */

// Types
export type {
  // Primitives
  UUID,
  Timestamp,
  HexColor,
  GridSize,
  Rotation,
  // Unit types
  UnitType,
  HstVariant,
  FlyingGeeseDirection,
  FlyingGeesePatchId,
  FlyingGeesePatchRoles,
  QstPatchId,
  QstPatchRoles,
  // Grid & position
  GridPosition,
  Span,
  // Fabric & palette
  FabricRoleId,
  StandardFabricRoleId,
  FabricRole,
  Palette,
  // Units
  BaseUnit,
  SquareUnit,
  HstUnit,
  FlyingGeeseUnit,
  QstUnit,
  Unit,
  // Block
  BlockStatus,
  Block,
  // Unit creation inputs
  CreateSquareInput,
  CreateHstInput,
  CreateFlyingGeeseInput,
  CreateQstInput,
  CreateUnitInput,
  // Designer state
  DesignerMode,
  FlyingGeesePlacementState,
  PreviewRotationPreset,
  UnitSelectionType,
} from './types';

// Schemas
export {
  // Primitive schemas
  UUIDSchema,
  TimestampSchema,
  HexColorSchema,
  GridSizeSchema,
  RotationSchema,
  // Unit type schemas
  UnitTypeSchema,
  HstVariantSchema,
  FlyingGeeseDirectionSchema,
  FlyingGeesePatchIdSchema,
  FlyingGeesePatchRolesSchema,
  QstPatchIdSchema,
  QstPatchRolesSchema,
  // Grid & position schemas
  GridPositionSchema,
  SpanSchema,
  // Fabric & palette schemas
  StandardFabricRoleIdSchema,
  FabricRoleIdSchema,
  FabricRoleSchema,
  PaletteSchema,
  // Unit schemas
  SquareUnitSchema,
  HstUnitSchema,
  FlyingGeeseUnitSchema,
  QstUnitSchema,
  UnitSchema,
  // Block schemas
  BlockStatusSchema,
  BlockSchema,
  // Creation input schemas
  CreateSquareInputSchema,
  CreateHstInputSchema,
  CreateFlyingGeeseInputSchema,
  CreateQstInputSchema,
  // Inferred types
  type ValidatedUnit,
  type ValidatedBlock,
  type ValidatedPalette,
  type ValidatedFabricRole,
} from './schemas';

// Constants
export {
  DEFAULT_PALETTE,
  GRID_SIZES,
  MIN_BLOCK_GRID_SIZE,
  MAX_BLOCK_GRID_SIZE,
  DEFAULT_GRID_SIZE,
  HST_VARIANTS,
  FLYING_GEESE_DIRECTIONS,
  MAX_UNDO_HISTORY,
  BLOCK_TITLE_MAX_LENGTH,
  BLOCK_DESCRIPTION_MAX_LENGTH,
  HASHTAG_MAX_LENGTH,
  MIN_TOUCH_TARGET_SIZE,
  UNIT_PICKER_BUTTON_SIZE,
  FABRIC_ROLE_IDS,
  MAX_PALETTE_ROLES,
  MIN_PALETTE_ROLES,
  ADDITIONAL_ROLE_COLORS,
} from './constants';

// Store
export {
  useBlockDesignerStore,
  useBlock,
  useSelectedUnit,
  usePalette,
  useRoleColor,
  useDesignerMode,
  useIsPaintMode,
  useFlyingGeesePlacement,
  useCanUndo,
  useCanRedo,
  useIsPreviewMode,
  usePreviewRotationPreset,
  useSelectedUnitType,
  useHoveredCell,
  useIsPlacingUnit,
  useBlockGridSize,
  useBlockRangeFillAnchor,
  type BlockDesignerStore,
} from './store';

// Geometry
export {
  getHstTriangles,
  triangleToFlatPoints,
  HST_VARIANT_INFO,
  getFlyingGeeseTriangles,
  FLYING_GEESE_DIRECTION_INFO,
  getQstTriangles,
  type Point,
  type Triangle,
  type HstTriangles,
  type FlyingGeeseTriangles,
  type QstTriangles,
} from './geometry';

// Persistence
export {
  serializeBlockForDb,
  deserializeBlockFromDb,
  extractHashtags,
  validateBlockForPublish,
  migrateUnits,
  type BlockDesignData,
  type BlockPersistData,
} from './persistence';

// Unit Registry (scalable unit system)
export {
  unitRegistry,
  triangleToFlatPoints as registryTriangleToFlatPoints,
  type UnitDefinition,
  type UnitConfig,
  type IUnitRegistry,
  type Point as RegistryPoint,
  type Triangle as RegistryTriangle,
  type TriangleGroup,
  type PatchDefinition,
  type VariantDefinition,
  type ThumbnailDefinition,
  type SvgPath,
  type PlacementMode,
  type PlacementValidation,
  type SpanBehavior,
  type UnitCategory,
} from './shape-registry';

// Unit Definitions (import to trigger registration)
import './shapes';

// Export individual unit definitions for direct access
export {
  squareDefinition,
  hstDefinition,
  qstDefinition,
  flyingGeeseDefinition,
} from './shapes';

// Unit Bridge (registry-driven dispatch for store and renderers)
export {
  toUnitConfig,
  getAllRoleIds,
  unitUsesRole,
  applyRotation,
  applyFlipHorizontal,
  applyFlipVertical,
  assignPatchRole,
  replaceRole,
  getUnitTrianglesWithColors,
  getSpanForUnit,
} from './unit-bridge';
