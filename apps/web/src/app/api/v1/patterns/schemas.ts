import { z } from 'zod';

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const PatternDesignDataSchema = z.object({
  version: z.literal(1).optional(),
  blocks: z.array(z.unknown()),
  layout: z.unknown().optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
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
