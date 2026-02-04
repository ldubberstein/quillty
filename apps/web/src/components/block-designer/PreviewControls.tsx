'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import {
  useBlockDesignerStore,
  useIsPreviewMode,
  usePreviewRotationPreset,
  type PreviewRotationPreset,
} from '@quillty/core';

/** Rotation preset options with labels */
const ROTATION_PRESETS: { value: PreviewRotationPreset; label: string; description: string }[] = [
  { value: 'all_same', label: 'All Same', description: 'All blocks at 0°' },
  { value: 'alternating', label: 'Alternating', description: 'Checkerboard 0°/90°' },
  { value: 'pinwheel', label: 'Pinwheel', description: '0°, 90°, 180°, 270°' },
  { value: 'random', label: 'Random', description: 'Random rotations' },
];

export function PreviewControls() {
  const isPreviewMode = useIsPreviewMode();
  const currentPreset = usePreviewRotationPreset();
  const enterPreview = useBlockDesignerStore((state) => state.enterPreview);
  const exitPreview = useBlockDesignerStore((state) => state.exitPreview);
  const setPreviewRotationPreset = useBlockDesignerStore(
    (state) => state.setPreviewRotationPreset
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleTogglePreview = () => {
    if (isPreviewMode) {
      exitPreview();
    } else {
      enterPreview();
    }
  };

  const handlePresetChange = (preset: PreviewRotationPreset) => {
    setPreviewRotationPreset(preset);
    setIsDropdownOpen(false);
  };

  const currentPresetLabel =
    ROTATION_PRESETS.find((p) => p.value === currentPreset)?.label ?? 'All Same';

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Single button when not in preview mode */}
      {!isPreviewMode && (
        <button
          onClick={handleTogglePreview}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Enter preview mode"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>
      )}

      {/* Button group when in preview mode */}
      {isPreviewMode && (
        <div className="flex items-center rounded-lg overflow-hidden border border-purple-600 bg-purple-600">
          {/* Exit preview button */}
          <button
            onClick={handleTogglePreview}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            aria-label="Exit preview mode"
          >
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-purple-400" />

          {/* Dropdown toggle */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            aria-label="Select rotation preset"
            aria-expanded={isDropdownOpen}
          >
            <span className="hidden sm:inline">{currentPresetLabel}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      )}

      {/* Dropdown menu */}
      {isPreviewMode && isDropdownOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {ROTATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  currentPreset === preset.value
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="text-xs text-gray-500">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
