'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { useBlockDesignerStore, useCanUndo, useCanRedo } from '@quillty/core';
import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';

export function UndoRedoControls() {
  const undo = useBlockDesignerStore((state) => state.undo);
  const redo = useBlockDesignerStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Enable keyboard shortcuts
  useUndoRedoKeyboard();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 className="w-4 h-4 text-gray-700" />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
}
