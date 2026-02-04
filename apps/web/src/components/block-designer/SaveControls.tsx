'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Save, Upload, Loader2 } from 'lucide-react';
import { useBlockDesignerStore, serializeBlockForDb, validateBlockForPublish } from '@quillty/core';
import { useAuth, useCreateBlock, useUpdateBlock } from '@quillty/api';
import { PublishModal } from './PublishModal';

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY = 30000;

interface SaveControlsProps {
  /** Callback when block is successfully published */
  onPublished?: (blockId: string) => void;
}

export function SaveControls({ onPublished }: SaveControlsProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const block = useBlockDesignerStore((state) => state.block);
  const setBlockId = useBlockDesignerStore((state) => state.updateBlockMetadata);

  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Track if we have unsaved changes (simple version - tracks any change after last save)
  const lastShapesRef = useRef<string>(JSON.stringify(block.shapes));
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!user && !isAuthLoading;

  // Validate block for publishing
  const publishValidation = validateBlockForPublish(block);

  // Save draft handler
  const handleSaveDraft = useCallback(async () => {
    if (!user?.id) {
      setSaveError('Please sign in to save your block');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const persistData = serializeBlockForDb(block);

      if (block.id && block.id !== '') {
        // Update existing block
        await updateBlock.mutateAsync({
          id: block.id,
          name: persistData.name,
          description: persistData.description,
          grid_size: persistData.gridSize,
          design_data: persistData.designData as never,
          piece_count: persistData.pieceCount,
        });
      } else {
        // Create new block
        const newBlock = await createBlock.mutateAsync({
          creator_id: user.id,
          name: persistData.name,
          description: persistData.description,
          grid_size: persistData.gridSize,
          design_data: persistData.designData as never,
          piece_count: persistData.pieceCount,
          status: 'draft',
        });

        // Update the store with the new block ID
        setBlockId({ title: block.title });
        // We need to update the block ID in the store
        // For now, we'll use the title update as a workaround
        // TODO: Add setBlockId action to store
        useBlockDesignerStore.setState((state) => ({
          ...state,
          block: { ...state.block, id: newBlock.id },
        }));
      }

      setLastSaved(new Date());
      lastShapesRef.current = JSON.stringify(block.shapes);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, block, createBlock, updateBlock, setBlockId]);

  // Auto-save effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const currentShapes = JSON.stringify(block.shapes);
    const hasChanges = currentShapes !== lastShapesRef.current;

    if (hasChanges) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [block.shapes, isAuthenticated, handleSaveDraft]);

  // Handle publish button click
  const handlePublishClick = useCallback(() => {
    if (!publishValidation.valid) {
      setSaveError(publishValidation.error || 'Cannot publish');
      return;
    }

    // Save first if there are unsaved changes
    const currentShapes = JSON.stringify(block.shapes);
    if (currentShapes !== lastShapesRef.current && block.id) {
      handleSaveDraft();
    }

    setShowPublishModal(true);
  }, [publishValidation, block, handleSaveDraft]);

  // Handle successful publish
  const handlePublished = useCallback(
    (blockId: string) => {
      setShowPublishModal(false);
      onPublished?.(blockId);
    },
    [onPublished]
  );

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Last saved indicator */}
        {lastSaved && !isSaving && (
          <span className="text-xs text-gray-400 hidden sm:inline">
            Saved {formatLastSaved(lastSaved)}
          </span>
        )}

        {/* Error message */}
        {saveError && (
          <span className="text-xs text-red-500 hidden sm:inline">{saveError}</span>
        )}

        {/* Save Draft button */}
        <button
          onClick={handleSaveDraft}
          disabled={!isAuthenticated || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isAuthenticated ? 'Sign in to save' : 'Save draft'}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>

        {/* Publish button */}
        <button
          onClick={handlePublishClick}
          disabled={!isAuthenticated || !publishValidation.valid || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !isAuthenticated
              ? 'Sign in to publish'
              : !publishValidation.valid
                ? publishValidation.error
                : 'Publish block'
          }
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          onPublished={handlePublished}
        />
      )}
    </>
  );
}
