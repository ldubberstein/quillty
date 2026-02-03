/**
 * Block Designer Types
 *
 * Shape-centric data model per DATA_MODEL.md
 * MVP shapes: SquareShape, HstShape, FlyingGeeseShape
 * QstShape deferred to post-MVP
 */

// =============================================================================
// Primitive Types
// =============================================================================

/** UUID string for distributed ID generation */
export type UUID = string;

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** Hex color string (e.g., "#FF5733") */
export type HexColor = string;

/** Grid sizes allowed for MVP */
export type GridSize = 2 | 3 | 4;

/** Rotation in degrees (90° increments) */
export type Rotation = 0 | 90 | 180 | 270;

// =============================================================================
// Shape Types
// =============================================================================

/**
 * Shape types for MVP
 * - square: 1×1 solid square
 * - hst: Half-square triangle (2 triangles in 1 cell)
 * - flying_geese: 2:1 ratio rectangle with center + side triangles
 *
 * Note: 'qst' (quarter-square triangle) exists in DATA_MODEL.md but is deferred to post-MVP
 */
export type ShapeType = 'square' | 'hst' | 'flying_geese';

/**
 * HST variants (pre-rotated orientations for shape picker)
 * - nw: ◸ diagonal from top-left to bottom-right, fill top-left triangle
 * - ne: ◹ diagonal from top-right to bottom-left, fill top-right triangle
 * - sw: ◺ diagonal from top-right to bottom-left, fill bottom-left triangle
 * - se: ◿ diagonal from top-left to bottom-right, fill bottom-right triangle
 */
export type HstVariant = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Flying Geese direction (the direction the center triangle points toward)
 */
export type FlyingGeeseDirection = 'up' | 'down' | 'left' | 'right';

// =============================================================================
// Grid & Position
// =============================================================================

/** Position in grid (0-indexed) */
export interface GridPosition {
  row: number;
  col: number;
}

/** How many cells a shape occupies */
export interface Span {
  rows: number;
  cols: number;
}

// =============================================================================
// Fabric & Palette
// =============================================================================

/**
 * Fabric role identifier
 * Standard roles: 'background' | 'feature' | 'accent1' | 'accent2'
 * Can be extended with custom string IDs
 */
export type FabricRoleId = 'background' | 'feature' | 'accent1' | 'accent2' | string;

/** Standard fabric role IDs */
export type StandardFabricRoleId = 'background' | 'feature' | 'accent1' | 'accent2';

/** A fabric role with its assigned color */
export interface FabricRole {
  id: FabricRoleId;
  name: string;
  color: HexColor;
  // Future: texture_url?: string;
}

/** A complete palette (owned by pattern or block for preview) */
export interface Palette {
  roles: FabricRole[];
}

// =============================================================================
// Shape Definitions
// =============================================================================

/** Base shape interface - all shapes extend this */
export interface BaseShape {
  /** Unique ID within block, enables undo/redo */
  id: UUID;
  /** Shape type discriminator */
  type: ShapeType;
  /** Top-left corner position in grid */
  position: GridPosition;
  /** How many cells shape occupies */
  span: Span;
  /** Primary fabric role reference */
  fabricRole: FabricRoleId;
}

/** Square shape - simplest 1×1 shape */
export interface SquareShape extends BaseShape {
  type: 'square';
  span: { rows: 1; cols: 1 };
}

/** Half-square triangle - two triangles in one cell */
export interface HstShape extends BaseShape {
  type: 'hst';
  span: { rows: 1; cols: 1 };
  /** Which corner/orientation the primary triangle fills */
  variant: HstVariant;
  /** Fabric role for the secondary (other) triangle */
  secondaryFabricRole: FabricRoleId;
}

/** Flying Geese - 2:1 ratio spanning 2 cells */
export interface FlyingGeeseShape extends BaseShape {
  type: 'flying_geese';
  /** Either horizontal (1×2) or vertical (2×1) */
  span: { rows: 1; cols: 2 } | { rows: 2; cols: 1 };
  /** Direction the center "goose" triangle points */
  direction: FlyingGeeseDirection;
  /** Fabric role for the side triangles (sky) */
  secondaryFabricRole: FabricRoleId;
}

/** Union type for all MVP shapes */
export type Shape = SquareShape | HstShape | FlyingGeeseShape;

// =============================================================================
// Block
// =============================================================================

/** Block status lifecycle */
export type BlockStatus = 'draft' | 'published';

/** Complete Block entity */
export interface Block {
  /** Unique identifier */
  id: UUID;
  /** Creator's user ID */
  creatorId: UUID;

  /** Fork relationship (null for original blocks) */
  derivedFromBlockId: UUID | null;

  /** Block title/name */
  title: string;
  /** Optional description */
  description: string | null;
  /** Hashtags for discovery */
  hashtags: string[];

  /** Grid configuration (2×2, 3×3, or 4×4) */
  gridSize: GridSize;

  /** Shape-centric content - the core design data */
  shapes: Shape[];

  /** Preview palette for standalone display */
  previewPalette: Palette;

  /** Publishing status */
  status: BlockStatus;
  /** When the block was published (null if draft) */
  publishedAt: Timestamp | null;

  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

// =============================================================================
// Helper Types for Shape Creation
// =============================================================================

/** Input for creating a new SquareShape (without auto-generated fields) */
export interface CreateSquareInput {
  position: GridPosition;
  fabricRole: FabricRoleId;
}

/** Input for creating a new HstShape */
export interface CreateHstInput {
  position: GridPosition;
  variant: HstVariant;
  fabricRole: FabricRoleId;
  secondaryFabricRole: FabricRoleId;
}

/** Input for creating a new FlyingGeeseShape */
export interface CreateFlyingGeeseInput {
  position: GridPosition;
  direction: FlyingGeeseDirection;
  fabricRole: FabricRoleId;
  secondaryFabricRole: FabricRoleId;
}

/** Union of all shape creation inputs */
export type CreateShapeInput = CreateSquareInput | CreateHstInput | CreateFlyingGeeseInput;

// =============================================================================
// Block Designer State Types
// =============================================================================

/** Designer interaction modes */
export type DesignerMode =
  | 'idle'
  | 'placing_shape'
  | 'placing_flying_geese_second'
  | 'paint_mode'
  | 'preview';

/** State for tracking Flying Geese two-tap placement */
export interface FlyingGeesePlacementState {
  firstCellPosition: GridPosition;
  validAdjacentCells: GridPosition[];
}
