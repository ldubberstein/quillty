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

/** Maximum number of fabric roles in a palette */
export const MAX_PALETTE_ROLES = 12;

/** Minimum number of fabric roles in a palette */
export const MIN_PALETTE_ROLES = 1;

/**
 * Default colors for additional fabric roles (beyond the 4 defaults)
 * Colors chosen to complement common quilting fabric palettes
 */
export const ADDITIONAL_ROLE_COLORS: readonly string[] = [
  '#9B2335', // Deep red
  '#5B5EA6', // Periwinkle
  '#9B7653', // Mocha
  '#88B04B', // Greenery
  '#FF6F61', // Coral
  '#6B5B95', // Purple
  '#DD4124', // Tangerine
  '#009B77', // Emerald
] as const;

// =============================================================================
// Grid Constants
// =============================================================================

/** Available grid sizes for block design */
export const GRID_SIZES: GridSize[] = [2, 3, 4, 5, 6, 7, 8, 9];

/** Minimum block grid size */
export const MIN_BLOCK_GRID_SIZE: GridSize = 2;

/** Maximum block grid size */
export const MAX_BLOCK_GRID_SIZE: GridSize = 9;

/** Default grid size for new blocks */
export const DEFAULT_GRID_SIZE: GridSize = 3;

// =============================================================================
// Unit Constants
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

/** Unit picker button size in pixels */
export const UNIT_PICKER_BUTTON_SIZE = 56;

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
