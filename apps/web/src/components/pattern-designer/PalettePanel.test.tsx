/**
 * PalettePanel Component Tests
 *
 * Tests for the pattern color palette panel that allows
 * users to change the pattern's fabric role colors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PalettePanel } from './PalettePanel';
import { SidebarProvider } from './SidebarContext';
import type { FabricRoleId } from '@quillty/core';

// Mock store functions
const mockSetRoleColor = vi.fn();
const mockAddRole = vi.fn(() => 'new-role-id');
const mockRemoveRole = vi.fn();
const mockCanRemoveRole = vi.fn(() => true);

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
      addRole: mockAddRole,
      removeRole: mockRemoveRole,
      canRemoveRole: mockCanRemoveRole,
    };
    return selector ? selector(state) : state;
  }),
  usePatternPalette: vi.fn(() => mockPalette),
  MAX_PALETTE_ROLES: 12,
}));

// Helper to render with SidebarProvider
const renderWithSidebar = (defaultPanel: 'colors' | 'borders' | 'grid' | null = 'colors') => {
  return render(
    <SidebarProvider defaultPanel={defaultPanel}>
      <PalettePanel />
    </SidebarProvider>
  );
};

describe('PalettePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock functions
    mockCanRemoveRole.mockReturnValue(true);
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
      renderWithSidebar();
      expect(screen.getByText('Colors')).toBeInTheDocument();
    });

    it('renders all 4 fabric roles when expanded', () => {
      renderWithSidebar('colors');
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Accent 1')).toBeInTheDocument();
      expect(screen.getByText('Accent 2')).toBeInTheDocument();
    });

    it('renders color swatches for each role when expanded', () => {
      renderWithSidebar('colors');
      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      expect(colorButtons).toHaveLength(4);
    });

    it('displays instruction text when expanded', () => {
      renderWithSidebar('colors');
      expect(screen.getByText('Tap a swatch to change colors')).toBeInTheDocument();
    });
  });

  describe('collapsible behavior', () => {
    it('shows collapsed summary when not expanded', () => {
      renderWithSidebar('borders'); // Another panel expanded

      // Should not show expanded content
      expect(screen.queryByText('Background')).not.toBeInTheDocument();
      expect(screen.queryByText('Tap a swatch to change colors')).not.toBeInTheDocument();

      // Should show mini color swatches in summary (4 small divs)
      const header = screen.getByText('Colors').closest('button');
      expect(header).toBeInTheDocument();
    });

    it('expands when header is clicked', () => {
      renderWithSidebar('borders'); // Start with borders expanded

      // Click colors header to expand it
      const colorsHeader = screen.getByText('Colors').closest('button');
      fireEvent.click(colorsHeader!);

      // Now should show expanded content
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Tap a swatch to change colors')).toBeInTheDocument();
    });

    it('collapses when header is clicked while expanded', () => {
      renderWithSidebar('colors'); // Start expanded

      // Verify expanded
      expect(screen.getByText('Background')).toBeInTheDocument();

      // Click header to collapse
      const colorsHeader = screen.getByText('Colors').closest('button');
      fireEvent.click(colorsHeader!);

      // Should be collapsed now
      expect(screen.queryByText('Background')).not.toBeInTheDocument();
    });
  });

  describe('color picker', () => {
    it('opens color input when clicking color swatch', () => {
      renderWithSidebar('colors');
      const backgroundColorBtn = screen.getByRole('button', { name: /change background color/i });
      fireEvent.click(backgroundColorBtn);

      // After clicking, the hidden color input should be in the document
      const colorInputs = document.querySelectorAll('input[type="color"]');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('calls setRoleColor when color is changed', () => {
      renderWithSidebar('colors');

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
      renderWithSidebar('colors');

      // Test feature role
      const featureColorBtn = screen.getByRole('button', { name: /change feature color/i });
      fireEvent.click(featureColorBtn);
      const colorInput = document.querySelector('input[type="color"]');
      fireEvent.change(colorInput!, { target: { value: '#00ff00' } });
      expect(mockSetRoleColor).toHaveBeenCalledWith('feature', '#00ff00');
    });

    it('renders hidden color input after clicking color swatch', () => {
      renderWithSidebar('colors');

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
    it('color swatch buttons have descriptive aria-labels when expanded', () => {
      renderWithSidebar('colors');
      expect(screen.getByRole('button', { name: /change background color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change feature color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 1 color/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change accent 2 color/i })).toBeInTheDocument();
    });

    it('color swatch buttons are focusable when expanded', () => {
      renderWithSidebar('colors');

      const colorButtons = screen.getAllByRole('button', { name: /change.*color/i });
      colorButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe('visual styling', () => {
    it('renders color swatches with correct background colors when expanded', () => {
      renderWithSidebar('colors');

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

  describe('role management', () => {
    it('renders Add button', () => {
      renderWithSidebar('colors');
      expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
    });

    it('calls addRole when Add button is clicked', () => {
      renderWithSidebar('colors');
      const addButton = screen.getByRole('button', { name: /^add$/i });
      fireEvent.click(addButton);
      expect(mockAddRole).toHaveBeenCalled();
    });

    it('displays role count', () => {
      renderWithSidebar('colors');
      expect(screen.getByText('4/12')).toBeInTheDocument();
    });

    it('disables Add button when at max roles', () => {
      mockPalette = {
        ...mockPalette,
        roles: Array.from({ length: 12 }, (_, i) => ({
          id: `role${i}` as FabricRoleId,
          name: `Role ${i}`,
          color: '#000000',
        })),
      };
      renderWithSidebar('colors');
      const addButton = screen.getByRole('button', { name: /^add$/i });
      expect(addButton).toBeDisabled();
    });

    it('renders remove buttons for each role when canRemoveRole is true', () => {
      renderWithSidebar('colors');
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(4);
    });

    it('does not render remove buttons when canRemoveRole is false', () => {
      mockCanRemoveRole.mockReturnValue(false);
      renderWithSidebar('colors');
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    it('calls removeRole when remove button is clicked', () => {
      renderWithSidebar('colors');
      const removeButton = screen.getByRole('button', { name: /remove background/i });
      fireEvent.click(removeButton);
      expect(mockRemoveRole).toHaveBeenCalledWith('background');
    });
  });

  describe('variant color indicators', () => {
    it('shows purple dot for variant colors when expanded', () => {
      mockPalette = {
        ...mockPalette,
        roles: [
          { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
          { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
          { id: 'variant1' as FabricRoleId, name: 'Variant 1', color: '#FF0000', isVariantColor: true },
          { id: 'variant2' as FabricRoleId, name: 'Variant 2', color: '#00FF00', isVariantColor: true },
        ],
      };
      renderWithSidebar('colors');

      // Find purple dots (variant indicators)
      const purpleDots = document.querySelectorAll('.bg-purple-500');
      expect(purpleDots.length).toBe(2);
    });

    it('does not show purple dot for non-variant colors', () => {
      mockPalette = {
        ...mockPalette,
        roles: [
          { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
          { id: 'feature' as FabricRoleId, name: 'Feature', color: '#1E3A5F' },
        ],
      };
      renderWithSidebar('colors');

      // Should be no purple dots
      const purpleDots = document.querySelectorAll('.bg-purple-500');
      expect(purpleDots.length).toBe(0);
    });

    it('variant color indicator has correct title', () => {
      mockPalette = {
        ...mockPalette,
        roles: [
          { id: 'variant1' as FabricRoleId, name: 'Variant 1', color: '#FF0000', isVariantColor: true },
        ],
      };
      renderWithSidebar('colors');

      const purpleDot = document.querySelector('.bg-purple-500');
      expect(purpleDot).toHaveAttribute('title', 'Custom block color');
    });

    it('shows purple dot in collapsed summary for variant colors', () => {
      mockPalette = {
        ...mockPalette,
        roles: [
          { id: 'background' as FabricRoleId, name: 'Background', color: '#FFFFFF' },
          { id: 'variant1' as FabricRoleId, name: 'Variant 1', color: '#FF0000', isVariantColor: true },
        ],
      };
      renderWithSidebar('borders'); // Collapsed

      // Should show smaller purple dots in summary
      const purpleDots = document.querySelectorAll('.bg-purple-500');
      expect(purpleDots.length).toBe(1);
    });
  });
});
