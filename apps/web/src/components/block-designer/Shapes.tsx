/**
 * Shapes - Re-exports unit options and types
 *
 * @deprecated Use ShapeThumbnail.tsx directly for unit options.
 * This file is kept for backwards compatibility.
 */

// Re-export from ShapeThumbnail for backwards compatibility
export { UNIT_OPTIONS as SHAPE_OPTIONS, type UnitOption as ShapeOption } from './ShapeThumbnail';

// Re-export UnitSelectionType from core as ShapeSelection for backwards compatibility
export type { UnitSelectionType as ShapeSelection } from '@quillty/core';
