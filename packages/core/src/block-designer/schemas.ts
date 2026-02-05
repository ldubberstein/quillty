/**
 * Block Designer Zod Schemas
 *
 * Runtime validation schemas matching types.ts
 */

import { z } from 'zod';

// =============================================================================
// Primitive Schemas
// =============================================================================

/** UUID schema - validates string format */
export const UUIDSchema = z.string().uuid();

/** Timestamp schema - ISO 8601 format */
export const TimestampSchema = z.string().datetime();

/** Hex color schema - validates #RRGGBB format */
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: 'Must be a valid hex color (e.g., #FF5733)',
});

/** Grid size schema - allows 2 through 8 */
export const GridSizeSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);

/** Rotation schema - 90° increments */
export const RotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);

// =============================================================================
// Shape Type Schemas
// =============================================================================

/** Shape type enum schema */
export const ShapeTypeSchema = z.enum(['square', 'hst', 'flying_geese']);

/** HST variant schema */
export const HstVariantSchema = z.enum(['nw', 'ne', 'sw', 'se']);

/** Flying Geese direction schema */
export const FlyingGeeseDirectionSchema = z.enum(['up', 'down', 'left', 'right']);

// =============================================================================
// Grid & Position Schemas
// =============================================================================

/** Grid position schema */
export const GridPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

/** Span schema */
export const SpanSchema = z.object({
  rows: z.number().int().min(1),
  cols: z.number().int().min(1),
});

// =============================================================================
// Fabric & Palette Schemas
// =============================================================================

/** Standard fabric role IDs */
export const StandardFabricRoleIdSchema = z.enum([
  'background',
  'feature',
  'accent1',
  'accent2',
]);

/** Fabric role ID - standard or custom string */
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

// =============================================================================
// Shape Schemas
// =============================================================================

/** Base shape schema (common fields) */
const BaseShapeSchema = z.object({
  id: UUIDSchema,
  position: GridPositionSchema,
  fabricRole: FabricRoleIdSchema,
});

/** Square shape schema */
export const SquareShapeSchema = BaseShapeSchema.extend({
  type: z.literal('square'),
  span: z.object({
    rows: z.literal(1),
    cols: z.literal(1),
  }),
});

/** HST shape schema */
export const HstShapeSchema = BaseShapeSchema.extend({
  type: z.literal('hst'),
  span: z.object({
    rows: z.literal(1),
    cols: z.literal(1),
  }),
  variant: HstVariantSchema,
  secondaryFabricRole: FabricRoleIdSchema,
});

/** Flying Geese span schema - either 1×2 or 2×1 */
const FlyingGeeseSpanSchema = z.union([
  z.object({ rows: z.literal(1), cols: z.literal(2) }),
  z.object({ rows: z.literal(2), cols: z.literal(1) }),
]);

/** Flying Geese part ID schema */
export const FlyingGeesePartIdSchema = z.enum(['goose', 'sky1', 'sky2']);

/** Flying Geese part roles schema - fabric role for each of the 3 triangles */
export const FlyingGeesePartRolesSchema = z.object({
  goose: FabricRoleIdSchema,
  sky1: FabricRoleIdSchema,
  sky2: FabricRoleIdSchema,
});

/** Flying Geese shape schema - uses partFabricRoles for independent coloring */
export const FlyingGeeseShapeSchema = z.object({
  id: UUIDSchema,
  type: z.literal('flying_geese'),
  position: GridPositionSchema,
  span: FlyingGeeseSpanSchema,
  direction: FlyingGeeseDirectionSchema,
  partFabricRoles: FlyingGeesePartRolesSchema,
});

/** Union schema for all shapes */
export const ShapeSchema = z.discriminatedUnion('type', [
  SquareShapeSchema,
  HstShapeSchema,
  FlyingGeeseShapeSchema,
]);

// =============================================================================
// Block Schemas
// =============================================================================

/** Block status schema */
export const BlockStatusSchema = z.enum(['draft', 'published']);

/** Block schema */
export const BlockSchema = z.object({
  id: UUIDSchema,
  creatorId: UUIDSchema,
  derivedFromBlockId: UUIDSchema.nullable(),

  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  hashtags: z.array(z.string().min(1).max(50)),

  gridSize: GridSizeSchema,
  shapes: z.array(ShapeSchema),
  previewPalette: PaletteSchema,

  status: BlockStatusSchema,
  publishedAt: TimestampSchema.nullable(),

  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// =============================================================================
// Shape Creation Input Schemas
// =============================================================================

/** Input schema for creating a square */
export const CreateSquareInputSchema = z.object({
  position: GridPositionSchema,
  fabricRole: FabricRoleIdSchema,
});

/** Input schema for creating an HST */
export const CreateHstInputSchema = z.object({
  position: GridPositionSchema,
  variant: HstVariantSchema,
  fabricRole: FabricRoleIdSchema,
  secondaryFabricRole: FabricRoleIdSchema,
});

/** Input schema for creating Flying Geese */
export const CreateFlyingGeeseInputSchema = z.object({
  position: GridPositionSchema,
  direction: FlyingGeeseDirectionSchema,
  partFabricRoles: FlyingGeesePartRolesSchema,
});

// =============================================================================
// Type Inference Helpers
// =============================================================================

/** Inferred types from schemas (for runtime validation) */
export type ValidatedShape = z.infer<typeof ShapeSchema>;
export type ValidatedBlock = z.infer<typeof BlockSchema>;
export type ValidatedPalette = z.infer<typeof PaletteSchema>;
export type ValidatedFabricRole = z.infer<typeof FabricRoleSchema>;
