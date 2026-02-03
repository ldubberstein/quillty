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
  // Shape types
  ShapeType,
  HstVariant,
  FlyingGeeseDirection,
  // Grid & position
  GridPosition,
  Span,
  // Fabric & palette
  FabricRoleId,
  StandardFabricRoleId,
  FabricRole,
  Palette,
  // Shapes
  BaseShape,
  SquareShape,
  HstShape,
  FlyingGeeseShape,
  Shape,
  // Block
  BlockStatus,
  Block,
  // Shape creation inputs
  CreateSquareInput,
  CreateHstInput,
  CreateFlyingGeeseInput,
  CreateShapeInput,
  // Designer state
  DesignerMode,
  FlyingGeesePlacementState,
} from './types';

// Schemas
export {
  // Primitive schemas
  UUIDSchema,
  TimestampSchema,
  HexColorSchema,
  GridSizeSchema,
  RotationSchema,
  // Shape type schemas
  ShapeTypeSchema,
  HstVariantSchema,
  FlyingGeeseDirectionSchema,
  // Grid & position schemas
  GridPositionSchema,
  SpanSchema,
  // Fabric & palette schemas
  StandardFabricRoleIdSchema,
  FabricRoleIdSchema,
  FabricRoleSchema,
  PaletteSchema,
  // Shape schemas
  SquareShapeSchema,
  HstShapeSchema,
  FlyingGeeseShapeSchema,
  ShapeSchema,
  // Block schemas
  BlockStatusSchema,
  BlockSchema,
  // Creation input schemas
  CreateSquareInputSchema,
  CreateHstInputSchema,
  CreateFlyingGeeseInputSchema,
  // Inferred types
  type ValidatedShape,
  type ValidatedBlock,
  type ValidatedPalette,
  type ValidatedFabricRole,
} from './schemas';

// Constants
export {
  DEFAULT_PALETTE,
  GRID_SIZES,
  DEFAULT_GRID_SIZE,
  HST_VARIANTS,
  FLYING_GEESE_DIRECTIONS,
  MAX_UNDO_HISTORY,
  BLOCK_TITLE_MAX_LENGTH,
  BLOCK_DESCRIPTION_MAX_LENGTH,
  HASHTAG_MAX_LENGTH,
  MIN_TOUCH_TARGET_SIZE,
  SHAPE_PICKER_BUTTON_SIZE,
  FABRIC_ROLE_IDS,
} from './constants';

// Store
export {
  useBlockDesignerStore,
  useBlock,
  useSelectedShape,
  usePalette,
  useRoleColor,
  useDesignerMode,
  useIsPaintMode,
  useFlyingGeesePlacement,
  type BlockDesignerStore,
} from './store';

// Geometry
export {
  getHstTriangles,
  triangleToFlatPoints,
  HST_VARIANT_INFO,
  type Point,
  type Triangle,
  type HstTriangles,
} from './geometry';

// Legacy class (deprecated - use useBlockDesignerStore instead)
// export { BlockDesigner } from './BlockDesigner';
