import { z } from 'zod';
import {
  GridSizeSchema,
  ShapeSchema,
  PaletteSchema,
} from '@quillty/core/block-designer';

/**
 * API Input Schemas for Block Endpoints
 */

/** Difficulty level schema */
export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

/** Block design data schema - what gets stored in design_data JSON column */
export const BlockDesignDataSchema = z.object({
  version: z.literal(1).optional(), // Version field for future migrations
  shapes: z.array(ShapeSchema),
  previewPalette: PaletteSchema, // Named previewPalette in the persistence layer
});

/** Create block input schema */
export const CreateBlockInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  gridSize: GridSizeSchema,
  designData: BlockDesignDataSchema,
  difficulty: DifficultySchema.optional().default('beginner'),
  thumbnailUrl: z.string().url().optional().nullable(),
});

/** Update block input schema - all fields optional */
export const UpdateBlockInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  gridSize: GridSizeSchema.optional(),
  designData: BlockDesignDataSchema.optional(),
  difficulty: DifficultySchema.optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

/** Type exports */
export type CreateBlockInput = z.infer<typeof CreateBlockInputSchema>;
export type UpdateBlockInput = z.infer<typeof UpdateBlockInputSchema>;
export type BlockDesignData = z.infer<typeof BlockDesignDataSchema>;
