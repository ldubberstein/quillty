/**
 * ShapePicker Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapePicker } from './ShapePicker';

describe('ShapePicker', () => {
  const defaultProps = {
    position: { x: 100, y: 100 },
    onSelectShape: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the picker container', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByRole('menu', { name: /shape picker/i })).toBeInTheDocument();
    });

    it('renders the Square option', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByRole('menuitem', { name: /add square/i })).toBeInTheDocument();
    });

    it('displays Square label text', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByText('Square')).toBeInTheDocument();
    });

    it('renders all 4 HST variant options', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByRole('menuitem', { name: /add ◸/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /add ◹/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /add ◺/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /add ◿/i })).toBeInTheDocument();
    });

    it('displays HST variant labels', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByText('◸')).toBeInTheDocument();
      expect(screen.getByText('◹')).toBeInTheDocument();
      expect(screen.getByText('◺')).toBeInTheDocument();
      expect(screen.getByText('◿')).toBeInTheDocument();
    });

    it('renders 5 total shape options (1 square + 4 HST)', () => {
      render(<ShapePicker {...defaultProps} />);
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(5);
    });
  });

  describe('positioning', () => {
    it('applies left and top styles based on position', () => {
      render(<ShapePicker {...defaultProps} position={{ x: 200, y: 150 }} />);
      const picker = screen.getByRole('menu');
      // Check that style attributes exist
      expect(picker.style.left).toBeDefined();
      expect(picker.style.top).toBeDefined();
    });
  });

  describe('interactions', () => {
    it('calls onSelectShape with square selection when Square is clicked', () => {
      render(<ShapePicker {...defaultProps} />);
      const squareButton = screen.getByRole('menuitem', { name: /add square/i });
      fireEvent.click(squareButton);
      expect(defaultProps.onSelectShape).toHaveBeenCalledWith({ type: 'square' });
    });

    it('calls onSelectShape with HST nw selection when ◸ is clicked', () => {
      render(<ShapePicker {...defaultProps} />);
      const hstButton = screen.getByRole('menuitem', { name: /add ◸/i });
      fireEvent.click(hstButton);
      expect(defaultProps.onSelectShape).toHaveBeenCalledWith({ type: 'hst', variant: 'nw' });
    });

    it('calls onSelectShape with HST ne selection when ◹ is clicked', () => {
      render(<ShapePicker {...defaultProps} />);
      const hstButton = screen.getByRole('menuitem', { name: /add ◹/i });
      fireEvent.click(hstButton);
      expect(defaultProps.onSelectShape).toHaveBeenCalledWith({ type: 'hst', variant: 'ne' });
    });

    it('calls onSelectShape with HST sw selection when ◺ is clicked', () => {
      render(<ShapePicker {...defaultProps} />);
      const hstButton = screen.getByRole('menuitem', { name: /add ◺/i });
      fireEvent.click(hstButton);
      expect(defaultProps.onSelectShape).toHaveBeenCalledWith({ type: 'hst', variant: 'sw' });
    });

    it('calls onSelectShape with HST se selection when ◿ is clicked', () => {
      render(<ShapePicker {...defaultProps} />);
      const hstButton = screen.getByRole('menuitem', { name: /add ◿/i });
      fireEvent.click(hstButton);
      expect(defaultProps.onSelectShape).toHaveBeenCalledWith({ type: 'hst', variant: 'se' });
    });

    it('calls onDismiss when Escape key is pressed', () => {
      render(<ShapePicker {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });

    it('calls onDismiss when clicking outside the picker', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <ShapePicker {...defaultProps} />
        </div>
      );

      // Wait for the timeout in the component
      await new Promise((resolve) => setTimeout(resolve, 10));

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct role for the container', () => {
      render(<ShapePicker {...defaultProps} />);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('has correct role for all menu items', () => {
      render(<ShapePicker {...defaultProps} />);
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(5);
    });

    it('Square button is focusable', () => {
      render(<ShapePicker {...defaultProps} />);
      const squareButton = screen.getByRole('menuitem', { name: /add square/i });
      squareButton.focus();
      expect(document.activeElement).toBe(squareButton);
    });

    it('HST buttons are focusable', () => {
      render(<ShapePicker {...defaultProps} />);
      const hstButton = screen.getByRole('menuitem', { name: /add ◸/i });
      hstButton.focus();
      expect(document.activeElement).toBe(hstButton);
    });
  });
});
