/**
 * BorderPanel Component Tests
 *
 * Tests for the border configuration panel that allows
 * users to add and configure quilt borders.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BorderPanel } from './BorderPanel';
import { SidebarProvider } from './SidebarContext';
import type { Border, FabricRoleId } from '@quillty/core';

// Mock store functions
const mockSetBordersEnabled = vi.fn();
const mockAddBorder = vi.fn();
const mockRemoveBorder = vi.fn();
const mockUpdateBorder = vi.fn();
const mockSelectBorder = vi.fn();

// Store state that can be modified per test
let mockBordersEnabled = true;
let mockBorders: Border[] = [];
let mockSelectedBorderId: string | null = null;
let mockFinalWidth = 48;
let mockFinalHeight = 48;
let mockCanAddBorder = true;
const mockPalette = {
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
      setBordersEnabled: mockSetBordersEnabled,
      addBorder: mockAddBorder,
      removeBorder: mockRemoveBorder,
      updateBorder: mockUpdateBorder,
      selectBorder: mockSelectBorder,
    };
    return selector ? selector(state) : state;
  }),
  useBordersEnabled: vi.fn(() => mockBordersEnabled),
  useBorders: vi.fn(() => mockBorders),
  useSelectedBorderId: vi.fn(() => mockSelectedBorderId),
  useFinalQuiltWidth: vi.fn(() => mockFinalWidth),
  useFinalQuiltHeight: vi.fn(() => mockFinalHeight),
  useCanAddBorder: vi.fn(() => mockCanAddBorder),
  usePatternPalette: vi.fn(() => mockPalette),
  MAX_BORDERS: 4,
}));

// Helper to render with SidebarProvider
const renderWithSidebar = (defaultPanel: 'colors' | 'borders' | 'grid' | null = 'borders') => {
  return render(
    <SidebarProvider defaultPanel={defaultPanel}>
      <BorderPanel />
    </SidebarProvider>
  );
};

describe('BorderPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockBordersEnabled = true;
    mockBorders = [];
    mockSelectedBorderId = null;
    mockFinalWidth = 48;
    mockFinalHeight = 48;
    mockCanAddBorder = true;
  });

  describe('rendering', () => {
    it('renders the panel with Borders heading', () => {
      renderWithSidebar();
      expect(screen.getByText('Borders')).toBeInTheDocument();
    });

    it('shows Add Border button when expanded and can add', () => {
      renderWithSidebar('borders');
      expect(screen.getByRole('button', { name: /add border/i })).toBeInTheDocument();
    });

    it('shows empty state hint when no borders', () => {
      renderWithSidebar('borders');
      expect(screen.getByText('Add a border frame around your quilt')).toBeInTheDocument();
    });
  });

  describe('collapsible behavior', () => {
    it('shows collapsed summary with "None" when no borders', () => {
      renderWithSidebar('colors'); // Another panel expanded
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('shows border count and dimensions in collapsed summary', () => {
      mockBorders = [
        {
          id: 'border-1',
          widthInches: 3,
          style: 'plain',
          fabricRole: 'accent1',
          cornerStyle: 'mitered',
        },
      ];
      mockFinalWidth = 54;
      mockFinalHeight = 54;

      renderWithSidebar('colors'); // Another panel expanded

      expect(screen.getByText('1 · 54" × 54"')).toBeInTheDocument();
    });

    it('shows "(hidden)" in summary when borders exist but disabled', () => {
      mockBorders = [
        {
          id: 'border-1',
          widthInches: 3,
          style: 'plain',
          fabricRole: 'accent1',
          cornerStyle: 'mitered',
        },
      ];
      mockBordersEnabled = false;

      renderWithSidebar('colors'); // Another panel expanded

      expect(screen.getByText('1 (hidden)')).toBeInTheDocument();
    });

    it('expands when header is clicked', () => {
      renderWithSidebar('colors'); // Start with colors expanded

      // Click borders header to expand it
      const bordersHeader = screen.getByText('Borders').closest('button');
      fireEvent.click(bordersHeader!);

      // Now should show expanded content (Add Border button)
      expect(screen.getByRole('button', { name: /add border/i })).toBeInTheDocument();
    });

    it('collapses when header is clicked while expanded', () => {
      renderWithSidebar('borders'); // Start expanded

      // Verify expanded
      expect(screen.getByRole('button', { name: /add border/i })).toBeInTheDocument();

      // Click header to collapse
      const bordersHeader = screen.getByText('Borders').closest('button');
      fireEvent.click(bordersHeader!);

      // Should be collapsed now
      expect(screen.queryByRole('button', { name: /add border/i })).not.toBeInTheDocument();
    });
  });

  describe('adding borders', () => {
    it('calls addBorder when Add Border button is clicked', () => {
      renderWithSidebar('borders');

      const addButton = screen.getByRole('button', { name: /add border/i });
      fireEvent.click(addButton);

      expect(mockAddBorder).toHaveBeenCalled();
    });

    it('shows border count in button when borders exist', () => {
      mockBorders = [
        {
          id: 'border-1',
          widthInches: 3,
          style: 'plain',
          fabricRole: 'accent1',
          cornerStyle: 'mitered',
        },
      ];

      renderWithSidebar('borders');

      expect(screen.getByRole('button', { name: /add border \(1\/4\)/i })).toBeInTheDocument();
    });

    it('hides Add Border button when at max borders', () => {
      mockCanAddBorder = false;
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
        { id: 'border-2', widthInches: 3, style: 'plain', fabricRole: 'accent2', cornerStyle: 'butted' },
        { id: 'border-3', widthInches: 2, style: 'plain', fabricRole: 'feature', cornerStyle: 'cornerstone' },
        { id: 'border-4', widthInches: 4, style: 'plain', fabricRole: 'background', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      expect(screen.queryByRole('button', { name: /add border/i })).not.toBeInTheDocument();
    });
  });

  describe('border list', () => {
    it('renders border items when borders exist', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
        { id: 'border-2', widthInches: 3, style: 'plain', fabricRole: 'accent2', cornerStyle: 'butted' },
      ];

      renderWithSidebar('borders');

      expect(screen.getByText('Border 1')).toBeInTheDocument();
      expect(screen.getByText('Border 2')).toBeInTheDocument();
    });

    it('shows border width and corner style', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      expect(screen.getByText('2" · mitered')).toBeInTheDocument();
    });

    it('calls selectBorder when border item is clicked', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      const borderItem = screen.getByText('Border 1').closest('div[class*="cursor-pointer"]');
      fireEvent.click(borderItem!);

      expect(mockSelectBorder).toHaveBeenCalledWith('border-1');
    });

    it('calls removeBorder when delete button is clicked', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      const deleteButton = screen.getByRole('button', { name: /remove border/i });
      fireEvent.click(deleteButton);

      expect(mockRemoveBorder).toHaveBeenCalledWith('border-1');
    });
  });

  describe('toggle switch', () => {
    it('shows toggle switch when borders exist and panel is expanded', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      const toggleButton = screen.getByRole('button', { name: /hide borders|show borders/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('does not show toggle switch when no borders', () => {
      renderWithSidebar('borders');

      expect(screen.queryByRole('button', { name: /hide borders|show borders/i })).not.toBeInTheDocument();
    });

    it('calls setBordersEnabled when toggle is clicked', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 2, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];

      renderWithSidebar('borders');

      const toggleButton = screen.getByRole('button', { name: /hide borders/i });
      fireEvent.click(toggleButton);

      expect(mockSetBordersEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('final size display', () => {
    it('shows final quilt size when borders exist', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 3, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];
      mockFinalWidth = 54;
      mockFinalHeight = 54;

      renderWithSidebar('borders');

      expect(screen.getByText('Final quilt size:')).toBeInTheDocument();
      expect(screen.getByText('54" × 54"')).toBeInTheDocument();
    });

    it('does not show final size when no borders', () => {
      renderWithSidebar('borders');

      expect(screen.queryByText('Final quilt size:')).not.toBeInTheDocument();
    });

    it('shows "(borders hidden)" when borders disabled', () => {
      mockBorders = [
        { id: 'border-1', widthInches: 3, style: 'plain', fabricRole: 'accent1', cornerStyle: 'mitered' },
      ];
      mockBordersEnabled = false;

      renderWithSidebar('borders');

      expect(screen.getByText('(borders hidden)')).toBeInTheDocument();
    });
  });
});
