/**
 * Generic Undo Manager
 *
 * Manages undo/redo stacks with a generic operation type.
 * Uses the command pattern with inverse operations for memory efficiency.
 *
 * This module provides the stack management logic. Each domain (Block Designer,
 * Pattern Designer) defines its own operation types and inversion functions.
 */

/**
 * State for the undo manager with generic operation type
 */
export interface UndoManagerState<Op> {
  undoStack: Op[];
  redoStack: Op[];
}

/**
 * Maximum number of operations to keep in history
 */
export const MAX_HISTORY_SIZE = 100;

/**
 * Create an initial undo manager state
 */
export function createUndoManagerState<Op>(): UndoManagerState<Op> {
  return {
    undoStack: [],
    redoStack: [],
  };
}

/**
 * Record an operation and add it to the undo stack.
 * Clears the redo stack (new operation invalidates redo history).
 */
export function recordOperation<Op>(
  state: UndoManagerState<Op>,
  operation: Op
): UndoManagerState<Op> {
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
 * Get the operation to undo (if any) and update stacks.
 * Takes an invertFn to create the inverse operation.
 */
export function undo<Op>(
  state: UndoManagerState<Op>,
  invertFn: (op: Op) => Op
): {
  state: UndoManagerState<Op>;
  operation: Op;
} | null {
  if (state.undoStack.length === 0) {
    return null;
  }

  const operation = state.undoStack[state.undoStack.length - 1];
  const inverse = invertFn(operation);

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
export function redo<Op>(state: UndoManagerState<Op>): {
  state: UndoManagerState<Op>;
  operation: Op;
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
export function canUndo<Op>(state: UndoManagerState<Op>): boolean {
  return state.undoStack.length > 0;
}

/**
 * Check if redo is available
 */
export function canRedo<Op>(state: UndoManagerState<Op>): boolean {
  return state.redoStack.length > 0;
}

/**
 * Clear all history
 */
export function clearHistory<Op>(): UndoManagerState<Op> {
  return createUndoManagerState();
}
