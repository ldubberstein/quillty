'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import {
  usePatternDesignerStore,
  useSelectedBlockInstance,
  usePatternPalette,
} from '@quillty/core';
import type { Block, Shape, FabricRoleId } from '@quillty/core';
import { useSidebarPanel } from './SidebarContext';
import { ColorSwatch, CollapsiblePanel } from '../shared';

/**
 * Helper to extract shapes from a block
 * Handles both direct shapes array and API format with design_data JSON
 */
function getBlockShapes(block: { shapes?: Shape[]; design_data?: unknown } | null): Shape[] {
  if (!block) return [];

  // Direct shapes array (from core Block type)
  if (block.shapes && Array.isArray(block.shapes)) {
    return block.shapes;
  }

  // API format: design_data is a JSON object with shapes
  if (block.design_data) {
    try {
      const designData =
        typeof block.design_data === 'string'
          ? JSON.parse(block.design_data)
          : block.design_data;
      return (designData as { shapes?: Shape[] }).shapes ?? [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Extract all fabric role IDs used by a block's shapes
 */
function getRolesUsedByBlock(block: Block | null): Set<string> {
  const roles = new Set<string>();
  if (!block) return roles;

  const shapes = getBlockShapes(block);

  for (const shape of shapes) {
    if (shape.type === 'square') {
      roles.add(shape.fabricRole);
    } else if (shape.type === 'hst') {
      roles.add(shape.fabricRole);
      roles.add(shape.secondaryFabricRole);
    } else if (shape.type === 'flying_geese') {
      roles.add(shape.partFabricRoles.goose);
      roles.add(shape.partFabricRoles.sky1);
      roles.add(shape.partFabricRoles.sky2);
    } else if (shape.type === 'qst') {
      roles.add(shape.partFabricRoles.top);
      roles.add(shape.partFabricRoles.right);
      roles.add(shape.partFabricRoles.bottom);
      roles.add(shape.partFabricRoles.left);
    }
  }

  return roles;
}

/**
 * InstanceColorPanel - Right sidebar panel for per-block color customization
 *
 * Shows when a block instance is selected on the canvas.
 * Allows overriding individual fabric role colors for just that block.
 * Non-overridden roles continue to use the pattern's palette.
 */
export function InstanceColorPanel() {
  const instance = useSelectedBlockInstance();
  const palette = usePatternPalette();
  const { isExpanded, toggle, expand } = useSidebarPanel('instance-colors');

  const blockCache = usePatternDesignerStore((s) => s.blockCache);
  const setInstanceRoleColor = usePatternDesignerStore((s) => s.setInstanceRoleColor);
  const resetInstanceRoleColor = usePatternDesignerStore((s) => s.resetInstanceRoleColor);
  const resetInstancePalette = usePatternDesignerStore((s) => s.resetInstancePalette);

  // Get block from cache to access shapes (may be null)
  const block = instance ? blockCache[instance.blockId] : null;

  // Auto-expand when a block is selected
  useEffect(() => {
    if (instance && block) {
      expand();
    }
  }, [instance?.id, block, expand]);

  // Extract fabric roles used by this block's shapes
  const rolesUsed = useMemo(() => getRolesUsedByBlock(block), [block]);

  // Filter palette roles to only those used by this block
  const relevantRoles = useMemo(
    () => palette.roles.filter((role) => rolesUsed.has(role.id)),
    [palette.roles, rolesUsed]
  );

  // Check if instance has any overrides
  const overrides = instance?.paletteOverrides ?? {};
  const hasOverrides = Object.keys(overrides).length > 0;
  const overrideCount = Object.keys(overrides).length;

  // Get effective color for a role (override or pattern palette)
  const getEffectiveColor = useCallback(
    (roleId: string): string => {
      if (overrides[roleId]) {
        return overrides[roleId];
      }
      const role = palette.roles.find((r) => r.id === roleId);
      return role?.color ?? '#CCCCCC';
    },
    [overrides, palette.roles]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      if (instance) {
        setInstanceRoleColor(instance.id, roleId, color);
      }
    },
    [instance, setInstanceRoleColor]
  );

  // Handle reset single role
  const handleResetRole = useCallback(
    (roleId: FabricRoleId) => {
      if (instance) {
        resetInstanceRoleColor(instance.id, roleId);
      }
    },
    [instance, resetInstanceRoleColor]
  );

  // Handle reset all overrides
  const handleResetAll = useCallback(() => {
    if (instance) {
      resetInstancePalette(instance.id);
    }
  }, [instance, resetInstancePalette]);

  // Don't render if no block instance is selected or block not in cache
  if (!instance || !block) return null;

  // Build collapsed summary
  const collapsedSummary = hasOverrides ? (
    <div className="flex items-center gap-1">
      <span className="text-xs text-purple-600">{overrideCount} custom</span>
      <div className="flex gap-0.5">
        {Object.values(overrides).slice(0, 4).map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm border border-gray-200"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  ) : (
    <span className="text-xs text-gray-400">Default colors</span>
  );

  // Header action: Reset All button
  const headerActions = hasOverrides ? (
    <button
      onClick={handleResetAll}
      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
      title="Reset all to pattern colors"
    >
      <RotateCcw className="w-3 h-3" />
      Reset
    </button>
  ) : null;

  return (
    <CollapsiblePanel
      title="Block Colors"
      isExpanded={isExpanded}
      onToggle={toggle}
      summary={collapsedSummary}
      headerActions={headerActions}
      showBorder={false}
    >
      <p className="text-xs text-gray-400 mb-2">
        Customize colors for this block only
      </p>

      <div className="space-y-1">
        {relevantRoles.map((role) => {
          const isOverridden = !!overrides[role.id];
          const effectiveColor = getEffectiveColor(role.id);

          return (
            <div
              key={role.id}
              className={`
                flex items-center gap-2 p-1.5 rounded-lg transition-colors
                ${isOverridden ? 'bg-purple-50' : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              {/* Color swatch with picker */}
              <ColorSwatch
                color={effectiveColor}
                size="sm"
                onChange={(color) => handleColorChange(role.id, color)}
                aria-label={`Change ${role.name} color for this block`}
                className="w-6 h-6"
              />

              {/* Role name */}
              <span className="text-xs font-medium text-gray-700 truncate flex-1">
                {role.name}
              </span>

              {/* Override indicator */}
              {isOverridden && (
                <span className="text-[10px] font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}

              {/* Reset button (only for overridden roles) */}
              {isOverridden && (
                <button
                  onClick={() => handleResetRole(role.id)}
                  className="flex-shrink-0 p-0.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors"
                  aria-label={`Reset ${role.name} to pattern color`}
                  title="Reset to pattern color"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pattern color reference */}
      {hasOverrides && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-[10px] text-gray-400 mb-1">Pattern palette:</p>
          <div className="flex gap-1 flex-wrap">
            {relevantRoles.map((role) => (
              <div
                key={role.id}
                className="w-4 h-4 rounded-sm border border-gray-200"
                style={{ backgroundColor: role.color }}
                title={`${role.name}: ${role.color}`}
              />
            ))}
          </div>
        </div>
      )}
    </CollapsiblePanel>
  );
}
