/**
 * HstRenderer Component Tests
 *
 * Note: react-konva components are mocked in vitest.setup.tsx
 * Tests verify props are passed correctly to the mocked components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HstRenderer } from './HstRenderer';
import type { HstShape, Palette, HstVariant } from '@quillty/core';

describe('HstRenderer', () => {
  const mockPalette: Palette = {
    roles: [
      { id: 'background', name: 'Background', color: '#FFFFFF' },
      { id: 'feature', name: 'Feature', color: '#1E3A5F' },
      { id: 'accent1', name: 'Accent 1', color: '#E85D04' },
      { id: 'accent2', name: 'Accent 2', color: '#FAA307' },
    ],
  };

  const createMockShape = (variant: HstVariant): HstShape => ({
    id: `test-hst-${variant}`,
    type: 'hst',
    position: { row: 0, col: 0 },
    span: { rows: 1, cols: 1 },
    fabricRole: 'feature',
    variant,
    secondaryFabricRole: 'background',
  });

  const defaultProps = {
    shape: createMockShape('nw'),
    cellSize: 100,
    offsetX: 50,
    offsetY: 50,
    palette: mockPalette,
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<HstRenderer {...defaultProps} />);
      // Should render a Group containing Lines
      expect(screen.getByTestId('konva-group')).toBeInTheDocument();
    });

    it('renders two Line elements for the triangles', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // Primary triangle + secondary triangle
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('HST variants', () => {
    it.each(['nw', 'ne', 'sw', 'se'] as HstVariant[])(
      'renders variant: %s',
      (variant) => {
        const shape = createMockShape(variant);
        render(<HstRenderer {...defaultProps} shape={shape} />);
        expect(screen.getByTestId('konva-group')).toBeInTheDocument();
      }
    );
  });

  describe('color handling', () => {
    it('uses feature color for primary triangle', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // The second line (primary) should have the feature color
      const primaryLine = lines[1];
      expect(primaryLine).toHaveAttribute('fill', '#1E3A5F');
    });

    it('uses background color for secondary triangle', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // The first line (secondary) should have the background color
      const secondaryLine = lines[0];
      expect(secondaryLine).toHaveAttribute('fill', '#FFFFFF');
    });

    it('uses custom fabric roles', () => {
      const shape: HstShape = {
        ...createMockShape('nw'),
        fabricRole: 'accent1',
        secondaryFabricRole: 'accent2',
      };
      render(<HstRenderer {...defaultProps} shape={shape} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines[0]).toHaveAttribute('fill', '#FAA307'); // accent2 secondary
      expect(lines[1]).toHaveAttribute('fill', '#E85D04'); // accent1 primary
    });

    it('uses fallback color when role not found', () => {
      const shape: HstShape = {
        ...createMockShape('nw'),
        fabricRole: 'nonexistent',
        secondaryFabricRole: 'alsoNonexistent',
      };
      render(<HstRenderer {...defaultProps} shape={shape} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines[0]).toHaveAttribute('fill', '#FFFFFF'); // fallback for secondary
      expect(lines[1]).toHaveAttribute('fill', '#CCCCCC'); // fallback for primary
    });
  });

  describe('positioning', () => {
    it('renders Group for position (0,0)', () => {
      render(<HstRenderer {...defaultProps} />);
      const group = screen.getByTestId('konva-group');
      // Verifies component renders correctly
      expect(group).toBeInTheDocument();
    });

    it('renders for different grid positions', () => {
      const shape: HstShape = {
        ...createMockShape('nw'),
        position: { row: 2, col: 1 },
      };
      render(<HstRenderer {...defaultProps} shape={shape} />);
      const group = screen.getByTestId('konva-group');
      expect(group).toBeInTheDocument();
    });
  });

  describe('triangle geometry', () => {
    it('passes points array to Line elements', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');

      // Both lines should have points attribute
      expect(lines[0]).toHaveAttribute('points');
      expect(lines[1]).toHaveAttribute('points');
    });

    it('renders exactly 2 line elements for triangles', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(lines).toHaveLength(2);
    });
  });

  describe('selection state', () => {
    it('does not show selection stroke by default', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      // Should only have 2 lines (primary + secondary), no selection border
      expect(lines).toHaveLength(2);
    });

    it('shows selection overlay when isSelected is true', () => {
      render(<HstRenderer {...defaultProps} isSelected={true} />);
      const lines = screen.getAllByTestId('konva-line');
      // Should have 3 lines: secondary, primary, and selection border
      expect(lines).toHaveLength(3);
    });

    it('selection overlay has correct stroke color', () => {
      render(<HstRenderer {...defaultProps} isSelected={true} />);
      const lines = screen.getAllByTestId('konva-line');
      const selectionLine = lines[2]; // Last line is selection
      expect(selectionLine).toHaveAttribute('stroke', '#3B82F6');
    });
  });

  describe('click handling', () => {
    it('calls onClick with "primary" when primary triangle is clicked', () => {
      const handleClick = vi.fn();
      render(<HstRenderer {...defaultProps} onClick={handleClick} />);
      // Primary triangle is rendered second (on top)
      const lines = screen.getAllByTestId('konva-line');
      fireEvent.click(lines[1]); // Primary triangle
      expect(handleClick).toHaveBeenCalledWith('primary');
    });

    it('calls onClick with "secondary" when secondary triangle is clicked', () => {
      const handleClick = vi.fn();
      render(<HstRenderer {...defaultProps} onClick={handleClick} />);
      // Secondary triangle is rendered first
      const lines = screen.getAllByTestId('konva-line');
      fireEvent.click(lines[0]); // Secondary triangle
      expect(handleClick).toHaveBeenCalledWith('secondary');
    });

    it('does not throw when onClick is not provided', () => {
      render(<HstRenderer {...defaultProps} />);
      const lines = screen.getAllByTestId('konva-line');
      expect(() => fireEvent.click(lines[0])).not.toThrow();
      expect(() => fireEvent.click(lines[1])).not.toThrow();
    });
  });
});
