/**
 * Pattern Designer Zod Schemas
 *
 * Runtime validation schemas for pattern designer types
 */

import { z } from 'zod';
import {
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_GRID_ROWS,
  DEFAULT_GRID_COLS,
  DEFAULT_BLOCK_SIZE_INCHES,
} from './types';

// =============================================================================
// Primitive Schemas
// =============================================================================

/** UUID schema */
export const UUIDSchema = z.string().uuid();

/** Rotation schema (0, 90, 180, or 270 degrees) */
export const RotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);

/** Hex color schema */
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color');

/** Pattern status schema */
export const PatternStatusSchema = z.enum(['draft', 'published']);

/** Pattern difficulty schema */
export const PatternDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

/** Pattern category schema */
export const PatternCategorySchema = z.enum(['traditional', 'modern', 'art', 'seasonal', 'other']);

// =============================================================================
// Grid & Position Schemas
// =============================================================================

/** Grid position schema */
export const GridPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

/** Quilt grid size schema */
export const QuiltGridSizeSchema = z.object({
  rows: z.number().int().min(MIN_GRID_SIZE).max(MAX_GRID_SIZE),
  cols: z.number().int().min(MIN_GRID_SIZE).max(MAX_GRID_SIZE),
});

/** Physical size schema */
export const PhysicalSizeSchema = z.object({
  widthInches: z.number().positive(),
  heightInches: z.number().positive(),
  blockSizeInches: z.number().positive(),
});

// =============================================================================
// Fabric & Palette Schemas
// =============================================================================

/** Fabric role ID schema */
export const FabricRoleIdSchema = z.string().min(1);

/** Fabric role schema */
export const FabricRoleSchema = z.object({
  id: FabricRoleIdSchema,
  name: z.string().min(1),
  color: HexColorSchema,
});

/** Palette schema */
export const PaletteSchema = z.object({
  roles: z.array(FabricRoleSchema).min(1),
});

/**
 * Palette overrides schema (sparse record of roleId → hex color)
 * Used for per-block-instance color customization
 */
export const PaletteOverridesSchema = z.record(FabricRoleIdSchema, HexColorSchema);

// =============================================================================
// Block Instance Schemas
// =============================================================================

/** Block instance schema */
export const BlockInstanceSchema = z.object({
  id: UUIDSchema,
  blockId: UUIDSchema,
  position: GridPositionSchema,
  rotation: RotationSchema,
  flipHorizontal: z.boolean(),
  flipVertical: z.boolean(),
  paletteOverrides: PaletteOverridesSchema.optional(),
});

/** Create block instance input schema */
export const CreateBlockInstanceInputSchema = z.object({
  blockId: UUIDSchema,
  position: GridPositionSchema,
  rotation: RotationSchema.optional().default(0),
  flipHorizontal: z.boolean().optional().default(false),
  flipVertical: z.boolean().optional().default(false),
  paletteOverrides: PaletteOverridesSchema.optional(),
});

/** Block instance update schema */
export const BlockInstanceUpdateSchema = z.object({
  rotation: RotationSchema.optional(),
  flipHorizontal: z.boolean().optional(),
  flipVertical: z.boolean().optional(),
  paletteOverrides: PaletteOverridesSchema.nullable().optional(),
});

// =============================================================================
// Pattern Schemas
// =============================================================================

/** Full pattern schema */
export const PatternSchema = z.object({
  id: UUIDSchema,
  creatorId: UUIDSchema,
  title: z.string().min(1).max(100),
  description: z.string().max(2000).nullable(),
  hashtags: z.array(z.string()).max(10),
  difficulty: PatternDifficultySchema,
  category: PatternCategorySchema.nullable(),
  gridSize: QuiltGridSizeSchema,
  physicalSize: PhysicalSizeSchema,
  palette: PaletteSchema,
  blockInstances: z.array(BlockInstanceSchema),
  status: PatternStatusSchema,
  isPremium: z.boolean(),
  priceCents: z.number().int().min(0).nullable(),
  publishedAt: z.string().datetime().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Create pattern input schema (for API) */
export const CreatePatternInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  difficulty: PatternDifficultySchema.optional().default('beginner'),
  category: PatternCategorySchema.optional().nullable(),
  gridSize: QuiltGridSizeSchema.optional().default({
    rows: DEFAULT_GRID_ROWS,
    cols: DEFAULT_GRID_COLS,
  }),
  blockSizeInches: z.number().positive().optional().default(DEFAULT_BLOCK_SIZE_INCHES),
  designData: z.record(z.unknown()).optional(),
});

/** Update pattern input schema (for API) */
export const UpdatePatternInputSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  difficulty: PatternDifficultySchema.optional(),
  category: PatternCategorySchema.nullable().optional(),
  gridSize: QuiltGridSizeSchema.optional(),
  physicalSize: PhysicalSizeSchema.optional(),
  palette: PaletteSchema.optional(),
  blockInstances: z.array(BlockInstanceSchema).optional(),
  designData: z.record(z.unknown()).optional(),
});

/** Publish pattern input schema (for API) */
export const PublishPatternInputSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  isPremium: z.boolean().optional().default(false),
  priceCents: z.number().int().min(99).nullable().optional(), // Minimum $0.99
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type CreatePatternInput = z.infer<typeof CreatePatternInputSchema>;
export type UpdatePatternInput = z.infer<typeof UpdatePatternInputSchema>;
export type PublishPatternInput = z.infer<typeof PublishPatternInputSchema>;
