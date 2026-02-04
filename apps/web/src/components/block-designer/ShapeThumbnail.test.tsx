import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeThumbnail, SHAPE_OPTIONS, type ShapeOption } from './ShapeThumbnail';

describe('ShapeThumbnail', () => {
  const mockOnClick = vi.fn();

  const defaultOption: ShapeOption = {
    id: 'square',
    label: 'Square',
    selection: { type: 'square' },
    icon: <svg data-testid="shape-icon" />,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the shape label', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Square')).toBeInTheDocument();
    });

    it('renders the shape icon', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByTestId('shape-icon')).toBeInTheDocument();
    });

    it('renders as a button with accessible label', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button', { name: /select square/i })).toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('shows aria-pressed=false when not selected', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows aria-pressed=true when selected', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={true}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('applies selected styling when isSelected is true', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-50');
      expect(button).toHaveClass('ring-2');
      expect(button).toHaveClass('ring-blue-500');
    });

    it('applies default styling when isSelected is false', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-50');
      expect(button).not.toHaveClass('ring-2');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('wide shapes', () => {
    const wideOption: ShapeOption = {
      id: 'flying-geese',
      label: 'Geese',
      selection: { type: 'flying_geese' },
      wide: true,
      icon: <svg data-testid="wide-icon" />,
    };

    it('applies col-span-2 class for wide shapes', () => {
      render(
        <ShapeThumbnail
          option={wideOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('col-span-2');
    });

    it('does not apply col-span-2 for non-wide shapes', () => {
      render(
        <ShapeThumbnail
          option={defaultOption}
          isSelected={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('col-span-2');
    });
  });
});

describe('SHAPE_OPTIONS', () => {
  it('contains all expected shape types', () => {
    const shapeIds = SHAPE_OPTIONS.map((opt) => opt.id);

    expect(shapeIds).toContain('square');
    expect(shapeIds).toContain('hst-nw');
    expect(shapeIds).toContain('hst-ne');
    expect(shapeIds).toContain('hst-sw');
    expect(shapeIds).toContain('hst-se');
    expect(shapeIds).toContain('flying-geese');
  });

  it('has 6 total shape options', () => {
    expect(SHAPE_OPTIONS).toHaveLength(6);
  });

  it('marks flying-geese as wide', () => {
    const flyingGeese = SHAPE_OPTIONS.find((opt) => opt.id === 'flying-geese');
    expect(flyingGeese?.wide).toBe(true);
  });

  it('does not mark other shapes as wide', () => {
    const nonWideShapes = SHAPE_OPTIONS.filter((opt) => opt.id !== 'flying-geese');
    nonWideShapes.forEach((shape) => {
      expect(shape.wide).toBeFalsy();
    });
  });

  it('each shape has a unique id', () => {
    const ids = SHAPE_OPTIONS.map((opt) => opt.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('each shape has a label', () => {
    SHAPE_OPTIONS.forEach((option) => {
      expect(option.label).toBeTruthy();
    });
  });

  it('each shape has a valid selection type', () => {
    SHAPE_OPTIONS.forEach((option) => {
      expect(option.selection).toBeDefined();
      expect(['square', 'hst', 'flying_geese']).toContain(option.selection.type);
    });
  });
});
