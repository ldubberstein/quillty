'use client';

import { useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { usePatternDesignerStore, usePatternPalette, MAX_PALETTE_ROLES } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';
import { useSidebarPanel } from './SidebarContext';
import { ColorSwatch, CollapsiblePanel } from '../shared';

/**
 * PalettePanel - Right sidebar panel for pattern color selection
 *
 * Collapsible panel showing the pattern's fabric roles with color swatches.
 * - Tap header to expand/collapse (accordion behavior - collapses other panels)
 * - When collapsed, shows color swatches inline as summary
 * - Tap a color swatch to open color picker
 * - Add/remove color roles
 * - Color changes update all placed blocks on canvas immediately
 */
export function PalettePanel() {
  const palette = usePatternPalette();
  const setRoleColor = usePatternDesignerStore((state) => state.setRoleColor);
  const addRole = usePatternDesignerStore((state) => state.addRole);
  const removeRole = usePatternDesignerStore((state) => state.removeRole);
  const canRemoveRole = usePatternDesignerStore((state) => state.canRemoveRole);
  const { isExpanded, toggle } = useSidebarPanel('colors');

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      setRoleColor(roleId, color);
    },
    [setRoleColor]
  );

  // Handle add role
  const handleAddRole = useCallback(() => {
    addRole();
  }, [addRole]);

  // Handle remove role
  const handleRemoveRole = useCallback(
    (roleId: FabricRoleId) => {
      removeRole(roleId);
    },
    [removeRole]
  );

  const canAdd = palette.roles.length < MAX_PALETTE_ROLES;
  const canRemove = canRemoveRole();

  // Build collapsed summary: inline color swatches
  const collapsedSummary = (
    <div className="flex gap-1 flex-wrap">
      {palette.roles.slice(0, 8).map((role) => (
        <ColorSwatch
          key={role.id}
          color={role.color}
          size="sm"
          aria-label={role.name}
        />
      ))}
      {palette.roles.length > 8 && (
        <span className="text-xs text-gray-400 self-center">+{palette.roles.length - 8}</span>
      )}
    </div>
  );

  return (
    <CollapsiblePanel
      title="Colors"
      isExpanded={isExpanded}
      onToggle={toggle}
      summary={collapsedSummary}
      showBorder={false}
    >
      <p className="text-xs text-gray-400 mb-2">
        Tap a swatch to change colors
      </p>

      <div className="space-y-1">
        {palette.roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center gap-2 p-1 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Color swatch with picker */}
            <ColorSwatch
              color={role.color}
              size="sm"
              onChange={(color) => handleColorChange(role.id, color)}
              aria-label={`Change ${role.name} color`}
              className="w-6 h-6"
            />

            {/* Role name */}
            <span className="text-xs font-medium text-gray-700 truncate flex-1">
              {role.name}
            </span>

            {/* Remove button */}
            {canRemove && (
              <button
                onClick={() => handleRemoveRole(role.id)}
                className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label={`Remove ${role.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add color button and count */}
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={handleAddRole}
          disabled={!canAdd}
          className={`
            flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors
            ${
              canAdd
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }
          `}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
        <span className="text-xs text-gray-400">
          {palette.roles.length}/{MAX_PALETTE_ROLES}
        </span>
      </div>
    </CollapsiblePanel>
  );
}
