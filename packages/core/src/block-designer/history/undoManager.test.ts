import { describe, it, expect } from 'vitest';
import {
  createUndoManagerState,
  recordOperation,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  MAX_HISTORY_SIZE,
} from './undoManager';
import type { Operation } from './operations';
import type { Unit } from '../types';

describe('undoManager', () => {
  const createTestUnit = (id: string): Unit => ({
    id,
    type: 'square',
    position: { row: 0, col: 0 },
    span: { rows: 1, cols: 1 },
    fabricRole: 'background',
  });

  describe('createUndoManagerState', () => {
    it('creates empty undo and redo stacks', () => {
      const state = createUndoManagerState();

      expect(state.undoStack).toEqual([]);
      expect(state.redoStack).toEqual([]);
    });
  });

  describe('recordOperation', () => {
    it('adds operation to undo stack', () => {
      const state = createUndoManagerState();
      const op: Operation = { type: 'add_unit', unit: createTestUnit('1') };

      const newState = recordOperation(state, op);

      expect(newState.undoStack).toEqual([op]);
    });

    it('clears redo stack when recording new operation', () => {
      const state = createUndoManagerState();
      const op1: Operation = { type: 'add_unit', unit: createTestUnit('1') };
      const op2: Operation = { type: 'add_unit', unit: createTestUnit('2') };

      // Add op1, then undo, then add op2
      let current = recordOperation(state, op1);
      const undoResult = undo(current);
      expect(undoResult).not.toBeNull();
      current = undoResult!.state;
      expect(current.redoStack.length).toBe(1);

      // Recording new operation clears redo stack
      current = recordOperation(current, op2);
      expect(current.redoStack).toEqual([]);
    });

    it('trims undo stack when exceeding max size', () => {
      let state = createUndoManagerState();

      // Add MAX_HISTORY_SIZE + 1 operations
      for (let i = 0; i <= MAX_HISTORY_SIZE; i++) {
        const op: Operation = { type: 'add_unit', unit: createTestUnit(`${i}`) };
        state = recordOperation(state, op);
      }

      expect(state.undoStack.length).toBe(MAX_HISTORY_SIZE);
      // First operation should have been trimmed
      expect((state.undoStack[0] as { unit: Unit }).unit.id).toBe('1');
    });
  });

  describe('undo', () => {
    it('returns null when undo stack is empty', () => {
      const state = createUndoManagerState();

      const result = undo(state);

      expect(result).toBeNull();
    });

    it('returns inverted operation and moves to redo stack', () => {
      const state = createUndoManagerState();
      const unit = createTestUnit('1');
      const op: Operation = { type: 'add_unit', unit };

      const stateWithOp = recordOperation(state, op);
      const result = undo(stateWithOp);

      expect(result).not.toBeNull();
      // Inverted operation should be remove_unit
      expect(result!.operation).toEqual({ type: 'remove_unit', unit });
      // Original operation moved to redo stack
      expect(result!.state.redoStack).toEqual([op]);
      expect(result!.state.undoStack).toEqual([]);
    });

    it('handles multiple undo operations', () => {
      let state = createUndoManagerState();
      const op1: Operation = { type: 'add_unit', unit: createTestUnit('1') };
      const op2: Operation = { type: 'add_unit', unit: createTestUnit('2') };

      state = recordOperation(state, op1);
      state = recordOperation(state, op2);

      // Undo op2
      let result = undo(state);
      expect(result).not.toBeNull();
      state = result!.state;
      expect(state.undoStack.length).toBe(1);
      expect(state.redoStack.length).toBe(1);

      // Undo op1
      result = undo(state);
      expect(result).not.toBeNull();
      state = result!.state;
      expect(state.undoStack.length).toBe(0);
      expect(state.redoStack.length).toBe(2);
    });
  });

  describe('redo', () => {
    it('returns null when redo stack is empty', () => {
      const state = createUndoManagerState();

      const result = redo(state);

      expect(result).toBeNull();
    });

    it('returns operation and moves back to undo stack', () => {
      let state = createUndoManagerState();
      const unit = createTestUnit('1');
      const op: Operation = { type: 'add_unit', unit };

      state = recordOperation(state, op);
      const undoResult = undo(state);
      expect(undoResult).not.toBeNull();
      state = undoResult!.state;

      const redoResult = redo(state);

      expect(redoResult).not.toBeNull();
      // Redo returns the original operation
      expect(redoResult!.operation).toEqual(op);
      // Operation moved back to undo stack
      expect(redoResult!.state.undoStack).toEqual([op]);
      expect(redoResult!.state.redoStack).toEqual([]);
    });
  });

  describe('canUndo', () => {
    it('returns false when undo stack is empty', () => {
      const state = createUndoManagerState();

      expect(canUndo(state)).toBe(false);
    });

    it('returns true when undo stack has operations', () => {
      const state = createUndoManagerState();
      const op: Operation = { type: 'add_unit', unit: createTestUnit('1') };
      const stateWithOp = recordOperation(state, op);

      expect(canUndo(stateWithOp)).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('returns false when redo stack is empty', () => {
      const state = createUndoManagerState();

      expect(canRedo(state)).toBe(false);
    });

    it('returns true when redo stack has operations', () => {
      let state = createUndoManagerState();
      const op: Operation = { type: 'add_unit', unit: createTestUnit('1') };

      state = recordOperation(state, op);
      const undoResult = undo(state);
      expect(undoResult).not.toBeNull();
      state = undoResult!.state;

      expect(canRedo(state)).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('returns fresh empty state', () => {
      const initialState = createUndoManagerState();
      const op: Operation = { type: 'add_unit', unit: createTestUnit('1') };
      // Just verifying the setup - state with ops is different from cleared
      recordOperation(initialState, op);

      const cleared = clearHistory();

      expect(cleared.undoStack).toEqual([]);
      expect(cleared.redoStack).toEqual([]);
    });
  });
});
