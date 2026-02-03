import { z } from 'zod';

export type CellShape = 'square' | 'hst' | 'qst';
export type Rotation = 0 | 90 | 180 | 270;

export const CellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  shape: z.enum(['square', 'hst', 'qst']),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  colors: z.array(z.string()), // fabric keys or hex colors
});

export type Cell = z.infer<typeof CellSchema>;

export const BlockDesignSchema = z.object({
  gridSize: z.number().int().min(2).max(12),
  cells: z.array(CellSchema),
  fabricMapping: z.record(z.string()), // fabric key -> color/image
});

export type BlockDesign = z.infer<typeof BlockDesignSchema>;
