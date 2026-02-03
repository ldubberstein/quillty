import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UndoRedoControls } from './UndoRedoControls';

// Mock the hooks
const mockUndo = vi.fn();
const mockRedo = vi.fn();
let mockCanUndo = true;
let mockCanRedo = true;

vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      undo: mockUndo,
      redo: mockRedo,
    };
    return selector(state);
  }),
  useCanUndo: vi.fn(() => mockCanUndo),
  useCanRedo: vi.fn(() => mockCanRedo),
}));

vi.mock('@/hooks/useUndoRedoKeyboard', () => ({
  useUndoRedoKeyboard: vi.fn(),
}));

describe('UndoRedoControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanUndo = true;
    mockCanRedo = true;
  });

  it('renders undo and redo buttons', () => {
    render(<UndoRedoControls />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('calls undo when undo button is clicked', () => {
    render(<UndoRedoControls />);

    fireEvent.click(screen.getByRole('button', { name: /undo/i }));

    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it('calls redo when redo button is clicked', () => {
    render(<UndoRedoControls />);

    fireEvent.click(screen.getByRole('button', { name: /redo/i }));

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('disables undo button when canUndo is false', () => {
    mockCanUndo = false;
    render(<UndoRedoControls />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    mockCanRedo = false;
    render(<UndoRedoControls />);

    expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled();
  });

  it('enables undo button when canUndo is true', () => {
    mockCanUndo = true;
    render(<UndoRedoControls />);

    expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled();
  });

  it('enables redo button when canRedo is true', () => {
    mockCanRedo = true;
    render(<UndoRedoControls />);

    expect(screen.getByRole('button', { name: /redo/i })).not.toBeDisabled();
  });
});
