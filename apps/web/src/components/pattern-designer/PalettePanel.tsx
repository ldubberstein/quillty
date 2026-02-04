'use client';

import { useCallback, useState } from 'react';
import { usePatternDesignerStore, usePatternPalette } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';
import { useSidebarPanel } from './SidebarContext';
import { ColorSwatch, CollapsiblePanel } from '../shared';

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

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      setRoleColor(roleId, color);
      setEditingRole(null);
    },
    [setRoleColor]
  );

  // Build collapsed summary: inline color swatches
  const collapsedSummary = (
    <div className="flex gap-1">
      {palette.roles.map((role) => (
        <ColorSwatch
          key={role.id}
          color={role.color}
          size="sm"
          aria-label={role.name}
        />
      ))}
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
      <p className="text-xs text-gray-400 mb-3">
        Tap a swatch to change colors
      </p>

      <div className="space-y-2">
        {palette.roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Color swatch with picker */}
            <ColorSwatch
              color={role.color}
              size="md"
              onChange={(color) => handleColorChange(role.id, color)}
              aria-label={`Change ${role.name} color`}
            />

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
        ))}
      </div>
    </CollapsiblePanel>
  );
}
