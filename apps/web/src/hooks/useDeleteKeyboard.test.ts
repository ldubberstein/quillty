import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock store state
let mockSelectedUnitId: string | null = null;
const mockRemoveUnit = vi.fn();

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      selectedUnitId: mockSelectedUnitId,
      removeUnit: mockRemoveUnit,
    };
    return selector ? selector(state) : state;
  }),
}));

import { useDeleteKeyboard } from './useDeleteKeyboard';

describe('useDeleteKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedUnitId = null;
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

  it('deletes selected unit when Delete key is pressed', () => {
    mockSelectedUnitId = 'unit-1';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveUnit).toHaveBeenCalledWith('unit-1');
  });

  it('deletes selected unit when Backspace key is pressed', () => {
    mockSelectedUnitId = 'unit-2';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Backspace');

    expect(mockRemoveUnit).toHaveBeenCalledWith('unit-2');
  });

  it('does not call removeUnit when no unit is selected', () => {
    mockSelectedUnitId = null;

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveUnit).not.toHaveBeenCalled();
  });

  it('does not trigger when typing in an input', () => {
    mockSelectedUnitId = 'unit-1';

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

    expect(mockRemoveUnit).not.toHaveBeenCalled();

    // Clean up
    document.body.removeChild(input);
  });

  it('does not trigger when typing in a textarea', () => {
    mockSelectedUnitId = 'unit-1';

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

    expect(mockRemoveUnit).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('does not trigger when typing in a contenteditable element', () => {
    mockSelectedUnitId = 'unit-1';

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

    expect(mockRemoveUnit).not.toHaveBeenCalled();
  });

  it('does not trigger for other keys', () => {
    mockSelectedUnitId = 'unit-1';

    renderHook(() => useDeleteKeyboard());

    simulateKeyDown('Enter');
    simulateKeyDown('Escape');
    simulateKeyDown('a');

    expect(mockRemoveUnit).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    mockSelectedUnitId = 'unit-1';

    const { unmount } = renderHook(() => useDeleteKeyboard());

    unmount();

    simulateKeyDown('Delete');

    expect(mockRemoveUnit).not.toHaveBeenCalled();
  });
});
