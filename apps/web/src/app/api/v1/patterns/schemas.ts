import { z } from 'zod';

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

/** Grid size schema for pattern dimensions */
export const GridSizeSchema = z.object({
  rows: z.number().int().min(2).max(25),
  cols: z.number().int().min(2).max(25),
});

/** Block instance schema for placed blocks in the pattern */
export const BlockInstanceSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  position: z.object({
    row: z.number().int().min(0),
    col: z.number().int().min(0),
  }),
  rotation: z.number().int().min(0).max(270),
  flipHorizontal: z.boolean(),
  flipVertical: z.boolean(),
});

/** Palette role schema */
export const PaletteRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

/** Palette schema */
export const PaletteSchema = z.object({
  roles: z.array(PaletteRoleSchema),
});

export const PatternDesignDataSchema = z.object({
  version: z.literal(1).optional(),
  gridSize: GridSizeSchema,
  blockInstances: z.array(BlockInstanceSchema),
  palette: PaletteSchema,
});

export const CreatePatternInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(2000, 'Description too long').nullable().optional(),
  designData: PatternDesignDataSchema,
  difficulty: DifficultySchema.optional(),
  category: z.string().max(50).nullable().optional(),
  size: z.string().max(50).nullable().optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').nullable().optional(),
});

export const UpdatePatternInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').nullable().optional(),
  designData: PatternDesignDataSchema.optional(),
  difficulty: DifficultySchema.optional(),
  category: z.string().max(50).nullable().optional(),
  size: z.string().max(50).nullable().optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').nullable().optional(),
});

export const PublishPatternInputSchema = z.object({
  type: z.enum(['free', 'premium']),
  priceCents: z.number().int().min(100).max(100000).optional(),
}).refine(
  (data) => data.type === 'free' || (data.type === 'premium' && data.priceCents && data.priceCents >= 100),
  { message: 'Premium patterns require a price of at least $1.00' }
);

export type CreatePatternInput = z.infer<typeof CreatePatternInputSchema>;
export type UpdatePatternInput = z.infer<typeof UpdatePatternInputSchema>;
export type PublishPatternInput = z.infer<typeof PublishPatternInputSchema>;
