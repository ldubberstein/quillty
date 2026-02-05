/**
 * Pattern Designer History/Undo System
 *
 * Exports operation types and undo manager for the Pattern Designer.
 */

// Operation types and functions
export type {
  AddBlockInstanceOperation,
  RemoveBlockInstanceOperation,
  UpdateBlockInstanceOperation,
  UpdateInstancePaletteOperation,
  ResetInstancePaletteOperation,
  UpdatePaletteOperation,
  ResizeGridOperation,
  AddBorderOperation,
  RemoveBorderOperation,
  UpdateBorderOperation,
  SetBordersEnabledOperation,
  ReorderBordersOperation,
  PatternBatchOperation,
  PatternOperation,
} from './operations';

export {
  invertPatternOperation,
  applyOperationToBlockInstances,
  applyOperationToPalette,
  applyOperationToGridSize,
  applyOperationToBorderConfig,
} from './operations';

// Undo manager
export type { UndoManagerState } from './undoManager';

export {
  MAX_HISTORY_SIZE,
  createUndoManagerState,
  recordOperation,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
} from './undoManager';
