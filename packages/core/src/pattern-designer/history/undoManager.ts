/**
 * Pattern Designer Undo Manager
 *
 * Re-exports from the shared generic undo manager with Pattern Designer-specific types.
 * Maintains the same API as Block Designer for consistency.
 */

import type { PatternOperation } from './operations';
import { invertPatternOperation } from './operations';
import {
  UndoManagerState as GenericUndoManagerState,
  MAX_HISTORY_SIZE,
  createUndoManagerState as createGenericState,
  recordOperation as genericRecordOp,
  undo as genericUndo,
  redo as genericRedo,
  canUndo as genericCanUndo,
  canRedo as genericCanRedo,
  clearHistory as genericClearHistory,
} from '../../history/undoManager';

/**
 * State for the undo manager (typed for Pattern Designer operations)
 */
export type UndoManagerState = GenericUndoManagerState<PatternOperation>;

// Re-export shared constants
export { MAX_HISTORY_SIZE };

/**
 * Create an initial undo manager state
 */
export function createUndoManagerState(): UndoManagerState {
  return createGenericState<PatternOperation>();
}

/**
 * Record an operation and add it to the undo stack.
 * Clears the redo stack (new operation invalidates redo history).
 */
export function recordOperation(
  state: UndoManagerState,
  operation: PatternOperation
): UndoManagerState {
  return genericRecordOp(state, operation);
}

/**
 * Get the operation to undo (if any) and update stacks.
 * Uses Pattern Designer's invertPatternOperation to create the inverse.
 */
export function undo(state: UndoManagerState): {
  state: UndoManagerState;
  operation: PatternOperation;
} | null {
  return genericUndo(state, invertPatternOperation);
}

/**
 * Get the operation to redo (if any) and update stacks
 */
export function redo(state: UndoManagerState): {
  state: UndoManagerState;
  operation: PatternOperation;
} | null {
  return genericRedo(state);
}

/**
 * Check if undo is available
 */
export function canUndo(state: UndoManagerState): boolean {
  return genericCanUndo(state);
}

/**
 * Check if redo is available
 */
export function canRedo(state: UndoManagerState): boolean {
  return genericCanRedo(state);
}

/**
 * Clear all history
 */
export function clearHistory(): UndoManagerState {
  return genericClearHistory<PatternOperation>();
}
