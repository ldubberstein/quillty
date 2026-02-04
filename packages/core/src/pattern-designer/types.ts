/**
 * Pattern Designer Types
 *
 * Types for the Pattern Designer matching DATA_MODEL.md §3.6
 * Patterns own a palette and contain block instances (references to blocks with transforms)
 */

import type { UUID, Timestamp, Palette, GridPosition, Block } from '../block-designer/types';

// Re-export commonly used types from block-designer
export type { UUID, Timestamp, Palette, GridPosition, FabricRole, FabricRoleId, HexColor } from '../block-designer/types';

// =============================================================================
// Pattern Status & Grid
// =============================================================================

/** Pattern status lifecycle */
export type PatternStatus = 'draft' | 'published';

/** Quilt size in block units */
export interface QuiltGridSize {
  rows: number;  // 2-25 for MVP
  cols: number;  // 2-25 for MVP
}

/** Physical finished size (for fabric calculations) */
export interface PhysicalSize {
  widthInches: number;
  heightInches: number;
  blockSizeInches: number;  // e.g., 12" blocks
}

/** Difficulty level for patterns */
export type PatternDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Pattern category for discovery */
export type PatternCategory = 'traditional' | 'modern' | 'art' | 'seasonal' | 'other';

// =============================================================================
// Block Instance (placed block in pattern)
// =============================================================================

/** Rotation in degrees (90° increments) */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * A block placed in a pattern at a specific position with transforms
 * References a Block by ID and stores instance-specific transforms
 */
export interface BlockInstance {
  /** Unique ID within pattern */
  id: UUID;
  /** Reference to the block design */
  blockId: UUID;
  /** Position in the quilt grid (0-indexed) */
  position: GridPosition;
  /** Rotation of this instance (0, 90, 180, or 270 degrees) */
  rotation: Rotation;
  /** Whether this instance is flipped horizontally */
  flipHorizontal: boolean;
  /** Whether this instance is flipped vertically */
  flipVertical: boolean;
}

// =============================================================================
// Pattern
// =============================================================================

/** Complete Pattern entity */
export interface Pattern {
  /** Unique identifier */
  id: UUID;
  /** Creator's user ID */
  creatorId: UUID;

  /** Pattern title/name */
  title: string;
  /** Optional description */
  description: string | null;
  /** Hashtags for discovery */
  hashtags: string[];
  /** Difficulty level */
  difficulty: PatternDifficulty;
  /** Category for filtering */
  category: PatternCategory | null;

  /** Grid configuration (rows × columns of blocks) */
  gridSize: QuiltGridSize;
  /** Physical dimensions for fabric calculations */
  physicalSize: PhysicalSize;

  /** The pattern owns the palette - all blocks render with these colors */
  palette: Palette;

  /** Block placements (references to blocks with transforms) */
  blockInstances: BlockInstance[];

  /** Publishing status */
  status: PatternStatus;
  /** Whether this is a premium (paid) pattern */
  isPremium: boolean;
  /** Price in cents (null = free) */
  priceCents: number | null;

  /** When the pattern was published (null if draft) */
  publishedAt: Timestamp | null;

  /** Thumbnail URL (generated on publish) */
  thumbnailUrl: string | null;

  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

// =============================================================================
// Helper Types
// =============================================================================

/** Input for creating a new BlockInstance */
export interface CreateBlockInstanceInput {
  blockId: UUID;
  position: GridPosition;
  rotation?: Rotation;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

/** Updates allowed on a BlockInstance */
export interface BlockInstanceUpdate {
  rotation?: Rotation;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

/** Block with its design data (for rendering in pattern) */
export interface BlockWithDesign extends Block {
  // Block already has shapes and previewPalette
  // This type is for when we need the full block data for rendering
}

// =============================================================================
// Pattern Designer State Types
// =============================================================================

/** Designer interaction modes */
export type PatternDesignerMode =
  | 'idle'           // Default mode, no active action
  | 'placing_block'  // A library block is selected and ready to place
  | 'selecting'      // Selecting placed blocks on canvas
  | 'preview';       // Preview mode (future: full quilt visualization)

/** Grid resize direction */
export type ResizeDirection = 'add_row' | 'remove_row' | 'add_column' | 'remove_column';

// =============================================================================
// Constants
// =============================================================================

/** Minimum grid size (rows/cols) */
export const MIN_GRID_SIZE = 2;

/** Maximum grid size (rows/cols) - performance warning above 15 */
export const MAX_GRID_SIZE = 25;

/** Warning threshold for grid size */
export const GRID_SIZE_WARNING_THRESHOLD = 15;

/** Default block size in inches */
export const DEFAULT_BLOCK_SIZE_INCHES = 12;

/** Default grid dimensions */
export const DEFAULT_GRID_ROWS = 4;
export const DEFAULT_GRID_COLS = 4;
