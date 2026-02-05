import { useEffect } from 'react';
import { usePatternDesignerStore } from '@quillty/core';

/**
 * Hook to handle keyboard shortcut for deleting selected block instance.
 * - Delete or Backspace: Delete selected block instance
 *
 * Only triggers when a block instance is selected and user is not typing in an input.
 */
export function usePatternDeleteKeyboard() {
  const selectedBlockInstanceId = usePatternDesignerStore(
    (state) => state.selectedBlockInstanceId
  );
  const removeBlockInstance = usePatternDesignerStore(
    (state) => state.removeBlockInstance
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger if typing in an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Delete or Backspace key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedBlockInstanceId) {
          event.preventDefault();
          removeBlockInstance(selectedBlockInstanceId);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockInstanceId, removeBlockInstance]);
}
