/**
 * BlockDesignerPage Tests
 *
 * Note: The BlockCanvas is dynamically imported with SSR disabled,
 * so tests focus on the page structure and static elements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock the keyboard hook
vi.mock('@/hooks/useUndoRedoKeyboard', () => ({
  useUndoRedoKeyboard: vi.fn(),
}));

// Mock the API hooks
vi.mock('@quillty/api', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
  })),
  useCreateBlock: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateBlock: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  usePublishBlock: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Store state that can be modified between renders
let mockShapes: unknown[] = [];
let mockTitle = '';
const mockInitBlock = vi.fn();

// Mock the store before importing the component
vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      block: {
        id: 'test-block',
        gridSize: 3,
        shapes: mockShapes,
        title: mockTitle,
        previewPalette: {
          roles: [
            { id: 'background', color: '#FFFFFF' },
            { id: 'feature', color: '#1E3A5F' },
          ],
        },
      },
      initBlock: mockInitBlock,
      mode: 'idle',
      selectedShapeType: null,
      hoveredCell: null,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn(() => false),
      canRedo: vi.fn(() => false),
      enterPreview: vi.fn(),
      exitPreview: vi.fn(),
      setPreviewRotationPreset: vi.fn(),
      selectShapeForPlacement: vi.fn(),
      setHoveredCell: vi.fn(),
      clearShapeSelection: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
  useCanUndo: vi.fn(() => false),
  useCanRedo: vi.fn(() => false),
  useIsPreviewMode: vi.fn(() => false),
  usePreviewRotationPreset: vi.fn(() => 'all_same'),
  useSelectedShapeType: vi.fn(() => null),
  useHoveredCell: vi.fn(() => null),
  useIsPlacingShape: vi.fn(() => false),
  DEFAULT_GRID_SIZE: 3,
  serializeBlockForDb: vi.fn(() => ({
    name: 'Test Block',
    gridSize: 3,
    designData: {},
    pieceCount: 0,
  })),
  validateBlockForPublish: vi.fn(() => ({ valid: false, error: 'Add at least one shape' })),
}));

// Import component after mocks
import BlockDesignerPage from './page';

describe('BlockDesignerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShapes = [];
    mockTitle = '';
  });

  describe('header', () => {
    it('renders the page title', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByRole('heading', { name: /block designer/i })).toBeInTheDocument();
    });

    it('renders back to home link', () => {
      render(<BlockDesignerPage />);
      // Link has aria-label="Back to home"
      const backLink = screen.getByLabelText(/back to home/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('renders grid size indicator', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByText(/3×3 grid/i)).toBeInTheDocument();
    });

    it('renders sign-in link when not authenticated', () => {
      render(<BlockDesignerPage />);
      const signInLink = screen.getByRole('link', { name: /sign in to save/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('footer', () => {
    it('renders usage hint text', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByText(/select a shape from the left panel/i)).toBeInTheDocument();
    });

    it('renders zoom hint', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByText(/scroll to zoom/i)).toBeInTheDocument();
    });

    it('renders pan hint', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByText(/drag to pan/i)).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders main content area', () => {
      render(<BlockDesignerPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('renders header element', () => {
      render(<BlockDesignerPage />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('renders footer element', () => {
      render(<BlockDesignerPage />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('initialization', () => {
    it('calls initBlock on mount when block is empty', () => {
      mockShapes = [];
      mockTitle = '';

      render(<BlockDesignerPage />);

      expect(mockInitBlock).toHaveBeenCalledTimes(1);
    });

    it('does not call initBlock when block already has shapes', () => {
      mockShapes = [{ id: 'shape-1', type: 'square' }];
      mockTitle = '';

      render(<BlockDesignerPage />);

      expect(mockInitBlock).not.toHaveBeenCalled();
    });

    it('does not call initBlock when block has a title', () => {
      mockShapes = [];
      mockTitle = 'My Block';

      render(<BlockDesignerPage />);

      expect(mockInitBlock).not.toHaveBeenCalled();
    });

    it('does not re-initialize when shapes.length changes from non-zero to zero', () => {
      // Start with shapes
      mockShapes = [{ id: 'shape-1', type: 'square' }];
      mockTitle = '';

      const { rerender } = render(<BlockDesignerPage />);

      // initBlock should NOT be called (block has shapes)
      expect(mockInitBlock).not.toHaveBeenCalled();

      // Simulate undo removing all shapes
      mockShapes = [];

      rerender(<BlockDesignerPage />);

      // initBlock should still NOT be called (already initialized)
      expect(mockInitBlock).not.toHaveBeenCalled();
    });
  });
});
