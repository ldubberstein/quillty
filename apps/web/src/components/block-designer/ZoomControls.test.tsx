/**
 * ZoomControls Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from './ZoomControls';

describe('ZoomControls', () => {
  const defaultProps = {
    scale: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomFit: vi.fn(),
    onZoomChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders zoom out button', () => {
      render(<ZoomControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    });

    it('renders zoom in button', () => {
      render(<ZoomControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    });

    it('renders fit button', () => {
      render(<ZoomControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
    });

    it('renders zoom level dropdown', () => {
      render(<ZoomControls {...defaultProps} />);
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });

    it('displays current zoom percentage in dropdown', () => {
      render(<ZoomControls {...defaultProps} scale={1.5} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1.5');
    });
  });

  describe('button interactions', () => {
    it('calls onZoomIn when zoom in button clicked', () => {
      render(<ZoomControls {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
      expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('calls onZoomOut when zoom out button clicked', () => {
      render(<ZoomControls {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
      expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('calls onZoomFit when fit button clicked', () => {
      render(<ZoomControls {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /fit to screen/i }));
      expect(defaultProps.onZoomFit).toHaveBeenCalledTimes(1);
    });
  });

  describe('dropdown interactions', () => {
    it('calls onZoomChange when dropdown value changes', () => {
      render(<ZoomControls {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '0.5' } });
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(0.5);
    });

    it('shows preset zoom levels', () => {
      render(<ZoomControls {...defaultProps} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      // Default presets within default min/max: 0.25, 0.5, 0.75, 1, 1.5, 2, 3
      expect(options.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('disabled states', () => {
    it('disables zoom out button at minimum scale', () => {
      render(<ZoomControls {...defaultProps} scale={0.25} minScale={0.25} />);
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled();
    });

    it('disables zoom in button at maximum scale', () => {
      render(<ZoomControls {...defaultProps} scale={3} maxScale={3} />);
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled();
    });

    it('enables zoom out button above minimum scale', () => {
      render(<ZoomControls {...defaultProps} scale={0.5} minScale={0.25} />);
      expect(screen.getByRole('button', { name: /zoom out/i })).not.toBeDisabled();
    });

    it('enables zoom in button below maximum scale', () => {
      render(<ZoomControls {...defaultProps} scale={2} maxScale={3} />);
      expect(screen.getByRole('button', { name: /zoom in/i })).not.toBeDisabled();
    });
  });

  describe('custom min/max scale', () => {
    it('filters presets based on minScale', () => {
      render(<ZoomControls {...defaultProps} minScale={0.75} />);
      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      const values = options.map((opt) => parseFloat(opt.value));

      // Should not include values below 0.75
      expect(values.every((v) => v >= 0.75)).toBe(true);
    });

    it('filters presets based on maxScale', () => {
      render(<ZoomControls {...defaultProps} maxScale={1.5} />);
      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      const values = options.map((opt) => parseFloat(opt.value));

      // Should not include values above 1.5
      expect(values.every((v) => v <= 1.5)).toBe(true);
    });

    it('shows current scale even if not a preset', () => {
      render(<ZoomControls {...defaultProps} scale={1.33} />);
      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      const values = options.map((opt) => opt.value);

      expect(values).toContain('1.33');
    });
  });
});
