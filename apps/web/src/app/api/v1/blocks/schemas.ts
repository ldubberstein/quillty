import { z } from 'zod';
import {
  GridSizeSchema,
  UnitSchema,
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
  units: z.array(UnitSchema),
  previewPalette: PaletteSchema, // Named previewPalette in the persistence layer
});

/** Create block input schema */
export const CreateBlockInputSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    gridSize: GridSizeSchema,
    designData: BlockDesignDataSchema,
    difficulty: DifficultySchema.optional().default('beginner'),
    thumbnailUrl: z.string().url().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const { gridSize, designData } = data;
    const { units, previewPalette } = designData;

    // 1. Unit ID uniqueness
    const ids = new Set<string>();
    for (const unit of units) {
      if (ids.has(unit.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate unit ID: "${unit.id}"`,
          path: ['designData', 'units'],
        });
      }
      ids.add(unit.id);
    }

    // 2. Unit bounds checking
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit.position.row + unit.span.rows > gridSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unit "${unit.id}" exceeds grid bounds vertically (row ${unit.position.row} + span ${unit.span.rows} > gridSize ${gridSize})`,
          path: ['designData', 'units', i, 'position'],
        });
      }
      if (unit.position.col + unit.span.cols > gridSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unit "${unit.id}" exceeds grid bounds horizontally (col ${unit.position.col} + span ${unit.span.cols} > gridSize ${gridSize})`,
          path: ['designData', 'units', i, 'position'],
        });
      }
    }

    // 3. Unit overlap detection
    const occupiedCells = new Map<string, string>();
    for (const unit of units) {
      for (let r = 0; r < unit.span.rows; r++) {
        for (let c = 0; c < unit.span.cols; c++) {
          const key = `${unit.position.row + r},${unit.position.col + c}`;
          if (occupiedCells.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Units "${occupiedCells.get(key)}" and "${unit.id}" overlap at cell (${key})`,
              path: ['designData', 'units'],
            });
          }
          occupiedCells.set(key, unit.id);
        }
      }
    }

    // 4. Fabric role reference validation
    const validRoleIds = new Set(previewPalette.roles.map((r) => r.id));
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const roleIds: string[] = [];

      if (unit.type === 'square') {
        roleIds.push(unit.fabricRole);
      } else if (unit.type === 'hst') {
        roleIds.push(unit.fabricRole, unit.secondaryFabricRole);
      } else if (unit.type === 'flying_geese') {
        roleIds.push(
          unit.patchFabricRoles.goose,
          unit.patchFabricRoles.sky1,
          unit.patchFabricRoles.sky2
        );
      } else if (unit.type === 'qst') {
        roleIds.push(
          unit.patchFabricRoles.top,
          unit.patchFabricRoles.right,
          unit.patchFabricRoles.bottom,
          unit.patchFabricRoles.left
        );
      }

      for (const roleId of roleIds) {
        if (!validRoleIds.has(roleId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unit "${unit.id}" references unknown fabric role "${roleId}"`,
            path: ['designData', 'units', i],
          });
        }
      }
    }

    // 5. Flying Geese span-direction consistency
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit.type === 'flying_geese') {
        const isHorizontalDir =
          unit.direction === 'left' || unit.direction === 'right';
        const isHorizontalSpan = unit.span.cols === 2 && unit.span.rows === 1;
        const isVerticalSpan = unit.span.rows === 2 && unit.span.cols === 1;

        if (isHorizontalDir && !isHorizontalSpan) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Flying Geese "${unit.id}" direction "${unit.direction}" requires span {rows:1, cols:2}`,
            path: ['designData', 'units', i, 'span'],
          });
        }
        if (!isHorizontalDir && !isVerticalSpan) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Flying Geese "${unit.id}" direction "${unit.direction}" requires span {rows:2, cols:1}`,
            path: ['designData', 'units', i, 'span'],
          });
        }
      }
    }
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
