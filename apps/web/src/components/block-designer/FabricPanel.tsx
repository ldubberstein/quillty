'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Plus, X, AlertTriangle } from 'lucide-react';
import { useBlockDesignerStore, MAX_PALETTE_ROLES } from '@quillty/core';
import type { FabricRoleId, Shape } from '@quillty/core';
import { ColorSwatch, CollapsiblePanel, useSidebarPanel } from '../shared';

interface RemoveRoleDialogProps {
  roleName: string;
  affectedShapeCount: number;
  availableRoles: Array<{ id: FabricRoleId; name: string; color: string }>;
  selectedFallback: FabricRoleId;
  onFallbackChange: (roleId: FabricRoleId) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function RemoveRoleDialog({
  roleName,
  affectedShapeCount,
  availableRoles,
  selectedFallback,
  onFallbackChange,
  onConfirm,
  onCancel,
}: RemoveRoleDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  const shapeWord = affectedShapeCount === 1 ? 'shape' : 'shapes';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Remove Color?</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{affectedShapeCount} {shapeWord}</span>{' '}
            {affectedShapeCount === 1 ? 'uses' : 'use'} the &ldquo;{roleName}&rdquo; color.
            {affectedShapeCount === 1 ? ' It' : ' They'} will be reassigned to:
          </p>

          <select
            value={selectedFallback}
            onChange={(e) => onFallbackChange(e.target.value)}
            className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <p className="mt-3 text-sm text-gray-500">You can undo this action if needed.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Remove & Reassign
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * FabricPanel - Sidebar panel for fabric/color assignment
 *
 * Shows the block's palette roles with color swatches.
 * - Tap a role to enter paint mode (tap shapes to assign)
 * - Tap a color swatch to open color picker
 * - Add/remove color roles
 */
export function FabricPanel() {
  const palette = useBlockDesignerStore((state) => state.block.previewPalette);
  const activeFabricRole = useBlockDesignerStore((state) => state.activeFabricRole);
  const mode = useBlockDesignerStore((state) => state.mode);
  const setActiveFabricRole = useBlockDesignerStore((state) => state.setActiveFabricRole);
  const setRoleColor = useBlockDesignerStore((state) => state.setRoleColor);
  const addRole = useBlockDesignerStore((state) => state.addRole);
  const removeRole = useBlockDesignerStore((state) => state.removeRole);
  const canRemoveRole = useBlockDesignerStore((state) => state.canRemoveRole);
  const getShapesUsingRole = useBlockDesignerStore((state) => state.getShapesUsingRole);

  const { isExpanded, toggle } = useSidebarPanel('fabrics');
  const isPaintMode = mode === 'paint_mode';

  // State for remove confirmation dialog
  const [pendingRemoveRole, setPendingRemoveRole] = useState<{
    id: FabricRoleId;
    name: string;
    affectedShapes: Shape[];
  } | null>(null);
  const [fallbackRoleId, setFallbackRoleId] = useState<FabricRoleId>('');

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

  // Handle add role
  const handleAddRole = useCallback(() => {
    addRole();
  }, [addRole]);

  // Handle remove role - check for affected shapes first
  const handleRemoveRole = useCallback(
    (roleId: FabricRoleId, roleName: string) => {
      const affectedShapes = getShapesUsingRole(roleId);

      if (affectedShapes.length > 0) {
        // Find a default fallback role (first role that isn't the one being removed)
        const defaultFallback = palette.roles.find((r) => r.id !== roleId)?.id ?? '';
        setFallbackRoleId(defaultFallback);
        setPendingRemoveRole({ id: roleId, name: roleName, affectedShapes });
      } else {
        // No shapes affected, remove immediately
        removeRole(roleId);
      }
    },
    [getShapesUsingRole, palette.roles, removeRole]
  );

  // Confirm removal with reassignment
  const handleConfirmRemove = useCallback(() => {
    if (pendingRemoveRole) {
      removeRole(pendingRemoveRole.id, fallbackRoleId);
      setPendingRemoveRole(null);
      setFallbackRoleId('');
    }
  }, [pendingRemoveRole, fallbackRoleId, removeRole]);

  // Cancel removal
  const handleCancelRemove = useCallback(() => {
    setPendingRemoveRole(null);
    setFallbackRoleId('');
  }, []);

  const canAdd = palette.roles.length < MAX_PALETTE_ROLES;
  const canRemove = canRemoveRole();

  // Build collapsed summary: inline color swatches
  const collapsedSummary = (
    <div className="flex gap-1 flex-wrap">
      {palette.roles.slice(0, 8).map((role) => (
        <ColorSwatch key={role.id} color={role.color} size="sm" aria-label={role.name} />
      ))}
      {palette.roles.length > 8 && (
        <span className="text-xs text-gray-400 self-center">+{palette.roles.length - 8}</span>
      )}
    </div>
  );

  // Header action: paint mode badge
  const headerActions = isPaintMode ? (
    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Paint Mode</span>
  ) : undefined;

  return (
    <>
      <CollapsiblePanel
        title="Fabrics"
        isExpanded={isExpanded}
        onToggle={toggle}
        summary={collapsedSummary}
        headerActions={headerActions}
        showBorder={false}
      >
        <p className="text-xs text-gray-400 mb-2">
          {isPaintMode
            ? 'Tap shapes on the canvas to paint them'
            : 'Select a fabric, then tap shapes to paint'}
        </p>

        <div className="space-y-1">
          {palette.roles.map((role) => {
            const isActive = activeFabricRole === role.id;

            return (
              <div
                key={role.id}
                className={`
                  flex items-center gap-2 p-1 rounded-lg transition-all
                  ${isActive ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'}
                `}
              >
                {/* Clickable area for role selection */}
                <div
                  onClick={() => handleRoleClick(role.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`Select ${role.name} for painting`}
                >
                  {/* Color swatch with picker */}
                  <ColorSwatch
                    color={role.color}
                    size="sm"
                    selected={isActive}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(color) => handleColorChange(role.id, color)}
                    aria-label={`Change ${role.name} color`}
                    className="w-6 h-6"
                  />

                  {/* Role name */}
                  <span className="text-xs font-medium text-gray-700 truncate flex-1">{role.name}</span>

                  {/* Active indicator */}
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                </div>

                {/* Remove button */}
                {canRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRole(role.id, role.name);
                    }}
                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    aria-label={`Remove ${role.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
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

        {/* Exit paint mode button */}
        {isPaintMode && (
          <button
            onClick={() => setActiveFabricRole(null)}
            className="w-full mt-2 py-1.5 px-3 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Exit Paint Mode
          </button>
        )}
      </CollapsiblePanel>

      {/* Remove confirmation dialog */}
      {pendingRemoveRole && (
        <RemoveRoleDialog
          roleName={pendingRemoveRole.name}
          affectedShapeCount={pendingRemoveRole.affectedShapes.length}
          availableRoles={palette.roles.filter((r) => r.id !== pendingRemoveRole.id)}
          selectedFallback={fallbackRoleId}
          onFallbackChange={setFallbackRoleId}
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />
      )}
    </>
  );
}
