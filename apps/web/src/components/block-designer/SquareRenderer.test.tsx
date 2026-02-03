/**
 * SquareRenderer Component Tests
 *
 * Note: react-konva components are mocked in vitest.setup.tsx
 * Tests verify props are passed correctly to the mocked Rect component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SquareRenderer } from './SquareRenderer';
import type { SquareShape, Palette } from '@quillty/core';

describe('SquareRenderer', () => {
  const mockPalette: Palette = {
    roles: [
      { id: 'background', name: 'Background', color: '#FFFFFF' },
      { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1', name: 'Accent 1', color: '#E85D04' },
      { id: 'accent2', name: 'Accent 2', color: '#FAA307' },
    ],
  };

  const mockShape: SquareShape = {
    id: 'test-square-1',
    type: 'square',
    position: { row: 0, col: 0 },
    span: { rows: 1, cols: 1 },
    fabricRole: 'feature',
  };

  const defaultProps = {
    shape: mockShape,
    cellSize: 100,
    offsetX: 50,
    offsetY: 50,
    palette: mockPalette,
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<SquareRenderer {...defaultProps} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('renders a Konva Rect element', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('calculates correct position for cell (0,0)', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      // Position = offset + (col * cellSize) + padding
      // x = 50 + (0 * 100) + 1 = 51
      // y = 50 + (0 * 100) + 1 = 51
      expect(rect).toHaveAttribute('x', '51');
      expect(rect).toHaveAttribute('y', '51');
    });

    it('calculates correct position for cell (1,2)', () => {
      const shape: SquareShape = {
        ...mockShape,
        position: { row: 1, col: 2 },
      };
      render(<SquareRenderer {...defaultProps} shape={shape} />);
      const rect = screen.getByTestId('konva-rect');
      // x = 50 + (2 * 100) + 1 = 251
      // y = 50 + (1 * 100) + 1 = 151
      expect(rect).toHaveAttribute('x', '251');
      expect(rect).toHaveAttribute('y', '151');
    });
  });

  describe('sizing', () => {
    it('calculates correct size with padding', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      // Size = cellSize - (padding * 2) = 100 - 2 = 98
      expect(rect).toHaveAttribute('width', '98');
      expect(rect).toHaveAttribute('height', '98');
    });

    it('adjusts size based on cellSize prop', () => {
      render(<SquareRenderer {...defaultProps} cellSize={150} />);
      const rect = screen.getByTestId('konva-rect');
      // Size = 150 - 2 = 148
      expect(rect).toHaveAttribute('width', '148');
      expect(rect).toHaveAttribute('height', '148');
    });
  });

  describe('color handling', () => {
    it('uses feature color from palette', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#1E3A5F');
    });

    it('uses background color when fabricRole is background', () => {
      const shape: SquareShape = {
        ...mockShape,
        fabricRole: 'background',
      };
      render(<SquareRenderer {...defaultProps} shape={shape} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#FFFFFF');
    });

    it('uses accent1 color when fabricRole is accent1', () => {
      const shape: SquareShape = {
        ...mockShape,
        fabricRole: 'accent1',
      };
      render(<SquareRenderer {...defaultProps} shape={shape} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#E85D04');
    });

    it('uses fallback color when role not found', () => {
      const shape: SquareShape = {
        ...mockShape,
        fabricRole: 'nonexistent',
      };
      render(<SquareRenderer {...defaultProps} shape={shape} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#CCCCCC');
    });
  });

  describe('selection state', () => {
    it('shows outline stroke by default (for visibility)', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      // When not selected, shows gray outline for visibility
      expect(rect).toHaveAttribute('stroke', '#D1D5DB');
    });

    it('shows selection styles when isSelected is true', () => {
      render(<SquareRenderer {...defaultProps} isSelected={true} />);
      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('stroke', '#3B82F6');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<SquareRenderer {...defaultProps} onClick={handleClick} />);
      const rect = screen.getByTestId('konva-rect');
      fireEvent.click(rect);
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not throw when onClick is not provided', () => {
      render(<SquareRenderer {...defaultProps} />);
      const rect = screen.getByTestId('konva-rect');
      expect(() => fireEvent.click(rect)).not.toThrow();
    });
  });
});
