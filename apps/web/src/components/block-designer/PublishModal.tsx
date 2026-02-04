'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Loader2, Hash } from 'lucide-react';
import { useBlockDesignerStore, extractHashtags, BLOCK_TITLE_MAX_LENGTH, BLOCK_DESCRIPTION_MAX_LENGTH } from '@quillty/core';
import { usePublishBlock, useUpdateBlock } from '@quillty/api';

interface PublishModalProps {
  onClose: () => void;
  onPublished: (blockId: string) => void;
}

export function PublishModal({ onClose, onPublished }: PublishModalProps) {
  const block = useBlockDesignerStore((state) => state.block);
  const updateBlockMetadata = useBlockDesignerStore((state) => state.updateBlockMetadata);

  const publishBlock = usePublishBlock();
  const updateBlock = useUpdateBlock();

  const [name, setName] = useState(block.title || '');
  const [description, setDescription] = useState(block.description || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract hashtags from description
  const hashtags = useMemo(() => extractHashtags(description), [description]);

  // Validation
  const isValid = useMemo(() => {
    return name.trim().length > 0 && name.length <= BLOCK_TITLE_MAX_LENGTH;
  }, [name]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!isValid || !block.id) {
      if (!block.id) {
        setError('Please save the block as a draft first');
      }
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // First update the block with the new name/description
      await updateBlock.mutateAsync({
        id: block.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Then publish it
      await publishBlock.mutateAsync({
        id: block.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Update local store
      updateBlockMetadata({
        title: name.trim(),
        description: description.trim() || undefined,
      });

      onPublished(block.id);
    } catch (err) {
      console.error('Failed to publish:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish block');
    } finally {
      setIsPublishing(false);
    }
  }, [isValid, block.id, name, description, updateBlock, publishBlock, updateBlockMetadata, onPublished]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Publish Block</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Name field */}
          <div>
            <label htmlFor="block-name" className="block text-sm font-medium text-gray-700 mb-1">
              Block Name <span className="text-red-500">*</span>
            </label>
            <input
              id="block-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your block a name"
              maxLength={BLOCK_TITLE_MAX_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {name.length}/{BLOCK_TITLE_MAX_LENGTH}
            </div>
          </div>

          {/* Description field */}
          <div>
            <label htmlFor="block-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              id="block-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your block design. Use #hashtags for discoverability!"
              maxLength={BLOCK_DESCRIPTION_MAX_LENGTH}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {description.length}/{BLOCK_DESCRIPTION_MAX_LENGTH}
            </div>
          </div>

          {/* Hashtags preview */}
          {hashtags.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <Hash className="w-3 h-3" />
                Detected tags
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {/* No block ID warning */}
          {!block.id && (
            <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-lg">
              Save your block as a draft before publishing.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!isValid || !block.id || isPublishing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
