'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePatternDesignerStore, useGridSize, useIsDirty, useCanPublish, useEmptySlotCount, usePatternId } from '@quillty/core';
import { useAuth, useCreatePattern, useUpdatePattern } from '@quillty/api';
import { SizePicker } from '@/components/pattern-designer/SizePicker';
import { PublishModal } from '@/components/pattern-designer/PublishModal';
import { SidebarProvider } from '@/components/pattern-designer/SidebarContext';
import { usePatternDeleteKeyboard } from '@/hooks';

// Dynamic imports for components that use Konva
const PatternCanvas = dynamic(
  () => import('@/components/pattern-designer/PatternCanvas').then((mod) => mod.PatternCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    ),
  }
);

const BlockLibraryPanel = dynamic(
  () => import('@/components/pattern-designer/BlockLibraryPanel').then((mod) => mod.BlockLibraryPanel),
  { ssr: false }
);

// PalettePanel doesn't use Konva, but we still dynamic import it for consistency
const PalettePanel = dynamic(
  () => import('@/components/pattern-designer/PalettePanel').then((mod) => mod.PalettePanel),
  { ssr: false }
);

// GridSizePanel for grid resize controls
const GridSizePanel = dynamic(
  () => import('@/components/pattern-designer/GridSizePanel').then((mod) => mod.GridSizePanel),
  { ssr: false }
);

// BorderPanel for border configuration
const BorderPanel = dynamic(
  () => import('@/components/pattern-designer/BorderPanel').then((mod) => mod.BorderPanel),
  { ssr: false }
);

// InstanceColorPanel for per-block color customization
const InstanceColorPanel = dynamic(
  () => import('@/components/pattern-designer/InstanceColorPanel').then((mod) => mod.InstanceColorPanel),
  { ssr: false }
);

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY = 30000;

export default function PatternDesignerPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const initPattern = usePatternDesignerStore((state) => state.initPattern);
  const pattern = usePatternDesignerStore((state) => state.pattern);
  const markAsSaved = usePatternDesignerStore((state) => state.markAsSaved);
  const gridSize = useGridSize();
  const isDirty = useIsDirty();
  const canPublish = useCanPublish();
  const emptySlotCount = useEmptySlotCount();
  const patternId = usePatternId();

  const createPattern = useCreatePattern();
  const updatePattern = useUpdatePattern();

  // Enable Delete/Backspace key to delete selected block instance
  usePatternDeleteKeyboard();

  // Track if we're showing the size picker (on initial load)
  const [showSizePicker, setShowSizePicker] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const hasInitialized = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Check if pattern is empty (just initialized)
  const isPatternEmpty = pattern.blockInstances.length === 0 && pattern.title === '';
  const isAuthenticated = !!user && !isAuthLoading;

  // On mount, check if we need to show size picker
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // If pattern already has content, don't show size picker
    if (!isPatternEmpty) {
      setShowSizePicker(false);
    }
  }, [isPatternEmpty]);

  // Handle size picker confirmation
  const handleSizeConfirm = useCallback(
    (rows: number, cols: number) => {
      initPattern({ rows, cols });
      setShowSizePicker(false);
    },
    [initPattern]
  );

  // Handle navigation back (with unsaved changes warning)
  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    // Navigate to home
    window.location.href = '/';
  }, [isDirty]);

  // Serialize pattern data for saving
  const serializePatternForSave = useCallback(() => {
    return {
      title: pattern.title || 'Untitled Pattern',
      description: pattern.description,
      designData: {
        version: 2 as const,
        gridSize: pattern.gridSize,
        blockInstances: pattern.blockInstances,
        palette: pattern.palette,
        borderConfig: pattern.borderConfig,
      },
      difficulty: pattern.difficulty,
      category: pattern.category,
    };
  }, [pattern]);

  // Save draft handler
  const handleSaveDraft = useCallback(async () => {
    if (!user?.id) {
      setSaveError('Please sign in to save your pattern');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const saveData = serializePatternForSave();

      if (patternId && patternId !== '') {
        // Update existing pattern
        await updatePattern.mutateAsync({
          id: patternId,
          ...saveData,
        });
      } else {
        // Create new pattern
        const newPattern = await createPattern.mutateAsync(saveData);
        // Update the store with the new pattern ID
        markAsSaved(newPattern.id);
      }

      setLastSaved(new Date());
      lastSavedDataRef.current = JSON.stringify(saveData);
      markAsSaved(patternId || undefined);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, patternId, serializePatternForSave, createPattern, updatePattern, markAsSaved]);

  // Auto-save effect
  useEffect(() => {
    if (!isAuthenticated || showSizePicker) return;

    const currentData = JSON.stringify(serializePatternForSave());
    const hasChanges = currentData !== lastSavedDataRef.current;

    if (hasChanges && isDirty) {
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
  }, [pattern, isAuthenticated, showSizePicker, isDirty, serializePatternForSave, handleSaveDraft]);

  // Handle publish button click
  const handlePublishClick = useCallback(() => {
    if (!canPublish) {
      if (emptySlotCount > 0) {
        setSaveError(`Fill all ${emptySlotCount} empty slot${emptySlotCount > 1 ? 's' : ''} to publish`);
      }
      return;
    }

    // Save first if there are unsaved changes
    if (isDirty && patternId) {
      handleSaveDraft();
    }

    setShowPublishModal(true);
  }, [canPublish, emptySlotCount, isDirty, patternId, handleSaveDraft]);

  // Handle successful publish
  const handlePublished = useCallback((publishedPatternId: string) => {
    setShowPublishModal(false);
    // Navigate to the published pattern
    router.push(`/pattern/${publishedPatternId}`);
  }, [router]);

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

  // Show size picker on initial load
  if (showSizePicker) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Back to home"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">New Pattern</h1>
          </div>
        </header>

        {/* Size Picker */}
        <main className="flex-1 flex items-center justify-center p-4">
          <SizePicker onConfirm={handleSizeConfirm} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Pattern Designer</h1>
          <div className="w-px h-6 bg-gray-200" />
          <span className="text-sm text-gray-500">
            {gridSize.rows}×{gridSize.cols} grid
          </span>
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
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

          {/* Sign in prompt when not authenticated */}
          {!isAuthenticated && !isAuthLoading && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in to save
            </Link>
          )}

          {/* Save/Publish buttons when authenticated */}
          {isAuthenticated && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save draft"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handlePublishClick}
                  disabled={!canPublish || isSaving || !patternId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!patternId ? 'Save draft first' : !canPublish ? `Fill all ${emptySlotCount} empty slots to publish` : 'Publish pattern'}
                >
                  Publish
                </button>
                {!patternId && (
                  <span className="text-xs text-gray-500">Save draft first</span>
                )}
                {patternId && !canPublish && emptySlotCount > 0 && (
                  <span className="text-xs text-amber-600">
                    {emptySlotCount} slot{emptySlotCount > 1 ? 's' : ''} empty
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content: Two-sidebar layout (Figma pattern) */}
      <main className="flex-1 flex min-h-0">
        {/* Left Sidebar - Block Library */}
        <aside className="w-52 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <BlockLibraryPanel />
        </aside>

        {/* Center - Canvas (maximized for square-ish quilts) */}
        <div className="flex-1 min-w-0">
          <PatternCanvas />
        </div>

        {/* Right Sidebar - Block Colors + Pattern Palette + Borders + Grid Size */}
        <aside className="w-48 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <SidebarProvider defaultPanel="colors" mode="multi">
            <InstanceColorPanel />
            <PalettePanel />
            <BorderPanel />
            <GridSizePanel />
          </SidebarProvider>
        </aside>
      </main>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
