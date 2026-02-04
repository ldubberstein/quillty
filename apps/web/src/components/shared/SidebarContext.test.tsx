/**
 * SidebarContext Tests
 *
 * Tests for the sidebar context that manages expand/collapse
 * behavior for sidebar panels in both accordion and multi modes.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarProvider, useSidebarPanel } from './SidebarContext';

// Test component that uses the sidebar context
function TestPanel({ panel, label }: { panel: string; label: string }) {
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

describe('SidebarContext', () => {
  describe('accordion mode (default)', () => {
    it('expands single default panel', () => {
      render(
        <SidebarProvider defaultPanel="colors">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();
    });

    it('collapses other panels when one is expanded', () => {
      render(
        <SidebarProvider defaultPanel="colors">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      // Colors is initially expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Expand borders
      fireEvent.click(screen.getByTestId('borders-toggle'));

      // Now borders is expanded, colors is collapsed
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });

    it('toggles panel off when clicking same panel', () => {
      render(
        <SidebarProvider defaultPanel="colors">
          <TestPanel panel="colors" label="Colors" />
        </SidebarProvider>
      );

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('colors-toggle'));

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
    });

    it('supports defaultPanels prop with single string', () => {
      render(
        <SidebarProvider defaultPanels="borders">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });
  });

  describe('multi mode', () => {
    it('expands multiple default panels', () => {
      render(
        <SidebarProvider defaultPanels={['colors', 'borders']} mode="multi">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
          <TestPanel panel="grid" label="Grid" />
        </SidebarProvider>
      );

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-content')).not.toBeInTheDocument();
    });

    it('allows multiple panels to be expanded simultaneously', () => {
      render(
        <SidebarProvider defaultPanels={['colors']} mode="multi">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      // Colors is initially expanded
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      // Expand borders - colors should stay expanded
      fireEvent.click(screen.getByTestId('borders-toggle'));

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });

    it('toggles individual panels independently', () => {
      render(
        <SidebarProvider defaultPanels={['colors', 'borders']} mode="multi">
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      // Both expanded initially
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();

      // Toggle colors off
      fireEvent.click(screen.getByTestId('colors-toggle'));

      // Colors collapsed, borders still expanded
      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('borders-content')).toBeInTheDocument();
    });
  });

  describe('expand function', () => {
    it('expands the specified panel', () => {
      render(
        <SidebarProvider defaultPanel={null}>
          <TestPanel panel="colors" label="Colors" />
        </SidebarProvider>
      );

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('colors-expand'));

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
    });
  });

  describe('collapse function', () => {
    it('collapses the specified panel', () => {
      render(
        <SidebarProvider defaultPanel="colors">
          <TestPanel panel="colors" label="Colors" />
        </SidebarProvider>
      );

      expect(screen.getByTestId('colors-content')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('colors-collapse'));

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
    });
  });

  describe('fallback behavior without provider', () => {
    it('provides default expanded state when used outside provider', () => {
      render(<TestPanel panel="colors" label="Colors" />);

      // Should default to expanded when no provider
      expect(screen.getByTestId('colors-content')).toBeInTheDocument();
    });

    it('does not throw when toggle is called without provider', () => {
      render(<TestPanel panel="colors" label="Colors" />);

      expect(() => {
        fireEvent.click(screen.getByTestId('colors-toggle'));
      }).not.toThrow();
    });
  });

  describe('null default', () => {
    it('starts with no panels expanded when defaultPanel is null', () => {
      render(
        <SidebarProvider defaultPanel={null}>
          <TestPanel panel="colors" label="Colors" />
          <TestPanel panel="borders" label="Borders" />
        </SidebarProvider>
      );

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('borders-content')).not.toBeInTheDocument();
    });

    it('starts with no panels expanded when defaultPanels is null', () => {
      render(
        <SidebarProvider defaultPanels={null}>
          <TestPanel panel="colors" label="Colors" />
        </SidebarProvider>
      );

      expect(screen.queryByTestId('colors-content')).not.toBeInTheDocument();
    });
  });
});
