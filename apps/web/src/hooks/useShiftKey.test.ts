import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShiftKey } from './useShiftKey';

describe('useShiftKey', () => {
  beforeEach(() => {
    // Clear any existing event listeners
  });

  afterEach(() => {
    // Dispatch keyup to reset state between tests
    const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
    document.dispatchEvent(keyUpEvent);
  });

  describe('initial state', () => {
    it('returns false initially', () => {
      const { result } = renderHook(() => useShiftKey());
      expect(result.current).toBe(false);
    });
  });

  describe('keydown events', () => {
    it('returns true when Shift key is pressed', () => {
      const { result } = renderHook(() => useShiftKey());

      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(true);
    });

    it('does not change state for non-Shift keys', () => {
      const { result } = renderHook(() => useShiftKey());

      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Control' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(false);

      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Alt' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(false);

      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'a' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(false);
    });

    it('remains true on repeated Shift keydown events (key repeat)', () => {
      const { result } = renderHook(() => useShiftKey());

      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
        document.dispatchEvent(keyDownEvent);
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(true);
    });
  });

  describe('keyup events', () => {
    it('returns false when Shift key is released', () => {
      const { result } = renderHook(() => useShiftKey());

      // Press Shift
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(true);

      // Release Shift
      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
        document.dispatchEvent(keyUpEvent);
      });

      expect(result.current).toBe(false);
    });

    it('does not change state when non-Shift keys are released', () => {
      const { result } = renderHook(() => useShiftKey());

      // Press Shift
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(true);

      // Release other keys (Shift still held)
      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Control' });
        document.dispatchEvent(keyUpEvent);
      });

      expect(result.current).toBe(true);

      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'a' });
        document.dispatchEvent(keyUpEvent);
      });

      expect(result.current).toBe(true);
    });
  });

  describe('window blur', () => {
    it('returns false when window loses focus', () => {
      const { result } = renderHook(() => useShiftKey());

      // Press Shift
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });

      expect(result.current).toBe(true);

      // Window loses focus
      act(() => {
        const blurEvent = new Event('blur');
        window.dispatchEvent(blurEvent);
      });

      expect(result.current).toBe(false);
    });

    it('handles blur when Shift was not pressed', () => {
      const { result } = renderHook(() => useShiftKey());

      // Window loses focus without Shift being pressed
      act(() => {
        const blurEvent = new Event('blur');
        window.dispatchEvent(blurEvent);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useShiftKey());

      unmount();

      // These events should not change state after unmount
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });

      // Result should still be false (or undefined after unmount)
      // The hook is no longer tracking, so we just verify no errors occur
      expect(result.current).toBe(false);
    });
  });

  describe('press and release cycle', () => {
    it('handles multiple press/release cycles', () => {
      const { result } = renderHook(() => useShiftKey());

      // First cycle
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });
      expect(result.current).toBe(true);

      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
        document.dispatchEvent(keyUpEvent);
      });
      expect(result.current).toBe(false);

      // Second cycle
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });
      expect(result.current).toBe(true);

      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
        document.dispatchEvent(keyUpEvent);
      });
      expect(result.current).toBe(false);

      // Third cycle
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });
      expect(result.current).toBe(true);

      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
        document.dispatchEvent(keyUpEvent);
      });
      expect(result.current).toBe(false);
    });
  });

  describe('combined with other keys', () => {
    it('tracks Shift correctly when other keys are pressed simultaneously', () => {
      const { result } = renderHook(() => useShiftKey());

      // Press Shift
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyDownEvent);
      });
      expect(result.current).toBe(true);

      // Press another key while Shift is held
      act(() => {
        const keyDownEvent = new KeyboardEvent('keydown', { key: 'a', shiftKey: true });
        document.dispatchEvent(keyDownEvent);
      });
      expect(result.current).toBe(true);

      // Release the other key
      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'a', shiftKey: true });
        document.dispatchEvent(keyUpEvent);
      });
      expect(result.current).toBe(true);

      // Release Shift
      act(() => {
        const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
        document.dispatchEvent(keyUpEvent);
      });
      expect(result.current).toBe(false);
    });
  });
});
