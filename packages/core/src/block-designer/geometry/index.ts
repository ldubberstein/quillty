/**
 * Geometry Calculations Module
 *
 * Exports geometry functions and types for shape rendering
 */

export {
  getHstTriangles,
  triangleToFlatPoints,
  HST_VARIANT_INFO,
  type Point,
  type Triangle,
  type HstTriangles,
} from './hst';

export {
  getFlyingGeeseTriangles,
  FLYING_GEESE_DIRECTION_INFO,
  type FlyingGeeseTriangles,
} from './flyingGeese';

export {
  getQstTriangles,
  type QstTriangles,
} from './qst';
