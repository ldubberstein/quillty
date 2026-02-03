import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutsideDismiss } from './useClickOutsideDismiss';

describe('useClickOutsideDismiss', () => {
  let container: HTMLDivElement;
  let targetElement: HTMLDivElement;

  beforeEach(() => {
    // Create DOM elements for testing
    container = document.createElement('div');
    targetElement = document.createElement('div');
    container.appendChild(targetElement);
    document.body.appendChild(container);

    // Use fake timers for setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it('calls onDismiss when clicking outside the element', () => {
    const onDismiss = vi.fn();
    const ref = { current: targetElement };

    renderHook(() => useClickOutsideDismiss(ref, onDismiss));

    // Advance timers to allow the event listener to be added
    vi.runAllTimers();

    // Click outside the target element
    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when clicking inside the element', () => {
    const onDismiss = vi.fn();
    const ref = { current: targetElement };

    renderHook(() => useClickOutsideDismiss(ref, onDismiss));

    // Advance timers to allow the event listener to be added
    vi.runAllTimers();

    // Click inside the target element
    const insideClick = new MouseEvent('mousedown', { bubbles: true });
    targetElement.dispatchEvent(insideClick);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does not call onDismiss immediately (prevents self-dismissal)', () => {
    const onDismiss = vi.fn();
    const ref = { current: targetElement };

    renderHook(() => useClickOutsideDismiss(ref, onDismiss));

    // Click before timers advance (simulating immediate click)
    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    // Should not be called yet because listener hasn't been added
    expect(onDismiss).not.toHaveBeenCalled();

    // Now advance timers
    vi.runAllTimers();

    // Click again - now it should work
    document.body.dispatchEvent(outsideClick);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does nothing when ref.current is null', () => {
    const onDismiss = vi.fn();
    const ref = { current: null };

    renderHook(() => useClickOutsideDismiss(ref, onDismiss));

    vi.runAllTimers();

    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const onDismiss = vi.fn();
    const ref = { current: targetElement };

    const { unmount } = renderHook(() => useClickOutsideDismiss(ref, onDismiss));

    vi.runAllTimers();
    unmount();

    // Click after unmount should not trigger callback
    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
