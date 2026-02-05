import { useEffect } from 'react';
import { usePatternDesignerStore } from '@quillty/core';

/**
 * Hook to handle keyboard shortcuts for undo/redo in Pattern Designer.
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 */
export function usePatternUndoRedoKeyboard() {
  const undo = usePatternDesignerStore((state) => state.undo);
  const redo = usePatternDesignerStore((state) => state.redo);
  const canUndo = usePatternDesignerStore((state) => state.canUndo);
  const canRedo = usePatternDesignerStore((state) => state.canRedo);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key === 'z') {
        event.preventDefault();

        if (event.shiftKey) {
          // Cmd/Ctrl+Shift+Z = Redo
          if (canRedo()) {
            redo();
          }
        } else {
          // Cmd/Ctrl+Z = Undo
          if (canUndo()) {
            undo();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
