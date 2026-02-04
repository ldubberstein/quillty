'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePatternDesignerStore, usePatternPalette } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';
import { useSidebarPanel } from './SidebarContext';

/**
 * PalettePanel - Right sidebar panel for pattern color selection
 *
 * Collapsible panel showing the pattern's 4 fabric roles with color swatches.
 * - Tap header to expand/collapse (accordion behavior - collapses other panels)
 * - When collapsed, shows color swatches inline as summary
 * - Tap a color swatch to open color picker
 * - Color changes update all placed blocks on canvas immediately
 */
export function PalettePanel() {
  const palette = usePatternPalette();
  const setRoleColor = usePatternDesignerStore((state) => state.setRoleColor);

  const { isExpanded, toggle } = useSidebarPanel('colors');
  const [editingRole, setEditingRole] = useState<FabricRoleId | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Handle color swatch click (open color picker)
  const handleColorClick = useCallback((roleId: FabricRoleId, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRole(roleId);
  }, []);

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      setRoleColor(roleId, color);
    },
    [setRoleColor]
  );

  // Close color picker
  const handleColorPickerClose = useCallback(() => {
    setEditingRole(null);
  }, []);

  // Focus color input when editing
  useEffect(() => {
    if (editingRole && colorInputRef.current) {
      colorInputRef.current.click();
    }
  }, [editingRole]);

  return (
    <div className="p-3">
      {/* Collapsible header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Colors
          </h3>
        </div>

        {/* Collapsed summary: show color swatches inline */}
        {!isExpanded && (
          <div className="flex gap-1">
            {palette.roles.map((role) => (
              <div
                key={role.id}
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: role.color }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <>
          <p className="text-xs text-gray-400 mt-2 mb-3">
            Tap a swatch to change colors
          </p>

          <div className="space-y-2">
            {palette.roles.map((role) => {
              const isEditing = editingRole === role.id;

              return (
                <div
                  key={role.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Color swatch */}
                  <div className="relative">
                    <button
                      onClick={(e) => handleColorClick(role.id, e)}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: role.color }}
                      aria-label={`Change ${role.name} color`}
                    />
                    {isEditing && (
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={role.color}
                        onChange={(e) => handleColorChange(role.id, e.target.value)}
                        onBlur={handleColorPickerClose}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Role name and hex */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {role.name}
                    </p>
                    <p className="text-xs text-gray-400 uppercase">
                      {role.color}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
