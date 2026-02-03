/**
 * BlockDesignerPage Tests
 *
 * Note: The BlockCanvas is dynamically imported with SSR disabled,
 * so tests focus on the page structure and static elements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the keyboard hook
vi.mock('@/hooks/useUndoRedoKeyboard', () => ({
  useUndoRedoKeyboard: vi.fn(),
}));

// Mock the store before importing the component
vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      block: {
        id: 'test-block',
        gridSize: 3,
        shapes: [],
        title: '',
        previewPalette: {
          roles: [
            { id: 'background', color: '#FFFFFF' },
            { id: 'feature', color: '#1E3A5F' },
          ],
        },
      },
      initBlock: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn(() => false),
      canRedo: vi.fn(() => false),
    };
    return selector ? selector(state) : state;
  }),
  useCanUndo: vi.fn(() => false),
  useCanRedo: vi.fn(() => false),
  DEFAULT_GRID_SIZE: 3,
}));

// Import component after mocks
import BlockDesignerPage from './page';

describe('BlockDesignerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('renders Save Draft button (disabled)', () => {
      render(<BlockDesignerPage />);
      const saveButton = screen.getByRole('button', { name: /save draft/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('renders Publish button (disabled)', () => {
      render(<BlockDesignerPage />);
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeInTheDocument();
      expect(publishButton).toBeDisabled();
    });
  });

  describe('footer', () => {
    it('renders usage hint text', () => {
      render(<BlockDesignerPage />);
      expect(screen.getByText(/tap a cell to add a shape/i)).toBeInTheDocument();
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
});
