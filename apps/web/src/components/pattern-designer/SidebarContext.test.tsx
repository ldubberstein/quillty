/**
 * SidebarContext Tests
 *
 * Tests for the sidebar accordion context that manages
 * which panel is expanded (only one at a time).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarProvider, useSidebarPanel, type SidebarPanel } from './SidebarContext';

// Test component that uses the sidebar context
function TestPanel({ panel, label }: { panel: SidebarPanel; label: string }) {
  const { isExpanded, toggle, expand, collapse } = useSidebarPanel(panel);

  return (
    <div>
      <button onClick={toggle} data-testid={`${panel}-toggle`}>
        {label} Toggle
      </button>
      <button onClick={expand} data-testid={`${panel}-expand`}>
        {label} Expand
      </button>
      <button onClick={collapse} data-testid={`${panel}-collapse`}>
        {label} Collapse
      </button>
      {isExpanded && <div data-testid={`${panel}-content`}>{label} Content</div>}
    </div>
  );
}

// Test component with all three panels
function TestSidebar({ defaultPanel }: { defaultPanel?: SidebarPanel | null }) {
  return (
    <SidebarProvider defaultPanel={defaultPanel}>
      <TestPanel panel="colors" label="Colors" />
      <TestPanel panel="borders" label="Borders" />
      <TestPanel panel="grid" label="Grid" />
    </SidebarProvider>
  );
}

describe('SidebarContext', () => {
  describe('default behavior', () => {
    it('expands colors panel when set as default', () => {
      render(<TestSidebar defaultPanel="colors" />);

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });

    it('respects custom defaultPanel prop', () => {
      render(<TestSidebar defaultPanel="borders" />);

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });

    it('allows null defaultPanel for all collapsed', () => {
      render(<TestSidebar defaultPanel={null} />);

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });
  });

  describe('accordion behavior', () => {
    it('collapses other panels when one is expanded', () => {
      render(<TestSidebar defaultPanel="colors" />);

      // Colors is initially expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Click to expand borders
      fireEvent.click(screen.getByTestId('borders-toggle'));

      // Now borders is expanded, colors is collapsed
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });

    it('toggles panel off when clicking the same panel', () => {
      render(<TestSidebar defaultPanel="colors" />);

      // Colors is initially expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Click colors toggle again
      fireEvent.click(screen.getByTestId('colors-toggle'));

      // All panels should be collapsed
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });

    it('allows cycling through all panels', () => {
      render(<TestSidebar defaultPanel="colors" />);

      // Start with colors
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Switch to borders
      fireEvent.click(screen.getByTestId('borders-toggle'));
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();

      // Switch to grid
      fireEvent.click(screen.getByTestId('grid-toggle'));
      expect(screen.getByTestId('grid-content')).toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();

      // Back to colors
      fireEvent.click(screen.getByTestId('colors-toggle'));
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });
  });

  describe('expand function', () => {
    it('expands the specified panel', () => {
      render(<TestSidebar defaultPanel={null} />);

      // All collapsed initially
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();

      // Use expand button
      fireEvent.click(screen.getByTestId('borders-expand'));

      // Borders is now expanded
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });

    it('collapses other panels when expanding', () => {
      render(<TestSidebar defaultPanel="colors" />);

      // Colors is expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Expand borders
      fireEvent.click(screen.getByTestId('borders-expand'));

      // Colors should be collapsed, borders expanded
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });
  });

  describe('collapse function', () => {
    it('collapses the currently expanded panel', () => {
      render(<TestSidebar defaultPanel="colors" />);

      // Colors is expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Collapse from any panel
      fireEvent.click(screen.getByTestId('colors-collapse'));

      // All collapsed
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
    });
  });

  describe('fallback behavior without provider', () => {
    it('provides default values when used outside provider', () => {
      // Render without provider - should use fallback defaults
      render(<TestPanel panel="colors" label="Colors" />);

      // Should show colors by default (fallback behavior)
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
    });

    it('fallback toggle does not throw', () => {
      render(<TestPanel panel="borders" label="Borders" />);

      // Should not throw when clicking toggle without provider
      expect(() => {
        fireEvent.click(screen.getByTestId('borders-toggle'));
      }).not.toThrow();
    });
  });
});
