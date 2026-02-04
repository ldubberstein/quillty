/**
 * PalettePanel Component Tests
 *
 * Tests for the pattern color palette panel that allows
 * users to change the pattern's fabric role colors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PalettePanel } from './PalettePanel';
import type { FabricRoleId } from '@quillty/core';

// Mock store functions
const mockSetRoleColor = vi.fn();

// Store state that can be modified per test
let mockPalette = {
  id: 'default-palette',
  name: 'Default',
  roles: [
    { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
    { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
    { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#E85D04' },
    { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#FAA307' },
  ],
};

vi.mock('@quillty/core', () => ({
  usePatternDesignerStore: vi.fn((selector) => {
    const state = {
      setRoleColor: mockSetRoleColor,
    };
    return selector ? selector(state) : state;
  }),
  usePatternPalette: vi.fn(() => mockPalette),
}));

describe('PalettePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockPalette = {
      id: 'default-palette',
      name: 'Default',
      roles: [
        { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
        { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
        { id: 'accent1' as FabricRoleId, name: 'Accent 1', color: '#E85D04' },
        { id: 'accent2' as FabricRoleId, name: 'Accent 2', color: '#FAA307' },
      ],
    };
  });

  describe('rendering', () => {
    it('renders the panel with Colors heading', () => {
      render(<PalettePanel />);
      expect(screen.getByText('Colors')).toBeInTheDocument();
    });

    it('renders all 4 fabric roles', () => {
      render(<PalettePanel />);
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Accent 1')).toBeInTheDocument();
      expect(screen.getByText('Accent 2')).toBeInTheDocument();
    });

    it('renders color swatches for each role', () => {
      render(<PalettePanel />);
      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      expect(colorButtons).toHaveLength(4);
    });

    it('displays hex color values for each role', () => {
      render(<PalettePanel />);
      expect(screen.getByText('#FFFFFF')).toBeInTheDocument();
      expect(screen.getByText('#1E3A5F')).toBeInTheDocument();
      expect(screen.getByText('#E85D04')).toBeInTheDocument();
      expect(screen.getByText('#FAA307')).toBeInTheDocument();
    });

    it('displays instruction text', () => {
      render(<PalettePanel />);
      expect(screen.getByText('Tap a swatch to change colors')).toBeInTheDocument();
    });
  });

  describe('color picker', () => {
    it('opens color input when clicking color swatch', () => {
      render(<PalettePanel />);
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // After clicking, the hidden color input should be in the document
      const colorInputs = document.querySelectorAll('input[type="color"]');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('calls setRoleColor when color is changed', () => {
      render(<PalettePanel />);

      // Click to open color picker
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // Find the color input and change it
      const colorInput = document.querySelector('input[type="color"]');
      expect(colorInput).not.toBeNull();

      fireEvent.change(colorInput!, { target: { value: '#ff0000' } });
      expect(mockSetRoleColor).toHaveBeenCalledWith('background', '#ff0000');
    });

    it('calls setRoleColor for each role when its color changes', () => {
      render(<PalettePanel />);

      // Test feature role
      const featureColorBtn = screen.getByRole('button', { name: /change feature color/i });
      fireEvent.click(featureColorBtn);
      const colorInput = document.querySelector('input[type="color"]');
      fireEvent.change(colorInput!, { target: { value: '#00ff00' } });
      expect(mockSetRoleColor).toHaveBeenCalledWith('feature', '#00ff00');
    });

    it('renders hidden color input after clicking color swatch', () => {
      render(<PalettePanel />);

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
    it('color swatch buttons have descriptive aria-labels', () => {
      render(<PalettePanel />);
      expect(screen.getByRole('button', { name: /change background color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change feature color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 1 color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 2 color/i })).toBeInTheDocument();
    });

    it('color swatch buttons are focusable', () => {
      render(<PalettePanel />);

      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      colorButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe('visual styling', () => {
    it('renders color swatches with correct background colors', () => {
      render(<PalettePanel />);

      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      expect(backgroundColorBtn).toHaveStyle({ backgroundColor: '#FFFFFF' });

      const featureColorBtn = screen.getByRole('button', { name: /change feature color/i });
      expect(featureColorBtn).toHaveStyle({ backgroundColor: '#1E3A5F' });

      const accent1ColorBtn = screen.getByRole('button', { name: /change accent 1 color/i });
      expect(accent1ColorBtn).toHaveStyle({ backgroundColor: '#E85D04' });

      const accent2ColorBtn = screen.getByRole('button', { name: /change accent 2 color/i });
      expect(accent2ColorBtn).toHaveStyle({ backgroundColor: '#FAA307' });
    });
  });
});
