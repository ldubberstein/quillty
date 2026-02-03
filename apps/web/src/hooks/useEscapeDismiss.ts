import { useEffect } from 'react';

/**
 * Hook to dismiss a component when Escape key is pressed.
 */
export function useEscapeDismiss(onDismiss: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);
}
