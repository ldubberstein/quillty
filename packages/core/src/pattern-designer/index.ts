/**
 * Pattern Designer Module
 *
 * Exports types, schemas, and store for the Pattern Designer
 */

// Types (pattern-specific only - common types like UUID, Rotation exported from block-designer)
export type {
  PatternStatus,
  QuiltGridSize,
  PhysicalSize,
  PatternDifficulty,
  PatternCategory,
  BlockInstance,
  Pattern,
  CreateBlockInstanceInput,
  BlockInstanceUpdate,
  BlockWithDesign,
  PatternDesignerMode,
  ResizeDirection,
} from './types';

// Constants
export {
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  GRID_SIZE_WARNING_THRESHOLD,
  DEFAULT_BLOCK_SIZE_INCHES,
  DEFAULT_GRID_ROWS,
  DEFAULT_GRID_COLS,
} from './types';

// Schemas (pattern-specific only - common schemas like UUIDSchema, RotationSchema exported from block-designer)
export {
  PatternStatusSchema,
  PatternDifficultySchema,
  PatternCategorySchema,
  QuiltGridSizeSchema,
  PhysicalSizeSchema,
  BlockInstanceSchema,
  CreateBlockInstanceInputSchema,
  BlockInstanceUpdateSchema,
  PatternSchema,
  CreatePatternInputSchema,
  UpdatePatternInputSchema,
  PublishPatternInputSchema,
} from './schemas';

export type {
  CreatePatternInput,
  UpdatePatternInput,
  PublishPatternInput,
} from './schemas';

// Store
export {
  usePatternDesignerStore,
  // Selector hooks
  usePattern,
  useGridSize,
  usePatternPalette,
  useBlockInstances,
  useSelectedBlockInstance,
  useSelectedLibraryBlockId,
  usePatternDesignerMode,
  useIsDirty,
  useIsGridLarge,
  usePatternRoleColor,
  useCanAddRow,
  useCanRemoveRow,
  useCanAddColumn,
  useCanRemoveColumn,
  usePreviewingGridResize,
  useGridResizePosition,
  useEmptySlotCount,
  useCanPublish,
  usePatternId,
} from './store';

export type { PatternDesignerStore } from './store';
