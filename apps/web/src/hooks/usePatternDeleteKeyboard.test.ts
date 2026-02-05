import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock store state
let mockSelectedBlockInstanceId: string | null = null;
const mockRemoveBlockInstance = vi.fn();

vi.mock('@quillty/core', () => ({
  usePatternDesignerStore: vi.fn((selector) => {
    const state = {
      selectedBlockInstanceId: mockSelectedBlockInstanceId,
      removeBlockInstance: mockRemoveBlockInstance,
    };
    return selector ? selector(state) : state;
  }),
}));

import { usePatternDeleteKeyboard } from './usePatternDeleteKeyboard';

describe('usePatternDeleteKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedBlockInstanceId = null;
  });

  afterEach(() => {
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

  it('deletes selected block instance when Delete key is pressed', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    renderHook(() => usePatternDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveBlockInstance).toHaveBeenCalledWith('instance-1');
  });

  it('deletes selected block instance when Backspace key is pressed', () => {
    mockSelectedBlockInstanceId = 'instance-2';

    renderHook(() => usePatternDeleteKeyboard());

    simulateKeyDown('Backspace');

    expect(mockRemoveBlockInstance).toHaveBeenCalledWith('instance-2');
  });

  it('does not call removeBlockInstance when no block instance is selected', () => {
    mockSelectedBlockInstanceId = null;

    renderHook(() => usePatternDeleteKeyboard());

    simulateKeyDown('Delete');

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();
  });

  it('does not trigger when typing in an input', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    renderHook(() => usePatternDeleteKeyboard());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });
    document.dispatchEvent(event);

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('does not trigger when typing in a textarea', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    renderHook(() => usePatternDeleteKeyboard());

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });
    document.dispatchEvent(event);

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('does not trigger when typing in a contenteditable element', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    renderHook(() => usePatternDeleteKeyboard());

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

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();
  });

  it('does not trigger for other keys', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    renderHook(() => usePatternDeleteKeyboard());

    simulateKeyDown('Enter');
    simulateKeyDown('Escape');
    simulateKeyDown('a');

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    mockSelectedBlockInstanceId = 'instance-1';

    const { unmount } = renderHook(() => usePatternDeleteKeyboard());

    unmount();

    simulateKeyDown('Delete');

    expect(mockRemoveBlockInstance).not.toHaveBeenCalled();
  });
});
