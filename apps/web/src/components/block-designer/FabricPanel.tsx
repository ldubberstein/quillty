'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useBlockDesignerStore } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';

/**
 * FabricPanel - Sidebar panel for fabric/color assignment
 *
 * Shows the block's palette roles with color swatches.
 * - Tap a role to enter paint mode (tap shapes to assign)
 * - Tap a color swatch to open color picker
 */
export function FabricPanel() {
  const palette = useBlockDesignerStore((state) => state.block.previewPalette);
  const activeFabricRole = useBlockDesignerStore((state) => state.activeFabricRole);
  const mode = useBlockDesignerStore((state) => state.mode);
  const setActiveFabricRole = useBlockDesignerStore((state) => state.setActiveFabricRole);
  const setRoleColor = useBlockDesignerStore((state) => state.setRoleColor);

  const [editingRole, setEditingRole] = useState<FabricRoleId | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const isPaintMode = mode === 'paint_mode';

  // Handle role selection for paint mode
  const handleRoleClick = useCallback(
    (roleId: FabricRoleId) => {
      if (activeFabricRole === roleId) {
        // Clicking active role exits paint mode
        setActiveFabricRole(null);
      } else {
        // Enter paint mode with this role
        setActiveFabricRole(roleId);
      }
    },
    [activeFabricRole, setActiveFabricRole]
  );

  // Handle color swatch click (open color picker)
  const handleColorClick = useCallback(
    (e: React.MouseEvent, roleId: FabricRoleId) => {
      e.stopPropagation(); // Don't trigger role selection
      setEditingRole(roleId);
    },
    []
  );

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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Fabrics</h3>
        {isPaintMode && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Paint Mode
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {isPaintMode
          ? 'Tap shapes on the canvas to paint them'
          : 'Select a fabric role, then tap shapes to paint'}
      </p>

      <div className="space-y-2">
        {palette.roles.map((role) => {
          const isActive = activeFabricRole === role.id;
          const isEditing = editingRole === role.id;

          return (
            <div
              key={role.id}
              onClick={() => handleRoleClick(role.id)}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                ${
                  isActive
                    ? 'bg-blue-50 ring-2 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }
              `}
              role="button"
              aria-pressed={isActive}
              aria-label={`Select ${role.name} for painting`}
            >
              {/* Color swatch */}
              <div className="relative">
                <button
                  onClick={(e) => handleColorClick(e, role.id)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Role name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{role.name}</p>
                <p className="text-xs text-gray-500 uppercase">{role.color}</p>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exit paint mode button */}
      {isPaintMode && (
        <button
          onClick={() => setActiveFabricRole(null)}
          className="w-full mt-4 py-2 px-4 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Exit Paint Mode
        </button>
      )}
    </div>
  );
}
