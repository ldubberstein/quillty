/**
 * Block Designer Constants
 *
 * Default values and constants for the Block Designer
 */

import type { Palette, GridSize, HstVariant, FlyingGeeseDirection } from './types';

// =============================================================================
// Default Palette
// =============================================================================

/**
 * Default palette for new blocks and patterns
 * Per DATA_MODEL.md - 4 standard roles with default colors
 * Colors chosen based on popular quilting fabric combinations
 */
export const DEFAULT_PALETTE: Palette = {
  roles: [
    { id: 'background', name: 'Background', color: '#F5F5DC' }, // Beige/cream
    { id: 'feature', name: 'Feature', color: '#2C3E50' },       // Navy blue
    { id: 'accent1', name: 'Accent 1', color: '#8B4513' },      // Saddle brown
    { id: 'accent2', name: 'Accent 2', color: '#DAA520' },      // Goldenrod
  ],
};

// =============================================================================
// Grid Constants
// =============================================================================

/** Available grid sizes for block design */
export const GRID_SIZES: GridSize[] = [2, 3, 4, 5, 6, 7, 8];

/** Minimum block grid size */
export const MIN_BLOCK_GRID_SIZE: GridSize = 2;

/** Maximum block grid size */
export const MAX_BLOCK_GRID_SIZE: GridSize = 8;

/** Default grid size for new blocks */
export const DEFAULT_GRID_SIZE: GridSize = 3;

// =============================================================================
// Shape Constants
// =============================================================================

/** All HST variants with their visual representations */
export const HST_VARIANTS: readonly { id: HstVariant; symbol: string; label: string }[] = [
  { id: 'nw', symbol: '◸', label: 'Top-Left' },
  { id: 'ne', symbol: '◹', label: 'Top-Right' },
  { id: 'sw', symbol: '◺', label: 'Bottom-Left' },
  { id: 'se', symbol: '◿', label: 'Bottom-Right' },
] as const;

/** All Flying Geese directions */
export const FLYING_GEESE_DIRECTIONS: readonly {
  id: FlyingGeeseDirection;
  label: string;
}[] = [
  { id: 'up', label: 'Points Up' },
  { id: 'down', label: 'Points Down' },
  { id: 'left', label: 'Points Left' },
  { id: 'right', label: 'Points Right' },
] as const;

// =============================================================================
// Validation Constants
// =============================================================================

/** Maximum number of undo operations to store */
export const MAX_UNDO_HISTORY = 100;

/** Block title constraints */
export const BLOCK_TITLE_MAX_LENGTH = 100;

/** Block description constraints */
export const BLOCK_DESCRIPTION_MAX_LENGTH = 500;

/** Hashtag constraints */
export const HASHTAG_MAX_LENGTH = 50;

// =============================================================================
// UI Constants (for reference, actual values in UI packages)
// =============================================================================

/** Minimum touch target size in pixels (per PRD accessibility requirements) */
export const MIN_TOUCH_TARGET_SIZE = 48;

/** Shape picker button size in pixels */
export const SHAPE_PICKER_BUTTON_SIZE = 56;

// =============================================================================
// Default Fabric Role IDs
// =============================================================================

/** Standard fabric role IDs */
export const FABRIC_ROLE_IDS = {
  BACKGROUND: 'background',
  FEATURE: 'feature',
  ACCENT1: 'accent1',
  ACCENT2: 'accent2',
} as const;
