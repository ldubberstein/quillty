/**
 * FlyingGeeseRenderer Component Tests
 *
 * Note: react-konva components are mocked in vitest.setup.tsx
 * Tests verify props are passed correctly to the mocked components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlyingGeeseRenderer } from './FlyingGeeseRenderer';
import type { FlyingGeeseShape, Palette, FlyingGeeseDirection } from '@quillty/core';

describe('FlyingGeeseRenderer', () => {
  const mockPalette: Palette = {
    roles: [
      { id: 'background', name: 'Background', color: '#FFFFFF' },
      { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1', name: 'Accent 1', color: '#E85D04' },
      { id: 'accent2', name: 'Accent 2', color: '#FAA307' },
    ],
  };

  const createMockShape = (direction: FlyingGeeseDirection): FlyingGeeseShape => {
    const isHorizontal = direction === 'left' || direction === 'right';
    return {
      id: `test-flying-geese-${direction}`,
      type: 'flying_geese',
      position: { row: 0, col: 0 },
      span: isHorizontal ? { rows: 1, cols: 2 } : { rows: 2, cols: 1 },
      fabricRole: 'feature',
      direction,
      secondaryFabricRole: 'background',
    };
  };

  const defaultProps = {
    shape: createMockShape('right'),
    cellSize: 100,
    offsetX: 50,
    offsetY: 50,
    palette: mockPalette,
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('renders three Line elements for the triangles (1 goose + 2 sky)', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // Sky1 + Sky2 + Goose = 3 triangles
      expect(lines).toHaveLength(3);
    });
  });

  describe('Flying Geese directions', () => {
    it.each(['up', 'down', 'left', 'right'] as FlyingGeeseDirection[])(
      'renders direction: %s',
      (direction) => {
        const shape = createMockShape(direction);
        render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
        expect(screen.getByTestId('konva-group')).toBeInTheDocument();
      }
    );
  });

  describe('color handling', () => {
    it('uses feature color for goose triangle', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // The third line (goose) should have the feature color
      const gooseLine = lines[2];
      expect(gooseLine).toHaveAttribute('fill', '#1E3A5F');
    });

    it('uses background color for sky triangles', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // First two lines (sky) should have the background color
      expect(lines[0]).toHaveAttribute('fill', '#FFFFFF');
      expect(lines[1]).toHaveAttribute('fill', '#FFFFFF');
    });

    it('uses custom fabric roles', () => {
      const shape: FlyingGeeseShape = {
        ...createMockShape('right'),
        fabricRole: 'accent1',
        secondaryFabricRole: 'accent2',
      };
      render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines[0]).toHaveAttribute('fill', '#FAA307'); // accent2 sky
      expect(lines[1]).toHaveAttribute('fill', '#FAA307'); // accent2 sky
      expect(lines[2]).toHaveAttribute('fill', '#E85D04'); // accent1 goose
    });

    it('uses fallback colors when roles not found', () => {
      const shape: FlyingGeeseShape = {
        ...createMockShape('right'),
        fabricRole: 'nonexistent',
        secondaryFabricRole: 'alsoNonexistent',
      };
      render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines[0]).toHaveAttribute('fill', '#FFFFFF'); // fallback for sky
      expect(lines[1]).toHaveAttribute('fill', '#FFFFFF'); // fallback for sky
      expect(lines[2]).toHaveAttribute('fill', '#CCCCCC'); // fallback for goose
    });
  });

  describe('positioning', () => {
    it('renders Group for position (0,0)', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const group = screen.getByTestId('konva-group');
      expect(group).toBeInTheDocument();
    });

    it('renders for different grid positions', () => {
      const shape: FlyingGeeseShape = {
        ...createMockShape('right'),
        position: { row: 2, col: 1 },
      };
      render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
      const group = screen.getByTestId('konva-group');
      expect(group).toBeInTheDocument();
    });
  });

  describe('span handling', () => {
    it('renders horizontal Flying Geese (2 cols)', () => {
      const shape = createMockShape('right');
      expect(shape.span).toEqual({ rows: 1, cols: 2 });
      render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('renders vertical Flying Geese (2 rows)', () => {
      const shape = createMockShape('up');
      expect(shape.span).toEqual({ rows: 2, cols: 1 });
      render(<FlyingGeeseRenderer {...defaultProps} shape={shape} />);
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });
  });

  describe('triangle geometry', () => {
    it('passes points array to all Line elements', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');

      // All lines should have points attribute
      expect(lines[0]).toHaveAttribute('points');
      expect(lines[1]).toHaveAttribute('points');
      expect(lines[2]).toHaveAttribute('points');
    });

    it('renders exactly 3 line elements for triangles', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines).toHaveLength(3);
    });
  });

  describe('selection state', () => {
    it('does not show selection stroke by default', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // Should only have 3 lines (sky1 + sky2 + goose), no selection border
      expect(lines).toHaveLength(3);
    });

    it('shows selection overlay when isSelected is true', () => {
      render(<FlyingGeeseRenderer {...defaultProps} isSelected={true} />);
      const lines = screen.getAllByTestId('konva-line');
      // Should have 4 lines: sky1, sky2, goose, and selection border
      expect(lines).toHaveLength(4);
    });

    it('selection overlay has correct stroke color', () => {
      render(<FlyingGeeseRenderer {...defaultProps} isSelected={true} />);
      const lines = screen.getAllByTestId('konva-line');
      const selectionLine = lines[3]; // Last line is selection
      expect(selectionLine).toHaveAttribute('stroke', '#3B82F6');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<FlyingGeeseRenderer {...defaultProps} onClick={handleClick} />);
      const group = screen.getByTestId('konva-group');
      fireEvent.click(group);
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not throw when onClick is not provided', () => {
      render(<FlyingGeeseRenderer {...defaultProps} />);
      const group = screen.getByTestId('konva-group');
      expect(() => fireEvent.click(group)).not.toThrow();
    });
  });
});
