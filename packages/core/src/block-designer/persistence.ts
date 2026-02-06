/**
 * Block Designer Persistence Utilities
 *
 * Handles conversion between the in-memory Block type used by the designer
 * and the database format for Supabase persistence.
 */

import type { Block, Unit, Palette, GridSize } from './types';

/**
 * Migrate a unit from legacy database format.
 * Handles the rename of partFabricRoles → patchFabricRoles for FlyingGeese and QST units.
 */
function migrateUnit(unit: Record<string, unknown>): Unit {
  if ('partFabricRoles' in unit && !('patchFabricRoles' in unit)) {
    const { partFabricRoles, ...rest } = unit;
    return { ...rest, patchFabricRoles: partFabricRoles } as unknown as Unit;
  }
  return unit as unknown as Unit;
}

/**
 * Migrate an array of units from legacy database format.
 * Applies per-unit property renames (partFabricRoles → patchFabricRoles).
 */
export function migrateUnits(units: unknown[]): Unit[] {
  return units.map((u) => migrateUnit(u as Record<string, unknown>));
}

/**
 * Design data structure stored in the database's JSONB column.
 * This is a serializable version of the block's design content.
 */
export interface BlockDesignData {
  /** Version of the design data format (for future migrations) */
  version: 1;
  /** The units that make up the block design */
  units: Unit[];
  /** The preview palette with fabric role colors */
  previewPalette: Palette;
}

/**
 * Data required to create or update a block in the database.
 */
export interface BlockPersistData {
  /** Block name/title */
  name: string;
  /** Optional description */
  description?: string | null;
  /** Grid size (2, 3, or 4) */
  gridSize: GridSize;
  /** Serialized design data */
  designData: BlockDesignData;
  /** Number of pieces/units in the block */
  pieceCount: number;
}

/**
 * Serializes a Block from the designer store to the database format.
 *
 * @param block - The in-memory Block from the designer store
 * @returns Data ready for database insertion/update
 */
export function serializeBlockForDb(block: Block): BlockPersistData {
  const designData: BlockDesignData = {
    version: 1,
    units: block.units,
    previewPalette: block.previewPalette,
  };

  return {
    name: block.title || 'Untitled Block',
    description: block.description,
    gridSize: block.gridSize,
    designData,
    pieceCount: block.units.length,
  };
}

/**
 * Deserializes a database block record into the designer Block format.
 *
 * @param dbBlock - The database block record
 * @returns A Block object suitable for the designer store
 */
export function deserializeBlockFromDb(dbBlock: {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  grid_size: number;
  design_data: unknown;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
}): Block {
  // Parse design data (handle both old and new formats)
  const designData = dbBlock.design_data as BlockDesignData | null;

  // Extract units and palette from design data
  // Support legacy format where units were stored as "shapes"
  const rawUnits = designData?.units ?? (designData as any)?.shapes ?? [];
  const units: Unit[] = migrateUnits(rawUnits);
  const previewPalette: Palette = designData?.previewPalette ?? {
    roles: [
      { id: 'background', name: 'Background', color: '#FFFFFF' },
      { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1', name: 'Accent 1', color: '#8B4513' },
      { id: 'accent2', name: 'Accent 2', color: '#DAA520' },
    ],
  };

  return {
    id: dbBlock.id,
    creatorId: dbBlock.creator_id,
    derivedFromBlockId: null,
    title: dbBlock.name,
    description: dbBlock.description,
    hashtags: [],
    gridSize: dbBlock.grid_size as GridSize,
    units,
    previewPalette,
    status: dbBlock.status,
    publishedAt: dbBlock.published_at,
    createdAt: dbBlock.created_at,
    updatedAt: dbBlock.updated_at,
  };
}

/**
 * Extracts hashtags from a description string.
 * Hashtags are words starting with # followed by alphanumeric characters.
 *
 * @param description - The description text to parse
 * @returns Array of hashtag strings (without the # prefix)
 */
export function extractHashtags(description: string): string[] {
  if (!description) return [];

  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = description.matchAll(hashtagRegex);
  return Array.from(matches, (m) => m[1].toLowerCase());
}

/**
 * Validates that a block has enough content to be published.
 * All grid cells must have a unit covering them.
 *
 * @param block - The block to validate
 * @returns Object with valid flag and optional error message
 */
export function validateBlockForPublish(block: Block): {
  valid: boolean;
  error?: string;
} {
  if (block.units.length === 0) {
    return {
      valid: false,
      error: 'Add at least one unit before publishing',
    };
  }

  // Check that all grid cells are covered by units
  const gridSize = block.gridSize;
  const totalCells = gridSize * gridSize;

  // Create a set to track covered cells
  const coveredCells = new Set<string>();

  // Mark all cells covered by each unit
  for (const unit of block.units) {
    const { row: startRow, col: startCol } = unit.position;
    const { rows: spanRows, cols: spanCols } = unit.span;

    for (let r = startRow; r < startRow + spanRows; r++) {
      for (let c = startCol; c < startCol + spanCols; c++) {
        coveredCells.add(`${r},${c}`);
      }
    }
  }

  const emptyCells = totalCells - coveredCells.size;
  if (emptyCells > 0) {
    return {
      valid: false,
      error: `${emptyCells} empty cell${emptyCells > 1 ? 's' : ''} remaining. Fill all cells to publish.`,
    };
  }

  return { valid: true };
}
