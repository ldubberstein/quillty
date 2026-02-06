import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeLibraryPanel } from './ShapeLibraryPanel';
import type { UnitSelectionType } from '@quillty/core';

// Mock store state
let mockSelectedUnitType: UnitSelectionType | null = null;
let mockMode = 'idle';
const mockSelectUnitForPlacement = vi.fn();
const mockClearUnitSelection = vi.fn();

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      selectUnitForPlacement: mockSelectUnitForPlacement,
      clearUnitSelection: mockClearUnitSelection,
      mode: mockMode,
    };
    return selector(state);
  }),
  useSelectedUnitType: vi.fn(() => mockSelectedUnitType),
}));

describe('ShapeLibraryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedUnitType = null;
    mockMode = 'idle';
  });

  describe('rendering', () => {
    it('renders the shapes header', () => {
      render(<ShapeLibraryPanel />);

      expect(screen.getByText('Shapes')).toBeInTheDocument();
    });

    it('renders all unit options', () => {
      render(<ShapeLibraryPanel />);

      expect(screen.getByRole('button', { name: /select square/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select ◸/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select ◹/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select ◺/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select ◿/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select geese/i })).toBeInTheDocument();
    });

    it('does not show cancel button when not in placing mode', () => {
      mockMode = 'idle';
      render(<ShapeLibraryPanel />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('unit selection', () => {
    it('calls selectUnitForPlacement when clicking a unit', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select square/i }));

      expect(mockSelectUnitForPlacement).toHaveBeenCalledWith({ type: 'square' });
    });

    it('calls selectUnitForPlacement with HST variant when clicking HST unit', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select ◸/i }));

      expect(mockSelectUnitForPlacement).toHaveBeenCalledWith({
        type: 'hst',
        variant: 'nw',
      });
    });

    it('calls selectUnitForPlacement with flying_geese when clicking flying geese', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select geese/i }));

      expect(mockSelectUnitForPlacement).toHaveBeenCalledWith({ type: 'flying_geese' });
    });

    it('calls clearUnitSelection when clicking already selected unit', () => {
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select square/i }));

      expect(mockClearUnitSelection).toHaveBeenCalled();
      expect(mockSelectUnitForPlacement).not.toHaveBeenCalled();
    });

    it('shows selected unit with pressed state', () => {
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      const squareButton = screen.getByRole('button', { name: /select square/i });
      expect(squareButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows non-selected units without pressed state', () => {
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      const hstButton = screen.getByRole('button', { name: /select ◸/i });
      expect(hstButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('placing mode feedback', () => {
    it('shows feedback when in placing_unit mode', () => {
      mockMode = 'placing_unit';
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap cells to place unit/i)).toBeInTheDocument();
    });

    it('shows cancel button when in placing_unit mode', () => {
      mockMode = 'placing_unit';
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls clearUnitSelection when cancel button is clicked', () => {
      mockMode = 'placing_unit';
      mockSelectedUnitType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockClearUnitSelection).toHaveBeenCalled();
    });

    it('shows flying geese instructions when flying geese selected', () => {
      mockMode = 'placing_unit';
      mockSelectedUnitType = { type: 'flying_geese' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap first cell, then adjacent cell/i)).toBeInTheDocument();
    });

    it('shows second tap instruction for flying geese second mode', () => {
      mockMode = 'placing_flying_geese_second';
      mockSelectedUnitType = { type: 'flying_geese' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap an adjacent cell to complete/i)).toBeInTheDocument();
    });
  });

  describe('HST variant selection', () => {
    it('correctly identifies selected HST variant', () => {
      mockSelectedUnitType = { type: 'hst', variant: 'ne' };
      render(<ShapeLibraryPanel />);

      // The NE variant should be selected
      const neButton = screen.getByRole('button', { name: /select ◹/i });
      expect(neButton).toHaveAttribute('aria-pressed', 'true');

      // Other HST variants should not be selected
      const nwButton = screen.getByRole('button', { name: /select ◸/i });
      expect(nwButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
