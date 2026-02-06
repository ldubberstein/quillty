/**
 * BlockCanvas Component Tests
 *
 * Note: react-konva and ResizeObserver are mocked in vitest.setup.tsx
 * Tests verify component structure and basic rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BlockCanvas } from './BlockCanvas';

// Mock the store with all required actions
const mockAddSquare = vi.fn();
const mockAddHst = vi.fn();
const mockIsCellOccupied = vi.fn(() => false);
const mockClearSelection = vi.fn();

// Mock the useShiftKey hook
vi.mock('../../hooks', () => ({
  useShiftKey: vi.fn(() => false),
}));

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      block: {
        gridSize: 3,
        units: [],
        previewPalette: {
          roles: [
            { id: 'background', name: 'Background', color: '#FFFFFF' },
            { id: 'feature', name: 'Feature', color: '#1E3A5F' },
          ],
        },
      },
      selectedUnitId: null,
      selectedUnitType: null,
      hoveredCell: null,
      mode: 'idle',
      rangeFillAnchor: null,
      addSquare: mockAddSquare,
      addHst: mockAddHst,
      isCellOccupied: mockIsCellOccupied,
      clearSelection: mockClearSelection,
      selectUnitForPlacement: vi.fn(),
      setHoveredCell: vi.fn(),
      clearUnitSelection: vi.fn(),
      setRangeFillAnchor: vi.fn(),
      getRangeFillPositions: vi.fn(() => []),
      addUnitsBatch: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
  useSelectedUnitType: vi.fn(() => null),
  useHoveredCell: vi.fn(() => null),
  useIsPlacingUnit: vi.fn(() => false),
  useBlockRangeFillAnchor: vi.fn(() => null),
  DEFAULT_GRID_SIZE: 3,
}));

// Mock ResizeObserver to trigger callback with dimensions
let resizeCallback: ((entries: ResizeObserverEntry[]) => void) | null = null;
class MockResizeObserverWithCallback {
  constructor(callback: (entries: ResizeObserverEntry[]) => void) {
    resizeCallback = callback;
  }
  observe = vi.fn(() => {
    // Simulate a resize event with dimensions
    if (resizeCallback) {
      resizeCallback([
        {
          contentRect: { width: 800, height: 600 } as DOMRectReadOnly,
          target: document.createElement('div'),
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ]);
    }
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Override the global ResizeObserver
vi.stubGlobal('ResizeObserver', MockResizeObserverWithCallback);

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

describe('BlockCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeCallback = null;
  });

  describe('rendering', () => {
    it('renders the canvas container', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      const container = screen.getByTestId('konva-stage').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('renders the Konva Stage when dimensions are available', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('renders the Konva Layer', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument();
    });

    it('renders the ZoomControls', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
    });

    it('renders GridLines component', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      // GridLines now has multiple groups (outer group + checkerboard clip group)
      expect(screen.getAllByTestId('konva-group').length).toBeGreaterThanOrEqual(1);
    });

    it('renders click capture rect for grid interactions', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('zoom controls integration', () => {
    it('renders zoom level dropdown', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });

    it('starts at 100% zoom', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1');
    });
  });

  describe('unit rendering', () => {
    it('renders base grid elements when units array is empty', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      const rects = screen.getAllByTestId('konva-rect');
      // GridLines renders checkerboard pattern rects + border rect
      // BlockCanvas renders click capture rect + background click rect for dismiss
      // Checkerboard creates many small rects for empty cell visibility pattern
      expect(rects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('accessibility', () => {
    it('has accessible zoom controls', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });
  });

  describe('unit picker', () => {
    it('does not show unit picker by default', async () => {
      await act(async () => {
        render(<BlockCanvas />);
      });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
