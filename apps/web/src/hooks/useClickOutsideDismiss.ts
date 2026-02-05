import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Hook to dismiss a component when clicking outside of it.
 * Uses a small delay to prevent the triggering click from causing immediate dismissal.
 */
export function useClickOutsideDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    // Delay prevents immediate dismissal from the same click that opened the popup
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onDismiss]);
}
