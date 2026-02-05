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

    // Use requestAnimationFrame + small delay to ensure the component is fully
    // rendered and the initial click cycle has completed before listening.
    // Using 'click' instead of 'mousedown' avoids timing issues with Konva canvas.
    const frameId = requestAnimationFrame(() => {
      document.addEventListener('click', handleClickOutside);
    });

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [ref, onDismiss]);
}
