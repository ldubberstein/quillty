'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { usePatternDesignerStore, useEmptySlotCount } from '@quillty/core';
import { usePublishPattern, useUpdatePattern } from '@quillty/api';

/** Maximum title length for patterns */
const PATTERN_TITLE_MAX_LENGTH = 100;

/** Maximum description length for patterns */
const PATTERN_DESCRIPTION_MAX_LENGTH = 2000;

interface PublishModalProps {
  onClose: () => void;
  onPublished: (patternId: string) => void;
}

export function PublishModal({ onClose, onPublished }: PublishModalProps) {
  const pattern = usePatternDesignerStore((state) => state.pattern);
  const updatePatternMetadata = usePatternDesignerStore((state) => state.updatePatternMetadata);
  const emptySlotCount = useEmptySlotCount();

  const publishPattern = usePublishPattern();
  const updatePattern = useUpdatePattern();

  const [title, setTitle] = useState(pattern.title || '');
  const [description, setDescription] = useState(pattern.description || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > PATTERN_TITLE_MAX_LENGTH) {
      errors.push(`Title must be ${PATTERN_TITLE_MAX_LENGTH} characters or less`);
    }

    if (emptySlotCount > 0) {
      errors.push(`${emptySlotCount} empty slot${emptySlotCount > 1 ? 's' : ''} remaining. Fill all slots to publish.`);
    }

    if (!pattern.id) {
      errors.push('Pattern must be saved as a draft first');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [title, emptySlotCount, pattern.id]);

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
    if (!validation.valid || !pattern.id) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // First update the pattern with the new title/description
      await updatePattern.mutateAsync({
        id: pattern.id,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Then publish it (free for now)
      await publishPattern.mutateAsync({
        id: pattern.id,
        title: title.trim(),
        description: description.trim() || undefined,
        publishInput: { type: 'free' },
      });

      // Update local store
      updatePatternMetadata({
        title: title.trim(),
        description: description.trim() || null,
      });

      onPublished(pattern.id);
    } catch (err) {
      console.error('Failed to publish:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish pattern');
    } finally {
      setIsPublishing(false);
    }
  }, [validation.valid, pattern.id, title, description, updatePattern, publishPattern, updatePatternMetadata, onPublished]);

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
          <h2 className="text-lg font-semibold text-gray-900">Publish Pattern</h2>
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
          {/* Title field */}
          <div>
            <label htmlFor="pattern-title" className="block text-sm font-medium text-gray-700 mb-1">
              Pattern Name <span className="text-red-500">*</span>
            </label>
            <input
              id="pattern-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your pattern a name"
              maxLength={PATTERN_TITLE_MAX_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {title.length}/{PATTERN_TITLE_MAX_LENGTH}
            </div>
          </div>

          {/* Description field */}
          <div>
            <label htmlFor="pattern-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              id="pattern-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your quilt pattern design"
              maxLength={PATTERN_DESCRIPTION_MAX_LENGTH}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {description.length}/{PATTERN_DESCRIPTION_MAX_LENGTH}
            </div>
          </div>

          {/* Grid info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Grid:</span>
            <span className="font-medium">{pattern.gridSize.rows}×{pattern.gridSize.cols}</span>
            <span className="text-gray-400">({pattern.gridSize.rows * pattern.gridSize.cols} blocks)</span>
          </div>

          {/* Validation errors */}
          {validation.errors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {validation.errors.map((err, i) => (
                    <p key={i} className="text-sm text-amber-700">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
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
            disabled={!validation.valid || isPublishing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
