import { z } from 'zod';

export type Rotation = 0 | 90 | 180 | 270;

export const PlacedBlockSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  blockId: z.string(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  colorOverrides: z.record(z.string()).optional(),
});

export type PlacedBlock = z.infer<typeof PlacedBlockSchema>;

export const SashingConfigSchema = z.object({
  enabled: z.boolean(),
  width: z.number().positive(), // in inches
  color: z.string(),
});

export type SashingConfig = z.infer<typeof SashingConfigSchema>;

export const BorderConfigSchema = z.object({
  width: z.number().positive(), // in inches
  color: z.string(),
});

export type BorderConfig = z.infer<typeof BorderConfigSchema>;

export const QuiltDesignSchema = z.object({
  columns: z.number().int().min(1).max(20),
  rows: z.number().int().min(1).max(20),
  blockSize: z.number().positive(), // finished block size in inches
  blocks: z.array(PlacedBlockSchema),
  sashing: SashingConfigSchema.nullable(),
  borders: z.array(BorderConfigSchema),
  fabricMapping: z.record(z.string()),
});

export type QuiltDesign = z.infer<typeof QuiltDesignSchema>;
