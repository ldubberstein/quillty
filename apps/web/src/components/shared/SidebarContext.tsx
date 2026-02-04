'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/** Sidebar behavior mode */
export type SidebarMode = 'accordion' | 'multi';

interface SidebarContextValue {
  /** Set of currently expanded panel IDs */
  expandedPanels: Set<string>;
  /** Expand a panel */
  expandPanel: (panel: string) => void;
  /** Collapse a panel */
  collapsePanel: (panel: string) => void;
  /** Toggle a panel's expanded state */
  togglePanel: (panel: string) => void;
  /** Check if a specific panel is expanded */
  isPanelExpanded: (panel: string) => boolean;
  /** Sidebar mode */
  mode: SidebarMode;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
  /** Which panel(s) to expand by default (supports single string, array, or null) */
  defaultPanels?: string | string[] | null;
  /** Alias for defaultPanels (backwards compatibility with Pattern Designer) */
  defaultPanel?: string | null;
  /**
   * Sidebar behavior mode:
   * - 'accordion': Only one panel expanded at a time (Pattern Designer)
   * - 'multi': Multiple panels can be expanded (Block Designer)
   */
  mode?: SidebarMode;
}

/**
 * SidebarProvider - Manages expand/collapse behavior for sidebar panels
 *
 * Supports two modes:
 * - accordion: Only one panel can be expanded at a time (auto-collapses others)
 * - multi: Multiple panels can be expanded independently
 */
export function SidebarProvider({
  children,
  defaultPanels,
  defaultPanel,
  mode = 'accordion',
}: SidebarProviderProps) {
  // Support both defaultPanels and defaultPanel props (defaultPanels takes precedence)
  const initialPanels = defaultPanels ?? defaultPanel ?? null;

  // Initialize expanded panels from props
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(() => {
    if (initialPanels === null) return new Set();
    if (Array.isArray(initialPanels)) return new Set(initialPanels);
    return new Set([initialPanels]);
  });

  const expandPanel = useCallback(
    (panel: string) => {
      setExpandedPanels((current) => {
        if (mode === 'accordion') {
          // Accordion mode: replace all with just this panel
          return new Set([panel]);
        }
        // Multi mode: add to existing
        const next = new Set(current);
        next.add(panel);
        return next;
      });
    },
    [mode]
  );

  const collapsePanel = useCallback((panel: string) => {
    setExpandedPanels((current) => {
      const next = new Set(current);
      next.delete(panel);
      return next;
    });
  }, []);

  const togglePanel = useCallback(
    (panel: string) => {
      setExpandedPanels((current) => {
        if (current.has(panel)) {
          // Collapse this panel
          const next = new Set(current);
          next.delete(panel);
          return next;
        }
        // Expand this panel
        if (mode === 'accordion') {
          return new Set([panel]);
        }
        const next = new Set(current);
        next.add(panel);
        return next;
      });
    },
    [mode]
  );

  const isPanelExpanded = useCallback(
    (panel: string) => expandedPanels.has(panel),
    [expandedPanels]
  );

  return (
    <SidebarContext.Provider
      value={{
        expandedPanels,
        expandPanel,
        collapsePanel,
        togglePanel,
        isPanelExpanded,
        mode,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access sidebar panel state for a specific panel
 */
export function useSidebarPanel(panel: string) {
  const context = useContext(SidebarContext);

  if (!context) {
    // Fallback for when used outside provider (shouldn't happen, but safe default)
    return {
      isExpanded: true, // Default to expanded when no provider
      toggle: () => {},
      expand: () => {},
      collapse: () => {},
    };
  }

  return {
    isExpanded: context.isPanelExpanded(panel),
    toggle: () => context.togglePanel(panel),
    expand: () => context.expandPanel(panel),
    collapse: () => context.collapsePanel(panel),
  };
}

/** Re-export SidebarPanel type for backwards compatibility */
export type SidebarPanel = string;
