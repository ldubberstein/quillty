'use client';

import { useCallback, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  usePatternDesignerStore,
  useBordersEnabled,
  useBorders,
  useSelectedBorderId,
  useFinalQuiltWidth,
  useFinalQuiltHeight,
  useCanAddBorder,
  usePatternPalette,
  MAX_BORDERS,
} from '@quillty/core';
import type { Border, BorderCornerStyle, FabricRoleId } from '@quillty/core';
import { useSidebarPanel } from './SidebarContext';
import { ColorSwatch, CollapsiblePanel } from '../shared';

/** Corner style options with labels */
const CORNER_STYLES: { value: BorderCornerStyle; label: string }[] = [
  { value: 'butted', label: 'Butted' },
  { value: 'mitered', label: 'Mitered' },
  { value: 'cornerstone', label: 'Cornerstone' },
];

/**
 * BorderPanel - Right sidebar panel for border configuration
 *
 * Collapsible panel allowing users to:
 * - Enable/disable borders
 * - Add multiple borders (up to 4)
 * - Configure width, corner style, and fabric colors
 * - View final quilt dimensions
 */
export function BorderPanel() {
  const bordersEnabled = useBordersEnabled();
  const borders = useBorders();
  const selectedBorderId = useSelectedBorderId();
  const finalWidth = useFinalQuiltWidth();
  const finalHeight = useFinalQuiltHeight();
  const canAddBorder = useCanAddBorder();
  const palette = usePatternPalette();

  const { isExpanded, toggle, expand } = useSidebarPanel('borders');

  const setBordersEnabled = usePatternDesignerStore((s) => s.setBordersEnabled);
  const addBorder = usePatternDesignerStore((s) => s.addBorder);
  const removeBorder = usePatternDesignerStore((s) => s.removeBorder);
  const updateBorder = usePatternDesignerStore((s) => s.updateBorder);
  const selectBorder = usePatternDesignerStore((s) => s.selectBorder);

  const handleAddBorder = useCallback(() => {
    addBorder();
    expand(); // Auto-expand when adding border
  }, [addBorder, expand]);

  const handleRemoveBorder = useCallback(
    (borderId: string) => {
      removeBorder(borderId);
    },
    [removeBorder]
  );

  const handleSelectBorder = useCallback(
    (borderId: string) => {
      selectBorder(selectedBorderId === borderId ? null : borderId);
    },
    [selectBorder, selectedBorderId]
  );

  // Build collapsed summary text
  const getSummary = () => {
    if (borders.length === 0) return 'None';
    if (!bordersEnabled) return `${borders.length} (hidden)`;
    return `${borders.length} · ${finalWidth}" × ${finalHeight}"`;
  };

  // Header actions: toggle switch when expanded and borders exist
  const headerActions = borders.length > 0 ? (
    <button
      onClick={() => setBordersEnabled(!bordersEnabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        bordersEnabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      aria-label={bordersEnabled ? 'Hide borders' : 'Show borders'}
      title={bordersEnabled ? 'Hide borders' : 'Show borders'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          bordersEnabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  ) : undefined;

  return (
    <CollapsiblePanel
      title="Borders"
      isExpanded={isExpanded}
      onToggle={toggle}
      summary={getSummary()}
      headerActions={headerActions}
    >
      {/* Border list - show when borders exist and are enabled */}
      {bordersEnabled && borders.length > 0 && (
        <div className="space-y-2 mb-3">
          {borders.map((border, index) => (
            <BorderListItem
              key={border.id}
              border={border}
              index={index}
              isSelected={selectedBorderId === border.id}
              onSelect={() => handleSelectBorder(border.id)}
              onRemove={() => handleRemoveBorder(border.id)}
            />
          ))}
        </div>
      )}

      {/* Add border button - always visible when can add */}
      {canAddBorder && (
        <button
          onClick={handleAddBorder}
          className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {borders.length === 0 ? 'Add Border' : `Add Border (${borders.length}/${MAX_BORDERS})`}
        </button>
      )}

      {/* Empty state hint - only when no borders */}
      {borders.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Add a border frame around your quilt
        </p>
      )}

      {/* Selected border editor */}
      {bordersEnabled && selectedBorderId && (
        <BorderEditor
          border={borders.find((b) => b.id === selectedBorderId)!}
          palette={palette}
          onUpdate={updateBorder}
        />
      )}

      {/* Final size display - only when borders exist */}
      {borders.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Final quilt size:</p>
          <p className="text-sm font-medium text-gray-800">
            {finalWidth}" × {finalHeight}"
          </p>
          {!bordersEnabled && (
            <p className="text-xs text-gray-400 mt-1 italic">
              (borders hidden)
            </p>
          )}
        </div>
      )}
    </CollapsiblePanel>
  );
}

/** Individual border item in the list */
function BorderListItem({
  border,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  border: Border;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const palette = usePatternPalette();
  const color = palette.roles.find((r) => r.id === border.fabricRole)?.color ?? '#CCCCCC';

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      {/* Color preview */}
      <div className="flex-shrink-0">
        <ColorSwatch
          color={color}
          size="sm"
          className="w-6 h-6"
          aria-label={`Border ${index + 1} color`}
        />
      </div>

      {/* Border info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">
          Border {index + 1}
        </p>
        <p className="text-xs text-gray-400">
          {border.widthInches}" · {border.cornerStyle}
        </p>
      </div>

      {/* Expand/collapse indicator */}
      {isSelected ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Remove border"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Border editor for the selected border */
function BorderEditor({
  border,
  palette,
  onUpdate,
}: {
  border: Border;
  palette: { roles: Array<{ id: string; name: string; color: string }> };
  onUpdate: (borderId: string, updates: Partial<Omit<Border, 'id'>>) => void;
}) {
  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value >= 0.5 && value <= 12) {
        onUpdate(border.id, { widthInches: value });
      }
    },
    [border.id, onUpdate]
  );

  const handleCornerStyleChange = useCallback(
    (style: BorderCornerStyle) => {
      onUpdate(border.id, { cornerStyle: style });
      // Add default cornerstone color if switching to cornerstone
      if (style === 'cornerstone' && !border.cornerstoneFabricRole) {
        onUpdate(border.id, { cornerstoneFabricRole: 'accent2' });
      }
    },
    [border.id, border.cornerstoneFabricRole, onUpdate]
  );

  const handleFabricRoleChange = useCallback(
    (roleId: FabricRoleId) => {
      onUpdate(border.id, { fabricRole: roleId });
    },
    [border.id, onUpdate]
  );

  const handleCornerstoneFabricChange = useCallback(
    (roleId: FabricRoleId) => {
      onUpdate(border.id, { cornerstoneFabricRole: roleId });
    },
    [border.id, onUpdate]
  );

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
      {/* Width */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Width (inches)
        </label>
        <input
          type="number"
          min={0.5}
          max={12}
          step={0.25}
          value={border.widthInches}
          onChange={handleWidthChange}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Corner Style */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Corner Style
        </label>
        <div className="flex gap-1">
          {CORNER_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleCornerStyleChange(style.value)}
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                border.cornerStyle === style.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fabric Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Border Fabric
        </label>
        <div className="flex gap-2">
          {palette.roles.map((role) => (
            <ColorSwatch
              key={role.id}
              color={role.color}
              size="md"
              selected={border.fabricRole === role.id}
              onClick={() => handleFabricRoleChange(role.id)}
              aria-label={role.name}
            />
          ))}
        </div>
      </div>

      {/* Cornerstone Color (only for cornerstone style) */}
      {border.cornerStyle === 'cornerstone' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cornerstone Fabric
          </label>
          <div className="flex gap-2">
            {palette.roles.map((role) => (
              <ColorSwatch
                key={role.id}
                color={role.color}
                size="md"
                selected={border.cornerstoneFabricRole === role.id}
                onClick={() => handleCornerstoneFabricChange(role.id)}
                aria-label={role.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
