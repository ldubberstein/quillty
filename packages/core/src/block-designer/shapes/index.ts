/**
 * Shape Definitions Index
 *
 * Imports all shape definitions to trigger their registration with the shape registry.
 * Also exports the individual definitions for direct access if needed.
 */

// Import shapes to trigger registration
import './square';
import './hst';
import './qst';
import './flyingGeese';

// Re-export definitions for direct access
export { squareDefinition } from './square';
export { hstDefinition } from './hst';
export { qstDefinition } from './qst';
export { flyingGeeseDefinition } from './flyingGeese';
