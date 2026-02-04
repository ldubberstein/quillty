'use client';

/**
 * Pattern Designer Sidebar Context
 *
 * Re-exports from shared SidebarContext with pattern-designer specific types.
 * Uses accordion mode (only one panel expanded at a time).
 */

// Re-export everything from shared
export { SidebarProvider, useSidebarPanel } from '../shared/SidebarContext';

/** Available sidebar panels for Pattern Designer */
export type SidebarPanel = 'colors' | 'borders' | 'grid';
