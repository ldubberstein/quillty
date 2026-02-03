/**
 * FloatingToolbar Component Tests
 *
 * Tests for the floating toolbar that appears above selected shapes.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingToolbar } from './FloatingToolbar';

describe('FloatingToolbar', () => {
  const defaultProps = {
    position: { x: 200, y: 200 },
    canRotate: true,
    canFlip: true,
    onRotate: vi.fn(),
    onFlipHorizontal: vi.fn(),
    onFlipVertical: vi.fn(),
    onDelete: vi.fn(),
    onDismiss: vi.fn(),
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<FloatingToolbar {...defaultProps} />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(<FloatingToolbar {...defaultProps} />);
      expect(screen.getByLabelText('Shape tools')).toBeInTheDocument();
    });
  });

  describe('button visibility', () => {
    it('shows rotate button when canRotate is true', () => {
      render(<FloatingToolbar {...defaultProps} canRotate={true} />);
      expect(screen.getByLabelText('Rotate 90 degrees')).toBeInTheDocument();
    });

    it('hides rotate button when canRotate is false', () => {
      render(<FloatingToolbar {...defaultProps} canRotate={false} />);
      expect(screen.queryByLabelText('Rotate 90 degrees')).not.toBeInTheDocument();
    });

    it('shows flip buttons when canFlip is true', () => {
      render(<FloatingToolbar {...defaultProps} canFlip={true} />);
      expect(screen.getByLabelText('Flip horizontal')).toBeInTheDocument();
      expect(screen.getByLabelText('Flip vertical')).toBeInTheDocument();
    });

    it('hides flip buttons when canFlip is false', () => {
      render(<FloatingToolbar {...defaultProps} canFlip={false} />);
      expect(screen.queryByLabelText('Flip horizontal')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Flip vertical')).not.toBeInTheDocument();
    });

    it('always shows delete button', () => {
      render(<FloatingToolbar {...defaultProps} canRotate={false} canFlip={false} />);
      expect(screen.getByLabelText('Delete shape')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onRotate when rotate button is clicked', () => {
      const onRotate = vi.fn();
      render(<FloatingToolbar {...defaultProps} onRotate={onRotate} />);

      fireEvent.click(screen.getByLabelText('Rotate 90 degrees'));

      expect(onRotate).toHaveBeenCalledTimes(1);
    });

    it('calls onFlipHorizontal when flip horizontal button is clicked', () => {
      const onFlipHorizontal = vi.fn();
      render(<FloatingToolbar {...defaultProps} onFlipHorizontal={onFlipHorizontal} />);

      fireEvent.click(screen.getByLabelText('Flip horizontal'));

      expect(onFlipHorizontal).toHaveBeenCalledTimes(1);
    });

    it('calls onFlipVertical when flip vertical button is clicked', () => {
      const onFlipVertical = vi.fn();
      render(<FloatingToolbar {...defaultProps} onFlipVertical={onFlipVertical} />);

      fireEvent.click(screen.getByLabelText('Flip vertical'));

      expect(onFlipVertical).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(<FloatingToolbar {...defaultProps} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete shape'));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('positioning', () => {
    it('positions toolbar at specified coordinates', () => {
      render(<FloatingToolbar {...defaultProps} position={{ x: 300, y: 150 }} />);
      const toolbar = screen.getByRole('toolbar');

      // Check that left and top are set (position is via Tailwind class 'absolute')
      expect(toolbar.style.left).toBe('300px');
      expect(toolbar.style.top).toBe('150px');
    });

    it('constrains toolbar within viewport bounds', () => {
      // Position near left edge - should be constrained
      render(<FloatingToolbar {...defaultProps} position={{ x: 10, y: 200 }} />);
      const toolbar = screen.getByRole('toolbar');

      // The component adjusts x to at least 80
      expect(toolbar.style.left).toBe('80px');
    });
  });

  describe('divider visibility', () => {
    it('shows divider when canRotate or canFlip is true', () => {
      const { container } = render(<FloatingToolbar {...defaultProps} canRotate={true} canFlip={false} />);
      const divider = container.querySelector('.bg-gray-200');
      expect(divider).toBeInTheDocument();
    });

    it('hides divider when both canRotate and canFlip are false', () => {
      const { container } = render(<FloatingToolbar {...defaultProps} canRotate={false} canFlip={false} />);
      const divider = container.querySelector('.w-px.bg-gray-200');
      expect(divider).not.toBeInTheDocument();
    });
  });
});
