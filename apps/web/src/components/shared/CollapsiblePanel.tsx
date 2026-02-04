'use client';

import { type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface CollapsiblePanelProps {
  /** Panel title displayed in header */
  title: string;
  /** Whether the panel is currently expanded */
  isExpanded: boolean;
  /** Called when header is clicked to toggle */
  onToggle: () => void;
  /** Content shown in header when collapsed (e.g., summary text or swatches) */
  summary?: ReactNode;
  /** Actions shown on right side of header when expanded (e.g., toggle switch) */
  headerActions?: ReactNode;
  /** Panel content (only rendered when expanded) */
  children: ReactNode;
  /** Additional wrapper classes */
  className?: string;
  /** Whether to show a top border (default: true) */
  showBorder?: boolean;
}

/**
 * CollapsiblePanel - A standardized collapsible section for sidebar panels
 *
 * Features:
 * - Chevron indicator that rotates on expand/collapse
 * - Uppercase title styling
 * - Optional summary displayed when collapsed
 * - Optional header actions (e.g., toggle switches)
 * - Consistent padding and spacing
 */
export function CollapsiblePanel({
  title,
  isExpanded,
  onToggle,
  summary,
  headerActions,
  children,
  className = '',
  showBorder = true,
}: CollapsiblePanelProps) {
  return (
    <div className={`p-3 ${showBorder ? 'border-t border-gray-200' : ''} ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        {/* Toggle button with chevron and title */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 group"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        </button>

        {/* Collapsed summary OR expanded header actions */}
        {!isExpanded && summary && (
          <span className="text-xs text-gray-400">{summary}</span>
        )}
        {isExpanded && headerActions}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
