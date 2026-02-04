/**
 * PreviewControls Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewControls } from './PreviewControls';

// Mock state
let mockIsPreviewMode = false;
let mockCurrentPreset = 'all_same';
const mockEnterPreview = vi.fn();
const mockExitPreview = vi.fn();
const mockSetPreviewRotationPreset = vi.fn();

// Mock the store
vi.mock('@quillty/core', () => ({
  useBlockDesignerStore: vi.fn((selector) => {
    const state = {
      enterPreview: mockEnterPreview,
      exitPreview: mockExitPreview,
      setPreviewRotationPreset: mockSetPreviewRotationPreset,
    };
    return selector ? selector(state) : state;
  }),
  useIsPreviewMode: vi.fn(() => mockIsPreviewMode),
  usePreviewRotationPreset: vi.fn(() => mockCurrentPreset),
}));

describe('PreviewControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPreviewMode = false;
    mockCurrentPreset = 'all_same';
  });

  describe('when not in preview mode', () => {
    it('renders the preview button', () => {
      render(<PreviewControls />);
      expect(screen.getByLabelText('Enter preview mode')).toBeInTheDocument();
    });

    it('shows Eye icon when not in preview mode', () => {
      render(<PreviewControls />);
      const button = screen.getByLabelText('Enter preview mode');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('calls enterPreview when clicked', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Enter preview mode'));
      expect(mockEnterPreview).toHaveBeenCalledTimes(1);
    });

    it('does not show the dropdown button', () => {
      render(<PreviewControls />);
      expect(screen.queryByLabelText('Select rotation preset')).not.toBeInTheDocument();
    });

    it('has rounded corners on both sides', () => {
      render(<PreviewControls />);
      const button = screen.getByLabelText('Enter preview mode');
      expect(button.className).toContain('rounded-lg');
    });
  });

  describe('when in preview mode', () => {
    beforeEach(() => {
      mockIsPreviewMode = true;
    });

    it('renders the exit preview button', () => {
      render(<PreviewControls />);
      expect(screen.getByLabelText('Exit preview mode')).toBeInTheDocument();
    });

    it('shows EyeOff icon when in preview mode', () => {
      render(<PreviewControls />);
      const button = screen.getByLabelText('Exit preview mode');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('calls exitPreview when preview button clicked', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Exit preview mode'));
      expect(mockExitPreview).toHaveBeenCalledTimes(1);
    });

    it('shows the dropdown button with current preset', () => {
      render(<PreviewControls />);
      expect(screen.getByLabelText('Select rotation preset')).toBeInTheDocument();
      expect(screen.getByText('All Same')).toBeInTheDocument();
    });

    it('opens dropdown when dropdown button clicked', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Select rotation preset'));

      // Check all presets are visible
      expect(screen.getByText('Alternating')).toBeInTheDocument();
      expect(screen.getByText('Pinwheel')).toBeInTheDocument();
      expect(screen.getByText('Random')).toBeInTheDocument();
    });

    it('shows preset descriptions in dropdown', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Select rotation preset'));

      expect(screen.getByText('All blocks at 0°')).toBeInTheDocument();
      expect(screen.getByText('Checkerboard 0°/90°')).toBeInTheDocument();
    });

    it('calls setPreviewRotationPreset when preset selected', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Select rotation preset'));

      // Click on Pinwheel option
      const pinwheelButton = screen.getByText('Pinwheel').closest('button');
      fireEvent.click(pinwheelButton!);

      expect(mockSetPreviewRotationPreset).toHaveBeenCalledWith('pinwheel');
    });

    it('closes dropdown after selecting preset', () => {
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Select rotation preset'));

      // Click on Alternating option
      const alternatingButton = screen.getByText('Alternating').closest('button');
      fireEvent.click(alternatingButton!);

      // Dropdown should close - descriptions should no longer be visible
      expect(screen.queryByText('Checkerboard 0°/90°')).not.toBeInTheDocument();
    });

    it('highlights current preset in dropdown', () => {
      // Current preset is 'all_same' by default from mock
      render(<PreviewControls />);
      fireEvent.click(screen.getByLabelText('Select rotation preset'));

      // Find the All Same option in the dropdown (there are two - one in the toggle, one in the dropdown)
      // The dropdown option has a description underneath it
      const allSameDescription = screen.getByText('All blocks at 0°');
      const allSameButton = allSameDescription.closest('button');
      expect(allSameButton?.className).toContain('text-purple-600');
    });

    it('has purple styling when active', () => {
      render(<PreviewControls />);
      const buttonGroup = screen.getByLabelText('Exit preview mode').parentElement;
      expect(buttonGroup?.className).toContain('bg-purple-600');
    });
  });

  describe('dropdown behavior', () => {
    beforeEach(() => {
      mockIsPreviewMode = true;
    });

    it('closes dropdown when clicking outside', () => {
      render(
        <div>
          <PreviewControls />
          <div data-testid="outside">Outside</div>
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByLabelText('Select rotation preset'));
      expect(screen.getByText('Checkerboard 0°/90°')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('Checkerboard 0°/90°')).not.toBeInTheDocument();
    });

    it('has aria-expanded attribute on dropdown button', () => {
      render(<PreviewControls />);
      const dropdownButton = screen.getByLabelText('Select rotation preset');

      // Initially not expanded
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');

      // Open dropdown
      fireEvent.click(dropdownButton);
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
