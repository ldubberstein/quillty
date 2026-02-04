/**
 * ColorSwatch Tests
 *
 * Tests for the reusable color swatch component that displays
 * a colored button with optional color picker functionality.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorSwatch } from './ColorSwatch';

describe('ColorSwatch', () => {
  describe('rendering', () => {
    it('renders with the specified color', () => {
      render(<ColorSwatch color="#FF5733" aria-label="Test swatch" />);

      const button = screen.getByRole('button', { name: 'Test swatch' });
      expect(button).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('renders with small size by default becoming medium', () => {
      render(<ColorSwatch color="#000000" aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8'); // md is default
    });

    it('renders with small size', () => {
      render(<ColorSwatch color="#000000" size="sm" aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-4', 'h-4');
    });

    it('renders with large size', () => {
      render(<ColorSwatch color="#000000" size="lg" aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');
    });

    it('applies selected styling when selected', () => {
      render(<ColorSwatch color="#000000" selected aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('does not apply selected styling when not selected', () => {
      render(<ColorSwatch color="#000000" selected={false} aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('ring-2');
    });

    it('applies custom className', () => {
      render(<ColorSwatch color="#000000" className="custom-class" aria-label="Test" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<ColorSwatch color="#000000" onClick={handleClick} aria-label="Test" />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('passes event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<ColorSwatch color="#000000" onClick={handleClick} aria-label="Test" />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('color picker functionality', () => {
    it('shows hidden color input when onChange is provided and clicked', () => {
      const handleChange = vi.fn();
      render(<ColorSwatch color="#000000" onChange={handleChange} aria-label="Test" />);

      // Click to open picker
      fireEvent.click(screen.getByRole('button'));

      // Color input should be present
      const colorInput = screen.getByDisplayValue('#000000');
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveAttribute('type', 'color');
    });

    it('calls onChange when color is changed', () => {
      const handleChange = vi.fn();
      render(<ColorSwatch color="#000000" onChange={handleChange} aria-label="Test" />);

      // Click to open picker
      fireEvent.click(screen.getByRole('button'));

      // Change the color (browsers normalize hex to lowercase)
      const colorInput = screen.getByDisplayValue('#000000');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(handleChange).toHaveBeenCalledWith('#ff0000');
    });

    it('hides color input on blur', () => {
      const handleChange = vi.fn();
      render(<ColorSwatch color="#000000" onChange={handleChange} aria-label="Test" />);

      // Click to open picker
      fireEvent.click(screen.getByRole('button'));

      // Color input should be present
      const colorInput = screen.getByDisplayValue('#000000');
      expect(colorInput).toBeInTheDocument();

      // Blur the input
      fireEvent.blur(colorInput);

      // Color input should be removed
      expect(screen.queryByDisplayValue('#000000')).not.toBeInTheDocument();
    });

    it('does not show color input when no onChange provided', () => {
      render(<ColorSwatch color="#000000" aria-label="Test" />);

      // Click should not open picker
      fireEvent.click(screen.getByRole('button'));

      // No color input should be present
      expect(screen.queryByDisplayValue('#000000')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-label', () => {
      render(<ColorSwatch color="#000000" aria-label="Primary color" />);

      expect(screen.getByRole('button', { name: 'Primary color' })).toBeInTheDocument();
    });

    it('is focusable', () => {
      render(<ColorSwatch color="#000000" aria-label="Test" />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
