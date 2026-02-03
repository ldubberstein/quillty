import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEscapeDismiss } from './useEscapeDismiss';

describe('useEscapeDismiss', () => {
  it('calls onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn();

    renderHook(() => useEscapeDismiss(onDismiss));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss for other keys', () => {
    const onDismiss = vi.fn();

    renderHook(() => useEscapeDismiss(onDismiss));

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(enterEvent);

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    document.dispatchEvent(spaceEvent);

    const aEvent = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(aEvent);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const onDismiss = vi.fn();

    const { unmount } = renderHook(() => useEscapeDismiss(onDismiss));

    unmount();

    // Escape after unmount should not trigger callback
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('handles multiple Escape presses', () => {
    const onDismiss = vi.fn();

    renderHook(() => useEscapeDismiss(onDismiss));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);
    document.dispatchEvent(escapeEvent);
    document.dispatchEvent(escapeEvent);

    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it('updates callback when onDismiss changes', () => {
    const onDismiss1 = vi.fn();
    const onDismiss2 = vi.fn();

    const { rerender } = renderHook(({ callback }) => useEscapeDismiss(callback), {
      initialProps: { callback: onDismiss1 },
    });

    // Press Escape with first callback
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);
    expect(onDismiss1).toHaveBeenCalledTimes(1);
    expect(onDismiss2).not.toHaveBeenCalled();

    // Change callback
    rerender({ callback: onDismiss2 });

    // Press Escape with second callback
    document.dispatchEvent(escapeEvent);
    expect(onDismiss1).toHaveBeenCalledTimes(1); // Still 1
    expect(onDismiss2).toHaveBeenCalledTimes(1); // Now called
  });
});
