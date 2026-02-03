/**
 * GridLines Component Tests
 *
 * Note: react-konva components are mocked in vitest.setup.ts
 * Tests verify props and rendering logic rather than actual canvas rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GridLines } from './GridLines';

describe('GridLines', () => {
  const defaultProps = {
    gridSize: 3 as const,
    cellSize: 100,
    offsetX: 50,
    offsetY: 50,
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<GridLines {...defaultProps} />);
      // With mocked react-konva, we should see our mock elements
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('renders grid background rect', () => {
      render(<GridLines {...defaultProps} />);
      // The mocked Rect should be present
      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThanOrEqual(1);
    });

    it('renders grid lines', () => {
      render(<GridLines {...defaultProps} />);
      // For a 3x3 grid, we should have 2 vertical + 2 horizontal inner lines = 4 lines
      const lines = screen.getAllByTestId('konva-line');
      expect(lines.length).toBe(4); // (gridSize - 1) * 2
    });
  });

  describe('grid sizes', () => {
    it('renders correct number of lines for 2x2 grid', () => {
      render(<GridLines {...defaultProps} gridSize={2} />);
      const lines = screen.getAllByTestId('konva-line');
      // For 2x2: 1 vertical + 1 horizontal = 2 lines
      expect(lines.length).toBe(2);
    });

    it('renders correct number of lines for 4x4 grid', () => {
      render(<GridLines {...defaultProps} gridSize={4} />);
      const lines = screen.getAllByTestId('konva-line');
      // For 4x4: 3 vertical + 3 horizontal = 6 lines
      expect(lines.length).toBe(6);
    });
  });

  describe('props handling', () => {
    it('accepts different cell sizes', () => {
      const { rerender } = render(<GridLines {...defaultProps} cellSize={50} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();

      rerender(<GridLines {...defaultProps} cellSize={150} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('accepts different offset values', () => {
      render(<GridLines {...defaultProps} offsetX={100} offsetY={200} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });
  });
});
