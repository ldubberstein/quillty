/**
 * EmptyCell Component Tests
 *
 * Note: react-konva is mocked in vitest.setup.tsx
 * Tests verify component rendering and callback behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EmptyCell } from './EmptyCell';

describe('EmptyCell', () => {
  const defaultProps = {
    row: 1,
    col: 2,
    cellSize: 100,
    offsetX: 50,
    offsetY: 50,
  };

  const mockOnClick = vi.fn();
  const mockOnMouseEnter = vi.fn();
  const mockOnMouseLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the cell group', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} />);
      });

      // The mocked Group is rendered as a div with data-testid="konva-group"
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('renders the cell rect', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} />);
      });

      // The mocked Rect is rendered as a div with data-testid="konva-rect"
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onClick with row and col when clicked', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} onClick={mockOnClick} />);
      });

      const rect = screen.getByTestId('konva-rect');
      fireEvent.click(rect);

      expect(mockOnClick).toHaveBeenCalledWith(1, 2);
    });

    it('does not throw when onClick is not provided', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} />);
      });

      const rect = screen.getByTestId('konva-rect');
      expect(() => fireEvent.click(rect)).not.toThrow();
    });
  });

  describe('mouse events', () => {
    it('calls onMouseEnter with row and col on mouse enter', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} onMouseEnter={mockOnMouseEnter} />);
      });

      const rect = screen.getByTestId('konva-rect');
      fireEvent.mouseEnter(rect);

      expect(mockOnMouseEnter).toHaveBeenCalledWith(1, 2);
    });

    it('calls onMouseLeave on mouse leave', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} onMouseLeave={mockOnMouseLeave} />);
      });

      const rect = screen.getByTestId('konva-rect');
      fireEvent.mouseLeave(rect);

      expect(mockOnMouseLeave).toHaveBeenCalled();
    });

    it('does not throw when mouse handlers are not provided', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} />);
      });

      const rect = screen.getByTestId('konva-rect');
      expect(() => fireEvent.mouseEnter(rect)).not.toThrow();
      expect(() => fireEvent.mouseLeave(rect)).not.toThrow();
    });
  });

  describe('visual states', () => {
    it('renders without plus icon when not hovered', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} isHovered={false} isHighlighted={true} />);
      });

      // Only one group (the main wrapper), no plus icon group
      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBe(1);
    });

    it('renders plus icon when hovered and highlighted', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} isHovered={true} isHighlighted={true} />);
      });

      // Two groups: main wrapper + plus icon group
      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBe(2);
    });

    it('renders plus icon when hovered and is valid flying geese target', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} isHovered={true} isValidFlyingGeeseTarget={true} />);
      });

      // Two groups: main wrapper + plus icon group
      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBe(2);
    });

    it('does not render plus icon when only highlighted but not hovered', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} isHovered={false} isHighlighted={true} />);
      });

      // Only one group (the main wrapper)
      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBe(1);
    });

    it('does not render plus icon when only hovered but not highlighted', async () => {
      await act(async () => {
        render(<EmptyCell {...defaultProps} isHovered={true} isHighlighted={false} />);
      });

      // Only one group (the main wrapper)
      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBe(1);
    });
  });

  describe('props with different values', () => {
    it('handles different row/col values', async () => {
      await act(async () => {
        render(
          <EmptyCell
            row={5}
            col={3}
            cellSize={100}
            offsetX={0}
            offsetY={0}
            onClick={mockOnClick}
          />
        );
      });

      const rect = screen.getByTestId('konva-rect');
      fireEvent.click(rect);

      expect(mockOnClick).toHaveBeenCalledWith(5, 3);
    });
  });
});
