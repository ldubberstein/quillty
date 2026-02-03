/**
 * BlockCanvas Component Tests
 *
 * Note: react-konva and ResizeObserver are mocked in vitest.setup.ts
 * Tests verify component structure and basic rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockCanvas } from './BlockCanvas';

// Mock the store
vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      block: {
        gridSize: 3,
        shapes: [],
        previewPalette: {
          roles: [
            { id: 'background', color: '#FFFFFF' },
            { id: 'feature', color: '#1E3A5F' },
          ],
        },
      },
      selectedShapeId: null,
      clearSelection: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
  DEFAULT_GRID_SIZE: 3,
}));

describe('BlockCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the canvas container', () => {
      render(<BlockCanvas />);
      // The container should have the expected classes
      const container = screen.getByTestId('konva-stage').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('renders the Konva Stage', () => {
      render(<BlockCanvas />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('renders the Konva Layer', () => {
      render(<BlockCanvas />);
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument();
    });

    it('renders the ZoomControls', () => {
      render(<BlockCanvas />);
      // ZoomControls should render zoom buttons
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
    });
  });

  describe('zoom controls integration', () => {
    it('renders zoom level dropdown', () => {
      render(<BlockCanvas />);
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });

    it('starts at 100% zoom', () => {
      render(<BlockCanvas />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1');
    });
  });

  describe('accessibility', () => {
    it('has accessible zoom controls', () => {
      render(<BlockCanvas />);
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });
  });
});
