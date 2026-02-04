/**
 * Block Designer Persistence Utilities
 *
 * Handles conversion between the in-memory Block type used by the designer
 * and the database format for Supabase persistence.
 */

import type { Block, Shape, Palette, GridSize } from './types';

/**
 * Design data structure stored in the database's JSONB column.
 * This is a serializable version of the block's design content.
 */
export interface BlockDesignData {
  /** Version of the design data format (for future migrations) */
  version: 1;
  /** The shapes that make up the block design */
  shapes: Shape[];
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
  /** Number of pieces/shapes in the block */
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
    shapes: block.shapes,
    previewPalette: block.previewPalette,
  };

  return {
    name: block.title || 'Untitled Block',
    description: block.description,
    gridSize: block.gridSize,
    designData,
    pieceCount: block.shapes.length,
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

  // Extract shapes and palette from design data
  const shapes: Shape[] = designData?.shapes ?? [];
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
    shapes,
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
 *
 * @param block - The block to validate
 * @returns Object with valid flag and optional error message
 */
export function validateBlockForPublish(block: Block): {
  valid: boolean;
  error?: string;
} {
  if (block.shapes.length === 0) {
    return {
      valid: false,
      error: 'Add at least one shape before publishing',
    };
  }

  return { valid: true };
}
