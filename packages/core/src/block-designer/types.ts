/**
 * Block Designer Types
 *
 * Unit-centric data model per DATA_MODEL.md
 * Units: SquareUnit, HstUnit, FlyingGeeseUnit, QstUnit
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

/** Grid sizes allowed for block design (2×2 through 9×9) */
export type GridSize = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Rotation in degrees (90° increments) */
export type Rotation = 0 | 90 | 180 | 270;

// =============================================================================
// Unit Types
// =============================================================================

/**
 * Unit types
 * - square: 1×1 solid square
 * - hst: Half-square triangle (2 triangles in 1 cell)
 * - flying_geese: 2:1 ratio rectangle with center + side triangles
 * - qst: Quarter-square triangle (4 triangles in 1 cell)
 */
export type UnitType = 'square' | 'hst' | 'flying_geese' | 'qst';

/**
 * HST variants (pre-rotated orientations for unit picker)
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

/**
 * QST patch names for fabric role assignment
 * Named by compass direction from center
 */
export type QstPatchId = 'top' | 'right' | 'bottom' | 'left';

/** Fabric roles for each patch of a QST unit */
export interface QstPatchRoles {
  /** Top triangle */
  top: FabricRoleId;
  /** Right triangle */
  right: FabricRoleId;
  /** Bottom triangle */
  bottom: FabricRoleId;
  /** Left triangle */
  left: FabricRoleId;
}

// =============================================================================
// Grid & Position
// =============================================================================

/** Position in grid (0-indexed) */
export interface GridPosition {
  row: number;
  col: number;
}

/** How many cells a unit occupies */
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
  /** True if this color was auto-added from a block instance override */
  isVariantColor?: boolean;
  // Future: texture_url?: string;
}

/** A complete palette (owned by pattern or block for preview) */
export interface Palette {
  roles: FabricRole[];
}

// =============================================================================
// Unit Definitions
// =============================================================================

/** Base unit interface - all units extend this */
export interface BaseUnit {
  /** Unique ID within block, enables undo/redo */
  id: UUID;
  /** Unit type discriminator */
  type: UnitType;
  /** Top-left corner position in grid */
  position: GridPosition;
  /** How many cells unit occupies */
  span: Span;
  /** Primary fabric role reference */
  fabricRole: FabricRoleId;
}

/** Square unit - simplest 1×1 unit */
export interface SquareUnit extends BaseUnit {
  type: 'square';
  span: { rows: 1; cols: 1 };
}

/** Half-square triangle - two triangles in one cell */
export interface HstUnit extends BaseUnit {
  type: 'hst';
  span: { rows: 1; cols: 1 };
  /** Which corner/orientation the primary triangle fills */
  variant: HstVariant;
  /** Fabric role for the secondary (other) triangle */
  secondaryFabricRole: FabricRoleId;
}

/**
 * Flying Geese patch names for fabric role assignment
 * - goose: Center triangle (the "goose")
 * - sky1: First side triangle
 * - sky2: Second side triangle
 */
export type FlyingGeesePatchId = 'goose' | 'sky1' | 'sky2';

/** Fabric roles for each patch of a Flying Geese unit */
export interface FlyingGeesePatchRoles {
  /** Center triangle (the "goose") */
  goose: FabricRoleId;
  /** First side triangle */
  sky1: FabricRoleId;
  /** Second side triangle */
  sky2: FabricRoleId;
}

/** Flying Geese - 2:1 ratio spanning 2 cells with 3 independently colorable patches */
export interface FlyingGeeseUnit extends Omit<BaseUnit, 'fabricRole'> {
  type: 'flying_geese';
  /** Either horizontal (1×2) or vertical (2×1) */
  span: { rows: 1; cols: 2 } | { rows: 2; cols: 1 };
  /** Direction the center "goose" triangle points */
  direction: FlyingGeeseDirection;
  /** Fabric roles for each patch - enables independent coloring of all 3 triangles */
  patchFabricRoles: FlyingGeesePatchRoles;
}

/**
 * Quarter-Square Triangle - 4 triangles in one cell with independently colorable patches
 *
 * Note: QST has no variants - the unit geometry is always the same (4 triangles meeting at center).
 * Visual variety comes from coloring the 4 triangles differently. The unit has 2-fold rotational
 * symmetry, so rotation is achieved by cycling the patch colors.
 */
export interface QstUnit extends Omit<BaseUnit, 'fabricRole'> {
  type: 'qst';
  span: { rows: 1; cols: 1 };
  /** Fabric roles for each of the 4 triangles */
  patchFabricRoles: QstPatchRoles;
}

/** Union type for all units */
export type Unit = SquareUnit | HstUnit | FlyingGeeseUnit | QstUnit;

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

  /** Unit-centric content - the core design data */
  units: Unit[];

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
// Helper Types for Unit Creation
// =============================================================================

/** Input for creating a new SquareUnit (without auto-generated fields) */
export interface CreateSquareInput {
  position: GridPosition;
  fabricRole: FabricRoleId;
}

/** Input for creating a new HstUnit */
export interface CreateHstInput {
  position: GridPosition;
  variant: HstVariant;
  fabricRole: FabricRoleId;
  secondaryFabricRole: FabricRoleId;
}

/** Input for creating a new FlyingGeeseUnit */
export interface CreateFlyingGeeseInput {
  position: GridPosition;
  direction: FlyingGeeseDirection;
  /** Fabric roles for each patch (goose, sky1, sky2) */
  patchFabricRoles: FlyingGeesePatchRoles;
}

/** Input for creating a new QstUnit */
export interface CreateQstInput {
  position: GridPosition;
  /** Fabric roles for each patch (top, right, bottom, left) */
  patchFabricRoles: QstPatchRoles;
}

/** Union of all unit creation inputs */
export type CreateUnitInput = CreateSquareInput | CreateHstInput | CreateFlyingGeeseInput | CreateQstInput;

// =============================================================================
// Block Designer State Types
// =============================================================================

/** Designer interaction modes */
export type DesignerMode =
  | 'idle'
  | 'placing_unit'
  | 'placing_flying_geese_second'
  | 'paint_mode'
  | 'preview';

/**
 * Preview rotation presets for 3×3 block repeat visualization
 * - all_same: All 9 blocks at 0° rotation
 * - alternating: Checkerboard pattern (0°, 90°, 0°, 90°...)
 * - pinwheel: 4-corner rotation pattern (0°, 90°, 180°, 270° around center)
 * - random: Random rotation for each block instance
 */
export type PreviewRotationPreset = 'all_same' | 'alternating' | 'pinwheel' | 'random';

/** State for tracking Flying Geese two-tap placement */
export interface FlyingGeesePlacementState {
  firstCellPosition: GridPosition;
  validAdjacentCells: GridPosition[];
}

// =============================================================================
// Unit Selection (Library)
// =============================================================================

/**
 * Unit selection from library for placement
 * Used when user selects a unit from the ShapeLibraryPanel
 */
export type UnitSelectionType =
  | { type: 'square' }
  | { type: 'hst'; variant: HstVariant }
  | { type: 'flying_geese' }
  | { type: 'qst' };
