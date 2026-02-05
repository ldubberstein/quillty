import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock store state
let mockSelectedShapeId: string | null = null;
const mockRemoveShape = vi.fn();

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      selectedShapeId: mockSelectedShapeId,
      removeShape: mockRemoveShape,
    };
    return selector ? selector(state) : state;
  }),
}));

import { useDeleteKeyboard } from './useDeleteKeyboard';

describe('useDeleteKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedShapeId = null;
  });

  afterEach(() => {
    // Clean up any lingering event listeners
    vi.restoreAllMocks();
  });

  const simulateKeyDown = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  };

  it('deletes selected shape when Delete key is pressed', () => {
    mockSelectedShapeId = 'shape-1';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveShape).toHaveBeenCalledWith('shape-1');
  });

  it('deletes selected shape when Backspace key is pressed', () => {
    mockSelectedShapeId = 'shape-2';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Backspace');

    expect(mockRemoveShape).toHaveBeenCalledWith('shape-2');
  });

  it('does not call removeShape when no shape is selected', () => {
    mockSelectedShapeId = null;

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveShape).not.toHaveBeenCalled();
  });

  it('does not trigger when typing in an input', () => {
    mockSelectedShapeId = 'shape-1';

    renderHook(() => useDeleteKeyboard());

    // Create and focus an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Dispatch event with input as target
    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });
    document.dispatchEvent(event);

    expect(mockRemoveShape).not.toHaveBeenCalled();

    // Clean up
    document.body.removeChild(input);
  });

  it('does not trigger when typing in a textarea', () => {
    mockSelectedShapeId = 'shape-1';

    renderHook(() => useDeleteKeyboard());

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });
    document.dispatchEvent(event);

    expect(mockRemoveShape).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('does not trigger when typing in a contenteditable element', () => {
    mockSelectedShapeId = 'shape-1';

    renderHook(() => useDeleteKeyboard());

    // Use a mock target object since jsdom may not fully support isContentEditable
    const mockTarget = {
      tagName: 'DIV',
      isContentEditable: true,
    };

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: mockTarget, writable: false });
    document.dispatchEvent(event);

    expect(mockRemoveShape).not.toHaveBeenCalled();
  });

  it('does not trigger for other keys', () => {
    mockSelectedShapeId = 'shape-1';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Enter');
    simulateKeyDown('Escape');
    simulateKeyDown('a');

    expect(mockRemoveShape).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    mockSelectedShapeId = 'shape-1';

    const { unmount } = renderHook(() => useDeleteKeyboard());

    unmount();

    simulateKeyDown('Delete');

    expect(mockRemoveShape).not.toHaveBeenCalled();
  });
});
