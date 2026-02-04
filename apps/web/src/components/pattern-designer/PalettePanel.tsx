'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { usePatternDesignerStore, usePatternPalette } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';

/**
 * PalettePanel - Right sidebar panel for pattern color selection
 *
 * Shows the pattern's 4 fabric roles with color swatches.
 * - Tap a color swatch to open color picker
 * - Color changes update all placed blocks on canvas immediately
 * - Library thumbnails remain in original colors (per design decision)
 */
export function PalettePanel() {
  const palette = usePatternPalette();
  const setRoleColor = usePatternDesignerStore((state) => state.setRoleColor);

  const [editingRole, setEditingRole] = useState<FabricRoleId | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Handle color swatch click (open color picker)
  const handleColorClick = useCallback((roleId: FabricRoleId) => {
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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Colors
      </h3>

      <p className="text-xs text-gray-400 mb-4">
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
                  onClick={() => handleColorClick(role.id)}
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
    </div>
  );
}
