import { useEffect } from 'react';
import { useBlockDesignerStore } from '@quillty/core';

/**
 * Hook to handle keyboard shortcut for deleting selected shape.
 * - Delete or Backspace: Delete selected shape
 *
 * Only triggers when a shape is selected and user is not typing in an input.
 */
export function useDeleteKeyboard() {
  const selectedShapeId = useBlockDesignerStore((state) => state.selectedShapeId);
  const removeShape = useBlockDesignerStore((state) => state.removeShape);

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
        if (selectedShapeId) {
          event.preventDefault();
          removeShape(selectedShapeId);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, removeShape]);
}
