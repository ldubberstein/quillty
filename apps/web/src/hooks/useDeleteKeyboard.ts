import { useEffect } from 'react';
import { useBlockDesignerStore } from '@quillty/core';

/**
 * Hook to handle keyboard shortcut for deleting selected unit.
 * - Delete or Backspace: Delete selected unit
 *
 * Only triggers when a unit is selected and user is not typing in an input.
 */
export function useDeleteKeyboard() {
  const selectedUnitId = useBlockDesignerStore((state) => state.selectedUnitId);
  const removeUnit = useBlockDesignerStore((state) => state.removeUnit);

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
        if (selectedUnitId) {
          event.preventDefault();
          removeUnit(selectedUnitId);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId, removeUnit]);
}
