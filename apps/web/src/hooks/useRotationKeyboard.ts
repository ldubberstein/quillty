import { useEffect } from 'react';
import { usePatternDesignerStore } from '@quillty/core';

/**
 * Hook to handle R key for rotation in Pattern Designer.
 *
 * - In placement mode (placing_block): Rotates the placement rotation (ghost preview)
 * - In editing mode (editing_block) with selected block: Rotates the selected block instance
 */
export function useRotationKeyboard() {
  const mode = usePatternDesignerStore((state) => state.mode);
  const selectedBlockInstanceId = usePatternDesignerStore((state) => state.selectedBlockInstanceId);
  const rotatePlacementClockwise = usePatternDesignerStore((state) => state.rotatePlacementClockwise);
  const rotateBlockInstance = usePatternDesignerStore((state) => state.rotateBlockInstance);

  useEffect(() => {
    // Only listen for R key when in placement or editing mode
    const isPlacing = mode === 'placing_block';
    const isEditing = mode === 'editing_block' && selectedBlockInstanceId !== null;

    if (!isPlacing && !isEditing) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Check for R key (case-insensitive)
      if (event.key === 'r' || event.key === 'R') {
        // Don't intercept if modifier keys are held (allow Cmd+R for refresh, etc.)
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        event.preventDefault();

        if (isPlacing) {
          // Rotate placement rotation (ghost preview)
          rotatePlacementClockwise();
        } else if (isEditing && selectedBlockInstanceId) {
          // Rotate the selected placed block
          rotateBlockInstance(selectedBlockInstanceId);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedBlockInstanceId, rotatePlacementClockwise, rotateBlockInstance]);
}
