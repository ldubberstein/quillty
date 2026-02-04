import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeLibraryPanel } from './ShapeLibraryPanel';
import type { ShapeSelectionType } from '@quillty/core';

// Mock store state
let mockSelectedShapeType: ShapeSelectionType | null = null;
let mockMode = 'idle';
const mockSelectShapeForPlacement = vi.fn();
const mockClearShapeSelection = vi.fn();

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      selectShapeForPlacement: mockSelectShapeForPlacement,
      clearShapeSelection: mockClearShapeSelection,
      mode: mockMode,
    };
    return selector(state);
  }),
  useSelectedShapeType: vi.fn(() => mockSelectedShapeType),
}));

describe('ShapeLibraryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedShapeType = null;
    mockMode = 'idle';
  });

  describe('rendering', () => {
    it('renders the shapes header', () => {
      render(<ShapeLibraryPanel />);

      expect(screen.getByText('Shapes')).toBeInTheDocument();
    });

    it('renders all shape options', () => {
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

  describe('shape selection', () => {
    it('calls selectShapeForPlacement when clicking a shape', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select square/i }));

      expect(mockSelectShapeForPlacement).toHaveBeenCalledWith({ type: 'square' });
    });

    it('calls selectShapeForPlacement with HST variant when clicking HST shape', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select ◸/i }));

      expect(mockSelectShapeForPlacement).toHaveBeenCalledWith({
        type: 'hst',
        variant: 'nw',
      });
    });

    it('calls selectShapeForPlacement with flying_geese when clicking flying geese', () => {
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select geese/i }));

      expect(mockSelectShapeForPlacement).toHaveBeenCalledWith({ type: 'flying_geese' });
    });

    it('calls clearShapeSelection when clicking already selected shape', () => {
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /select square/i }));

      expect(mockClearShapeSelection).toHaveBeenCalled();
      expect(mockSelectShapeForPlacement).not.toHaveBeenCalled();
    });

    it('shows selected shape with pressed state', () => {
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      const squareButton = screen.getByRole('button', { name: /select square/i });
      expect(squareButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows non-selected shapes without pressed state', () => {
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      const hstButton = screen.getByRole('button', { name: /select ◸/i });
      expect(hstButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('placing mode feedback', () => {
    it('shows feedback when in placing_shape mode', () => {
      mockMode = 'placing_shape';
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap cells to place shape/i)).toBeInTheDocument();
    });

    it('shows cancel button when in placing_shape mode', () => {
      mockMode = 'placing_shape';
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls clearShapeSelection when cancel button is clicked', () => {
      mockMode = 'placing_shape';
      mockSelectedShapeType = { type: 'square' };
      render(<ShapeLibraryPanel />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockClearShapeSelection).toHaveBeenCalled();
    });

    it('shows flying geese instructions when flying geese selected', () => {
      mockMode = 'placing_shape';
      mockSelectedShapeType = { type: 'flying_geese' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap first cell, then adjacent cell/i)).toBeInTheDocument();
    });

    it('shows second tap instruction for flying geese second mode', () => {
      mockMode = 'placing_flying_geese_second';
      mockSelectedShapeType = { type: 'flying_geese' };
      render(<ShapeLibraryPanel />);

      expect(screen.getByText(/tap an adjacent cell to complete/i)).toBeInTheDocument();
    });
  });

  describe('HST variant selection', () => {
    it('correctly identifies selected HST variant', () => {
      mockSelectedShapeType = { type: 'hst', variant: 'ne' };
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
