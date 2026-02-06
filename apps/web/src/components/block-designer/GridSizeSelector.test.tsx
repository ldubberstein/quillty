import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock store state
let mockGridSize = 3;
const mockSetGridSize = vi.fn();
const mockGetUnitsOutOfBounds = vi.fn(() => []);

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      setGridSize: mockSetGridSize,
      getUnitsOutOfBounds: mockGetUnitsOutOfBounds,
    };
    return selector ? selector(state) : state;
  }),
  useBlockGridSize: vi.fn(() => mockGridSize),
  GRID_SIZES: [2, 3, 4, 5, 6, 7, 8, 9],
}));

import { GridSizeSelector } from './GridSizeSelector';

describe('GridSizeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGridSize = 3;
    mockGetUnitsOutOfBounds.mockReturnValue([]);
  });

  describe('rendering', () => {
    it('renders current grid size', () => {
      render(<GridSizeSelector />);
      expect(screen.getByText('3×3 grid')).toBeInTheDocument();
    });

    it('renders dropdown button with correct aria attributes', () => {
      render(<GridSizeSelector />);
      const button = screen.getByRole('button', { name: /change grid size/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('does not show dropdown menu by default', () => {
      render(<GridSizeSelector />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('opens dropdown when button is clicked', () => {
      render(<GridSizeSelector />);
      const button = screen.getByRole('button', { name: /change grid size/i });

      fireEvent.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows all grid size options when open', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(8);
      expect(screen.getByRole('option', { name: '2×2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '3×3' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4×4' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '5×5' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '6×6' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '7×7' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '8×8' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '9×9' })).toBeInTheDocument();
    });

    it('marks current size as selected', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      const selectedOption = screen.getByRole('option', { name: '3×3' });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('closes dropdown when clicking outside', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on escape key', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('toggles dropdown when button clicked twice', () => {
      render(<GridSizeSelector />);
      const button = screen.getByRole('button', { name: /change grid size/i });

      fireEvent.click(button);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('size selection', () => {
    it('calls setGridSize when selecting a different size with no units affected', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      fireEvent.click(screen.getByRole('option', { name: '5×5' }));

      expect(mockSetGridSize).toHaveBeenCalledWith(5);
    });

    it('closes dropdown after selecting a size', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      fireEvent.click(screen.getByRole('option', { name: '5×5' }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not call setGridSize when selecting the current size', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      fireEvent.click(screen.getByRole('option', { name: '3×3' }));

      expect(mockSetGridSize).not.toHaveBeenCalled();
    });

    it('checks for out-of-bounds units before changing size', () => {
      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));

      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      expect(mockGetUnitsOutOfBounds).toHaveBeenCalledWith(2);
    });
  });

  describe('confirmation dialog', () => {
    const mockOutOfBoundsUnits = [
      {
        id: 'shape-1',
        type: 'square',
        position: { row: 2, col: 2 },
        span: { rows: 1, cols: 1 },
        fabricRole: 'feature',
      },
    ];

    it('shows confirmation dialog when shrinking would remove units', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      expect(screen.getByText('Remove Units?')).toBeInTheDocument();
      expect(screen.getByText(/will remove/)).toBeInTheDocument();
      expect(screen.getByText('1 unit')).toBeInTheDocument();
    });

    it('shows plural text for multiple units', () => {
      mockGetUnitsOutOfBounds.mockReturnValue([
        ...mockOutOfBoundsUnits,
        {
          id: 'shape-2',
          type: 'square',
          position: { row: 3, col: 3 },
          span: { rows: 1, cols: 1 },
          fabricRole: 'accent1',
        },
      ]);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      expect(screen.getByText('2 units')).toBeInTheDocument();
      expect(screen.getByText(/that are outside/)).toBeInTheDocument();
    });

    it('applies size change when confirmation is confirmed', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      // Dialog should be shown, setGridSize not yet called
      expect(mockSetGridSize).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /remove & resize/i }));

      expect(mockSetGridSize).toHaveBeenCalledWith(2);
    });

    it('cancels size change when Cancel button is clicked', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockSetGridSize).not.toHaveBeenCalled();
      expect(screen.queryByText('Remove Units?')).not.toBeInTheDocument();
    });

    it('cancels size change when close button is clicked', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(mockSetGridSize).not.toHaveBeenCalled();
      expect(screen.queryByText('Remove Units?')).not.toBeInTheDocument();
    });

    it('cancels size change when escape is pressed', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockSetGridSize).not.toHaveBeenCalled();
      expect(screen.queryByText('Remove Units?')).not.toBeInTheDocument();
    });

    it('cancels size change when backdrop is clicked', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      // Click the backdrop (the fixed overlay div)
      const backdrop = screen.getByText('Remove Units?').closest('.fixed');
      fireEvent.click(backdrop!);

      expect(mockSetGridSize).not.toHaveBeenCalled();
      expect(screen.queryByText('Remove Units?')).not.toBeInTheDocument();
    });

    it('shows undo hint in confirmation dialog', () => {
      mockGetUnitsOutOfBounds.mockReturnValue(mockOutOfBoundsUnits);

      render(<GridSizeSelector />);
      fireEvent.click(screen.getByRole('button', { name: /change grid size/i }));
      fireEvent.click(screen.getByRole('option', { name: '2×2' }));

      expect(screen.getByText(/undo this action/i)).toBeInTheDocument();
    });
  });
});
