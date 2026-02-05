'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track whether the Shift key is currently held down.
 * Useful for implementing spreadsheet-like shift-click range selection.
 *
 * @returns true while Shift is pressed, false otherwise
 */
export function useShiftKey(): boolean {
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Shift') {
        setIsShiftHeld(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Shift') {
        setIsShiftHeld(false);
      }
    }

    // Reset state if user switches windows/tabs while holding shift
    function handleBlur() {
      setIsShiftHeld(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isShiftHeld;
}
