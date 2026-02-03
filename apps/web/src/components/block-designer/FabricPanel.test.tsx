/**
 * FabricPanel Component Tests
 *
 * Tests for the fabric/color assignment sidebar panel that allows
 * users to enter paint mode and change palette colors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FabricPanel } from './FabricPanel';
import type { FabricRoleId } from '@quillty/core';

// Mock store functions
const mockSetActiveFabricRole = vi.fn();
const mockSetRoleColor = vi.fn();

// Store state that can be modified per test
let mockState = {
  activeFabricRole: null as FabricRoleId | null,
  mode: 'idle' as 'idle' | 'paint_mode' | 'placing_flying_geese_second',
  palette: {
    id: 'default-palette',
    name: 'Default',
    roles: [
      { id: 'background' as FabricRoleId, name: 'Background', color: '#F5F5DC' },
      { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#8B4513' },
      { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#D4AF37' },
    ],
  },
};

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      block: {
        previewPalette: mockState.palette,
      },
      activeFabricRole: mockState.activeFabricRole,
      mode: mockState.mode,
      setActiveFabricRole: mockSetActiveFabricRole,
      setRoleColor: mockSetRoleColor,
    };
    return selector ? selector(state) : state;
  }),
}));

describe('FabricPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState = {
      activeFabricRole: null,
      mode: 'idle',
      palette: {
        id: 'default-palette',
        name: 'Default',
        roles: [
          { id: 'background' as FabricRoleId, name: 'Background', color: '#F5F5DC' },
          { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
          { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#8B4513' },
          { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#D4AF37' },
        ],
      },
    };
  });

  describe('rendering', () => {
    it('renders the panel container', () => {
      render(<FabricPanel />);
      expect(screen.getByText('Fabrics')).toBeInTheDocument();
    });

    it('renders all 4 fabric roles', () => {
      render(<FabricPanel />);
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Accent 1')).toBeInTheDocument();
      expect(screen.getByText('Accent 2')).toBeInTheDocument();
    });

    it('renders color swatches for each role', () => {
      render(<FabricPanel />);
      // Each role has a color swatch button
      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      expect(colorButtons).toHaveLength(4);
    });

    it('displays hex color values for each role', () => {
      render(<FabricPanel />);
      expect(screen.getByText('#F5F5DC')).toBeInTheDocument();
      expect(screen.getByText('#1E3A5F')).toBeInTheDocument();
      expect(screen.getByText('#8B4513')).toBeInTheDocument();
      expect(screen.getByText('#D4AF37')).toBeInTheDocument();
    });

    it('displays instruction text when not in paint mode', () => {
      render(<FabricPanel />);
      expect(
        screen.getByText('Select a fabric role, then tap shapes to paint')
      ).toBeInTheDocument();
    });

    it('does not show Paint Mode badge when idle', () => {
      render(<FabricPanel />);
      expect(screen.queryByText('Paint Mode')).not.toBeInTheDocument();
    });

    it('does not show Exit Paint Mode button when idle', () => {
      render(<FabricPanel />);
      expect(screen.queryByText('Exit Paint Mode')).not.toBeInTheDocument();
    });
  });

  describe('paint mode display', () => {
    beforeEach(() => {
      mockState.mode = 'paint_mode';
      mockState.activeFabricRole = 'feature';
    });

    it('shows Paint Mode badge when in paint mode', () => {
      render(<FabricPanel />);
      expect(screen.getByText('Paint Mode')).toBeInTheDocument();
    });

    it('shows paint mode instruction text', () => {
      render(<FabricPanel />);
      expect(screen.getByText('Tap shapes on the canvas to paint them')).toBeInTheDocument();
    });

    it('shows Exit Paint Mode button', () => {
      render(<FabricPanel />);
      expect(screen.getByText('Exit Paint Mode')).toBeInTheDocument();
    });

    it('highlights the active role', () => {
      render(<FabricPanel />);
      const featureRole = screen.getByRole('button', { name: /select feature for painting/i });
      expect(featureRole).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows checkmark icon for active role', () => {
      render(<FabricPanel />);
      // The checkmark SVG should be visible
      const checkmarks = document.querySelectorAll('svg');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  describe('role selection', () => {
    it('calls setActiveFabricRole when clicking a role', () => {
      render(<FabricPanel />);
      const backgroundRole = screen.getByRole('button', { name: /select background for painting/i });
      fireEvent.click(backgroundRole);
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith('background');
    });

    it('calls setActiveFabricRole with different roles', () => {
      render(<FabricPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select feature for painting/i }));
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith('feature');

      fireEvent.click(screen.getByRole('button', { name: /select accent 1 for painting/i }));
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith('accent1');

      fireEvent.click(screen.getByRole('button', { name: /select accent 2 for painting/i }));
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith('accent2');
    });

    it('exits paint mode when clicking the active role again', () => {
      mockState.mode = 'paint_mode';
      mockState.activeFabricRole = 'feature';
      render(<FabricPanel />);

      const featureRole = screen.getByRole('button', { name: /select feature for painting/i });
      fireEvent.click(featureRole);
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith(null);
    });

    it('calls setActiveFabricRole(null) when Exit Paint Mode is clicked', () => {
      mockState.mode = 'paint_mode';
      mockState.activeFabricRole = 'feature';
      render(<FabricPanel />);

      fireEvent.click(screen.getByText('Exit Paint Mode'));
      expect(mockSetActiveFabricRole).toHaveBeenCalledWith(null);
    });
  });

  describe('color picker', () => {
    it('opens color input when clicking color swatch', () => {
      render(<FabricPanel />);
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // After clicking, the hidden color input should be in the document
      const colorInputs = document.querySelectorAll('input[type="color"]');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('calls setRoleColor when color is changed', () => {
      render(<FabricPanel />);

      // Click to open color picker
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // Find the color input and change it
      const colorInput = document.querySelector('input[type="color"]');
      expect(colorInput).not.toBeNull();

      // Browsers normalize hex colors to lowercase
      fireEvent.change(colorInput!, { target: { value: '#ff0000' } });
      expect(mockSetRoleColor).toHaveBeenCalledWith('background', '#ff0000');
    });

    it('renders hidden color input after clicking color swatch', () => {
      render(<FabricPanel />);

      // Initially no color input visible
      expect(document.querySelector('input[type="color"]')).toBeNull();

      // Click to open color picker
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // Color input should now be rendered
      const colorInput = document.querySelector('input[type="color"]');
      expect(colorInput).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    it('role buttons have correct aria-pressed state when inactive', () => {
      render(<FabricPanel />);
      // Role selectors use div with role="button"
      const roleButtons = screen.getAllByRole('button', { name: /select.*for painting/i });
      expect(roleButtons).toHaveLength(4);
      roleButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('active role button has aria-pressed=true', () => {
      mockState.mode = 'paint_mode';
      mockState.activeFabricRole = 'accent1';
      render(<FabricPanel />);

      const accent1Button = screen.getByRole('button', { name: /select accent 1 for painting/i });
      expect(accent1Button).toHaveAttribute('aria-pressed', 'true');
    });

    it('color swatch buttons have descriptive aria-labels', () => {
      render(<FabricPanel />);
      expect(screen.getByRole('button', { name: /change background color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change feature color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 1 color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 2 color/i })).toBeInTheDocument();
    });

    it('color swatch buttons are focusable', () => {
      render(<FabricPanel />);

      // Color swatch buttons (actual <button> elements) are focusable
      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      colorButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe('visual styling', () => {
    it('renders color swatches with correct background colors', () => {
      render(<FabricPanel />);

      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      expect(backgroundColorBtn).toHaveStyle({ backgroundColor: '#F5F5DC' });

      const featureColorBtn = screen.getByRole('button', { name: /change feature color/i });
      expect(featureColorBtn).toHaveStyle({ backgroundColor: '#1E3A5F' });
    });

    it('inactive roles have default styling', () => {
      render(<FabricPanel />);
      // Role selector uses div with role="button"
      const roleButton = screen.getByRole('button', { name: /select background for painting/i });
      // Should have bg-gray-50 class (inactive state)
      expect(roleButton.className).toContain('bg-gray-50');
    });

    it('active role has highlighted styling', () => {
      mockState.mode = 'paint_mode';
      mockState.activeFabricRole = 'feature';
      render(<FabricPanel />);

      // Role selector uses div with role="button"
      const featureButton = screen.getByRole('button', { name: /select feature for painting/i });
      // Should have bg-blue-50 and ring classes (active state)
      expect(featureButton.className).toContain('bg-blue-50');
      expect(featureButton.className).toContain('ring-2');
    });
  });
});
