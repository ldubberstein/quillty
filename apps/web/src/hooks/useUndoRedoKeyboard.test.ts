import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUndoRedoKeyboard } from './useUndoRedoKeyboard';
import { useBlockDesignerStore } from '@quillty/core';

// Mock the store
vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn(),
}));

describe('useUndoRedoKeyboard', () => {
  const mockUndo = vi.fn();
  const mockRedo = vi.fn();
  const mockCanUndo = vi.fn();
  const mockCanRedo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(true);

    // Setup store mock to return different values for different selectors
    (useBlockDesignerStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: unknown) => unknown) => {
        const state = {
          undo: mockUndo,
          redo: mockRedo,
          canUndo: mockCanUndo,
          canRedo: mockCanRedo,
        };
        return selector(state);
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls undo on Cmd+Z (Mac)', () => {
    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: false,
    });
    document.dispatchEvent(event);

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('calls undo on Ctrl+Z (Windows/Linux)', () => {
    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: false,
    });
    document.dispatchEvent(event);

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('calls redo on Cmd+Shift+Z (Mac)', () => {
    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('calls redo on Ctrl+Shift+Z (Windows/Linux)', () => {
    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('does not call undo when canUndo returns false', () => {
    mockCanUndo.mockReturnValue(false);

    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: false,
    });
    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('does not call redo when canRedo returns false', () => {
    mockCanRedo.mockReturnValue(false);

    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);

    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('does not trigger on regular Z key without modifier', () => {
    renderHook(() => useUndoRedoKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: false,
      ctrlKey: false,
    });
    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useUndoRedoKeyboard());

    unmount();

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
    });
    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
  });
});
