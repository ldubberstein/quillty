'use client';

import { useCallback, useMemo } from 'react';
import { RotateCw, FlipHorizontal2, FlipVertical2, Trash2, RotateCcw } from 'lucide-react';
import {
  usePatternDesignerStore,
  useSelectedBlockInstance,
  usePatternPalette,
} from '@quillty/core';
import type { Shape, FabricRoleId } from '@quillty/core';
import { useEscapeDismiss } from '@/hooks/useEscapeDismiss';
import { ColorSwatch } from '../shared';

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
function getRolesUsedByShapes(shapes: Shape[]): Set<string> {
  const roles = new Set<string>();

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
    }
  }

  return roles;
}

interface InstanceToolbarProps {
  /** Screen position where toolbar should appear */
  position: { x: number; y: number };
  /** Callback when rotate is clicked */
  onRotate: () => void;
  /** Callback when flip horizontal is clicked */
  onFlipHorizontal: () => void;
  /** Callback when flip vertical is clicked */
  onFlipVertical: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
  /** Callback when toolbar is dismissed (click outside or Escape) */
  onDismiss: () => void;
}

/**
 * InstanceToolbar - Floating toolbar for selected block instances in pattern designer
 *
 * Provides quick actions for instance manipulation:
 * - Rotate 90° clockwise
 * - Flip horizontally/vertically
 * - Delete instance
 * - Color swatches for per-instance color customization
 */
export function InstanceToolbar({
  position,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onDelete,
  onDismiss,
}: InstanceToolbarProps) {
  const instance = useSelectedBlockInstance();
  const palette = usePatternPalette();
  const blockCache = usePatternDesignerStore((s) => s.blockCache);
  const setInstanceRoleColor = usePatternDesignerStore((s) => s.setInstanceRoleColor);
  const resetInstancePalette = usePatternDesignerStore((s) => s.resetInstancePalette);

  // Dismiss on Escape key (canvas click is handled by the parent component)
  useEscapeDismiss(onDismiss);

  // Get block and its shapes
  const block = instance ? blockCache[instance.blockId] : null;
  const shapes = useMemo(() => getBlockShapes(block), [block]);
  const rolesUsed = useMemo(() => getRolesUsedByShapes(shapes), [shapes]);

  // Get palette roles used by this block
  const relevantRoles = useMemo(
    () => palette.roles.filter((role) => rolesUsed.has(role.id)),
    [palette.roles, rolesUsed]
  );

  // Check for overrides
  const overrides = instance?.paletteOverrides ?? {};
  const hasOverrides = Object.keys(overrides).length > 0;

  // Handle color change
  const handleColorChange = useCallback(
    (roleId: FabricRoleId, color: string) => {
      if (instance) {
        setInstanceRoleColor(instance.id, roleId, color);
      }
    },
    [instance, setInstanceRoleColor]
  );

  // Handle reset all
  const handleResetAll = useCallback(() => {
    if (instance) {
      resetInstancePalette(instance.id);
    }
  }, [instance, resetInstancePalette]);

  // Get effective color for a role
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

  // Calculate position to keep toolbar within viewport
  const adjustedPosition = {
    x: Math.max(120, Math.min(position.x, window.innerWidth - 120)),
    y: Math.max(50, position.y),
  };

  return (
    <div
      className="absolute z-50 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
      role="toolbar"
      aria-label="Block instance tools"
    >
      {/* Rotate 90° */}
      <button
        onClick={onRotate}
        className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        title="Rotate 90°"
        aria-label="Rotate 90 degrees"
      >
        <RotateCw className="w-4 h-4 text-gray-700" />
      </button>

      {/* Flip Horizontal */}
      <button
        onClick={onFlipHorizontal}
        className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        title="Flip horizontal"
        aria-label="Flip horizontal"
      >
        <FlipHorizontal2 className="w-4 h-4 text-gray-700" />
      </button>

      {/* Flip Vertical */}
      <button
        onClick={onFlipVertical}
        className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        title="Flip vertical"
        aria-label="Flip vertical"
      >
        <FlipVertical2 className="w-4 h-4 text-gray-700" />
      </button>

      {/* Divider */}
      <div className="w-px h-7 bg-gray-200 mx-0.5" />

      {/* Color swatches */}
      {relevantRoles.map((role) => {
        const isOverridden = !!overrides[role.id];
        const effectiveColor = getEffectiveColor(role.id);

        return (
          <div key={role.id} className="relative" title={role.name}>
            <ColorSwatch
              color={effectiveColor}
              size="sm"
              onChange={(color) => handleColorChange(role.id, color)}
              aria-label={`Change ${role.name} color`}
              className="w-7 h-7"
            />
            {/* Override indicator dot */}
            {isOverridden && (
              <div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 border border-white"
                title="Custom color"
              />
            )}
          </div>
        );
      })}

      {/* Reset all button (only if has overrides) */}
      {hasOverrides && (
        <>
          <div className="w-px h-7 bg-gray-200 mx-0.5" />
          <button
            onClick={handleResetAll}
            className="flex items-center justify-center w-9 h-9 rounded hover:bg-purple-50 focus:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            title="Reset to pattern colors"
            aria-label="Reset all colors"
          >
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </button>
        </>
      )}

      {/* Divider before delete */}
      <div className="w-px h-7 bg-gray-200 mx-0.5" />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-9 h-9 rounded hover:bg-red-50 focus:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        title="Delete block"
        aria-label="Delete block"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );
}
