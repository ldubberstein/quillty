'use client';

import { useCallback } from 'react';
import { Check } from 'lucide-react';
import { useBlockDesignerStore } from '@quillty/core';
import type { FabricRoleId } from '@quillty/core';
import { ColorSwatch, CollapsiblePanel, useSidebarPanel } from '../shared';

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

  const { isExpanded, toggle } = useSidebarPanel('fabrics');
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

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      setRoleColor(roleId, color);
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

  // Header action: paint mode badge
  const headerActions = isPaintMode ? (
    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
      Paint Mode
    </span>
  ) : undefined;

  return (
    <CollapsiblePanel
      title="Fabrics"
      isExpanded={isExpanded}
      onToggle={toggle}
      summary={collapsedSummary}
      headerActions={headerActions}
      showBorder={false}
    >
      <p className="text-xs text-gray-400 mb-3">
        {isPaintMode
          ? 'Tap shapes on the canvas to paint them'
          : 'Select a fabric role, then tap shapes to paint'}
      </p>

      <div className="space-y-2">
        {palette.roles.map((role) => {
          const isActive = activeFabricRole === role.id;

          return (
            <div
              key={role.id}
              onClick={() => handleRoleClick(role.id)}
              className={`
                flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
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
              {/* Color swatch with picker */}
              <ColorSwatch
                color={role.color}
                size="lg"
                selected={isActive}
                onClick={(e) => e.stopPropagation()}
                onChange={(color) => handleColorChange(role.id, color)}
                aria-label={`Change ${role.name} color`}
              />

              {/* Role name and hex */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{role.name}</p>
                <p className="text-xs text-gray-400 uppercase">{role.color}</p>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="flex-shrink-0">
                  <Check className="w-5 h-5 text-blue-600" />
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
          className="w-full mt-3 py-2 px-4 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Exit Paint Mode
        </button>
      )}
    </CollapsiblePanel>
  );
}
