/**
 * Generic History/Undo System
 *
 * Provides shared undo/redo stack management that can be used by any domain.
 */

export {
  type UndoManagerState,
  MAX_HISTORY_SIZE,
  createUndoManagerState,
  recordOperation,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
} from './undoManager';
