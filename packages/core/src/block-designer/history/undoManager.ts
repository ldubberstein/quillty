/**
 * Undo Manager
 *
 * Manages undo/redo stacks for the Block Designer.
 * Uses the command pattern with inverse operations for memory efficiency.
 */

import type { Operation } from './operations';
import { invertOperation } from './operations';

/**
 * State for the undo manager
 */
export interface UndoManagerState {
  undoStack: Operation[];
  redoStack: Operation[];
}

/**
 * Maximum number of operations to keep in history
 */
export const MAX_HISTORY_SIZE = 100;

/**
 * Create an initial undo manager state
 */
export function createUndoManagerState(): UndoManagerState {
  return {
    undoStack: [],
    redoStack: [],
  };
}

/**
 * Record an operation and add it to the undo stack.
 * Clears the redo stack (new operation invalidates redo history).
 */
export function recordOperation(
  state: UndoManagerState,
  operation: Operation
): UndoManagerState {
  // Trim undo stack if it exceeds max size
  const trimmedUndoStack =
    state.undoStack.length >= MAX_HISTORY_SIZE
      ? state.undoStack.slice(-MAX_HISTORY_SIZE + 1)
      : state.undoStack;

  return {
    undoStack: [...trimmedUndoStack, operation],
    redoStack: [], // Clear redo stack on new operation
  };
}

/**
 * Get the operation to undo (if any) and update stacks
 */
export function undo(state: UndoManagerState): {
  state: UndoManagerState;
  operation: Operation;
} | null {
  if (state.undoStack.length === 0) {
    return null;
  }

  const operation = state.undoStack[state.undoStack.length - 1];
  const inverse = invertOperation(operation);

  return {
    operation: inverse,
    state: {
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, operation],
    },
  };
}

/**
 * Get the operation to redo (if any) and update stacks
 */
export function redo(state: UndoManagerState): {
  state: UndoManagerState;
  operation: Operation;
} | null {
  if (state.redoStack.length === 0) {
    return null;
  }

  const operation = state.redoStack[state.redoStack.length - 1];

  return {
    operation,
    state: {
      undoStack: [...state.undoStack, operation],
      redoStack: state.redoStack.slice(0, -1),
    },
  };
}

/**
 * Check if undo is available
 */
export function canUndo(state: UndoManagerState): boolean {
  return state.undoStack.length > 0;
}

/**
 * Check if redo is available
 */
export function canRedo(state: UndoManagerState): boolean {
  return state.redoStack.length > 0;
}

/**
 * Clear all history
 */
export function clearHistory(): UndoManagerState {
  return createUndoManagerState();
}
