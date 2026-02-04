'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/** Available sidebar panels */
export type SidebarPanel = 'colors' | 'borders' | 'grid';

interface SidebarContextValue {
  /** Currently expanded panel (null if all collapsed) */
  expandedPanel: SidebarPanel | null;
  /** Expand a panel (collapses others) */
  expandPanel: (panel: SidebarPanel) => void;
  /** Collapse the currently expanded panel */
  collapsePanel: () => void;
  /** Toggle a panel's expanded state */
  togglePanel: (panel: SidebarPanel) => void;
  /** Check if a specific panel is expanded */
  isPanelExpanded: (panel: SidebarPanel) => boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
  /** Which panel to expand by default */
  defaultPanel?: SidebarPanel | null;
}

/**
 * SidebarProvider - Manages accordion behavior for sidebar panels
 *
 * Only one panel can be expanded at a time. When a panel is expanded,
 * all others automatically collapse.
 */
export function SidebarProvider({ children, defaultPanel = 'colors' }: SidebarProviderProps) {
  const [expandedPanel, setExpandedPanel] = useState<SidebarPanel | null>(defaultPanel);

  const expandPanel = useCallback((panel: SidebarPanel) => {
    setExpandedPanel(panel);
  }, []);

  const collapsePanel = useCallback(() => {
    setExpandedPanel(null);
  }, []);

  const togglePanel = useCallback((panel: SidebarPanel) => {
    setExpandedPanel((current) => (current === panel ? null : panel));
  }, []);

  const isPanelExpanded = useCallback(
    (panel: SidebarPanel) => expandedPanel === panel,
    [expandedPanel]
  );

  return (
    <SidebarContext.Provider
      value={{
        expandedPanel,
        expandPanel,
        collapsePanel,
        togglePanel,
        isPanelExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access sidebar panel state
 */
export function useSidebarPanel(panel: SidebarPanel) {
  const context = useContext(SidebarContext);

  if (!context) {
    // Fallback for when used outside provider (shouldn't happen, but safe default)
    return {
      isExpanded: panel === 'colors', // Default colors expanded
      toggle: () => {},
      expand: () => {},
      collapse: () => {},
    };
  }

  return {
    isExpanded: context.isPanelExpanded(panel),
    toggle: () => context.togglePanel(panel),
    expand: () => context.expandPanel(panel),
    collapse: () => context.collapsePanel(),
  };
}
