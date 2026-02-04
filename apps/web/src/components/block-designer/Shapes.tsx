/**
 * Shapes - Re-exports shape options and types
 *
 * @deprecated Use ShapeThumbnail.tsx directly for shape options.
 * This file is kept for backwards compatibility.
 */

// Re-export from ShapeThumbnail for backwards compatibility
export { SHAPE_OPTIONS, type ShapeOption } from './ShapeThumbnail';

// Re-export ShapeSelectionType from core as ShapeSelection for backwards compatibility
export type { ShapeSelectionType as ShapeSelection } from '@quillty/core';
