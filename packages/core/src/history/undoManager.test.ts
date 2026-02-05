import { describe, it, expect } from 'vitest';
import {
  UndoManagerState,
  MAX_HISTORY_SIZE,
  createUndoManagerState,
  recordOperation,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
} from './undoManager';

// Simple test operation type for testing
interface TestOperation {
  type: 'add' | 'remove';
  value: number;
}

// Invert function for test operations
function invertTestOp(op: TestOperation): TestOperation {
  return {
    type: op.type === 'add' ? 'remove' : 'add',
    value: op.value,
  };
}

describe('Generic Undo Manager', () => {
  describe('createUndoManagerState', () => {
    it('creates empty state', () => {
      const state = createUndoManagerState<TestOperation>();
      expect(state.undoStack).toEqual([]);
      expect(state.redoStack).toEqual([]);
    });
  });

  describe('recordOperation', () => {
    it('adds operation to undo stack', () => {
      let state = createUndoManagerState<TestOperation>();
      const op: TestOperation = { type: 'add', value: 1 };

      state = recordOperation(state, op);

      expect(state.undoStack).toHaveLength(1);
      expect(state.undoStack[0]).toEqual(op);
    });

    it('clears redo stack when recording new operation', () => {
      let state: UndoManagerState<TestOperation> = {
        undoStack: [{ type: 'add', value: 1 }],
        redoStack: [{ type: 'add', value: 2 }],
      };

      state = recordOperation(state, { type: 'add', value: 3 });

      expect(state.redoStack).toHaveLength(0);
      expect(state.undoStack).toHaveLength(2);
    });

    it('trims undo stack when exceeding MAX_HISTORY_SIZE', () => {
      let state = createUndoManagerState<TestOperation>();

      // Fill to max
      for (let i = 0; i < MAX_HISTORY_SIZE; i++) {
        state = recordOperation(state, { type: 'add', value: i });
      }
      expect(state.undoStack).toHaveLength(MAX_HISTORY_SIZE);

      // Add one more - should trim oldest
      state = recordOperation(state, { type: 'add', value: MAX_HISTORY_SIZE });
      expect(state.undoStack).toHaveLength(MAX_HISTORY_SIZE);
      // First value should now be 1 (value 0 was trimmed)
      expect(state.undoStack[0].value).toBe(1);
      // Last value should be the new one
      expect(state.undoStack[MAX_HISTORY_SIZE - 1].value).toBe(MAX_HISTORY_SIZE);
    });
  });

  describe('undo', () => {
    it('returns null when undo stack is empty', () => {
      const state = createUndoManagerState<TestOperation>();
      const result = undo(state, invertTestOp);
      expect(result).toBeNull();
    });

    it('returns inverted operation and updated state', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [{ type: 'add', value: 1 }],
        redoStack: [],
      };

      const result = undo(state, invertTestOp);

      expect(result).not.toBeNull();
      expect(result!.operation).toEqual({ type: 'remove', value: 1 });
      expect(result!.state.undoStack).toHaveLength(0);
      expect(result!.state.redoStack).toHaveLength(1);
      expect(result!.state.redoStack[0]).toEqual({ type: 'add', value: 1 });
    });

    it('undoes most recent operation first (LIFO)', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [
          { type: 'add', value: 1 },
          { type: 'add', value: 2 },
          { type: 'add', value: 3 },
        ],
        redoStack: [],
      };

      const result = undo(state, invertTestOp);

      expect(result!.operation.value).toBe(3);
      expect(result!.state.undoStack).toHaveLength(2);
    });
  });

  describe('redo', () => {
    it('returns null when redo stack is empty', () => {
      const state = createUndoManagerState<TestOperation>();
      const result = redo(state);
      expect(result).toBeNull();
    });

    it('returns original operation and updated state', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [],
        redoStack: [{ type: 'add', value: 1 }],
      };

      const result = redo(state);

      expect(result).not.toBeNull();
      expect(result!.operation).toEqual({ type: 'add', value: 1 });
      expect(result!.state.redoStack).toHaveLength(0);
      expect(result!.state.undoStack).toHaveLength(1);
    });

    it('redoes most recent undone operation first (LIFO)', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [],
        redoStack: [
          { type: 'add', value: 1 },
          { type: 'add', value: 2 },
        ],
      };

      const result = redo(state);

      expect(result!.operation.value).toBe(2);
      expect(result!.state.redoStack).toHaveLength(1);
    });
  });

  describe('canUndo', () => {
    it('returns false when undo stack is empty', () => {
      const state = createUndoManagerState<TestOperation>();
      expect(canUndo(state)).toBe(false);
    });

    it('returns true when undo stack has operations', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [{ type: 'add', value: 1 }],
        redoStack: [],
      };
      expect(canUndo(state)).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('returns false when redo stack is empty', () => {
      const state = createUndoManagerState<TestOperation>();
      expect(canRedo(state)).toBe(false);
    });

    it('returns true when redo stack has operations', () => {
      const state: UndoManagerState<TestOperation> = {
        undoStack: [],
        redoStack: [{ type: 'add', value: 1 }],
      };
      expect(canRedo(state)).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('returns empty state', () => {
      const state = clearHistory<TestOperation>();
      expect(state.undoStack).toEqual([]);
      expect(state.redoStack).toEqual([]);
    });
  });

  describe('undo/redo integration', () => {
    it('supports multiple undo/redo cycles', () => {
      let state = createUndoManagerState<TestOperation>();

      // Record 3 operations
      state = recordOperation(state, { type: 'add', value: 1 });
      state = recordOperation(state, { type: 'add', value: 2 });
      state = recordOperation(state, { type: 'add', value: 3 });

      expect(state.undoStack).toHaveLength(3);
      expect(state.redoStack).toHaveLength(0);

      // Undo 2 operations
      let result = undo(state, invertTestOp);
      state = result!.state;
      expect(result!.operation.value).toBe(3);

      result = undo(state, invertTestOp);
      state = result!.state;
      expect(result!.operation.value).toBe(2);

      expect(state.undoStack).toHaveLength(1);
      expect(state.redoStack).toHaveLength(2);

      // Redo 1 operation
      result = redo(state);
      state = result!.state;
      expect(result!.operation.value).toBe(2);

      expect(state.undoStack).toHaveLength(2);
      expect(state.redoStack).toHaveLength(1);

      // New operation should clear redo stack
      state = recordOperation(state, { type: 'add', value: 4 });
      expect(state.undoStack).toHaveLength(3);
      expect(state.redoStack).toHaveLength(0);
    });

    it('handles undo when only one operation exists', () => {
      let state = createUndoManagerState<TestOperation>();
      state = recordOperation(state, { type: 'add', value: 1 });

      const result = undo(state, invertTestOp);
      state = result!.state;

      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(1);
      expect(canUndo(state)).toBe(false);
      expect(canRedo(state)).toBe(true);
    });
  });

  describe('MAX_HISTORY_SIZE', () => {
    it('is set to 100', () => {
      expect(MAX_HISTORY_SIZE).toBe(100);
    });
  });
});
