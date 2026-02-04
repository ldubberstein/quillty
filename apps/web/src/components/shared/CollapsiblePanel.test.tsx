/**
 * CollapsiblePanel Tests
 *
 * Tests for the collapsible panel component that provides
 * standardized expand/collapse behavior for sidebar sections.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsiblePanel } from './CollapsiblePanel';

describe('CollapsiblePanel', () => {
  describe('rendering', () => {
    it('renders title in header', () => {
      render(
        <CollapsiblePanel title="Test Panel" isExpanded={false} onToggle={() => {}}>
          Content
        </CollapsiblePanel>
      );

      expect(screen.getByText('Test Panel')).toBeInTheDocument();
    });

    it('renders children when expanded', () => {
      render(
        <CollapsiblePanel title="Test" isExpanded={true} onToggle={() => {}}>
          <div data-testid="content">Panel Content</div>
        </CollapsiblePanel>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('does not render children when collapsed', () => {
      render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}}>
          <div data-testid="content">Panel Content</div>
        </CollapsiblePanel>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('shows ChevronDown when expanded', () => {
      render(
        <CollapsiblePanel title="Test" isExpanded={true} onToggle={() => {}}>
          Content
        </CollapsiblePanel>
      );

      // ChevronDown icon should be present (it's rendered as svg)
      const toggleButton = screen.getByRole('button');
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('shows ChevronRight when collapsed', () => {
      render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}}>
          Content
        </CollapsiblePanel>
      );

      const toggleButton = screen.getByRole('button');
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('summary', () => {
    it('shows summary when collapsed', () => {
      render(
        <CollapsiblePanel
          title="Test"
          isExpanded={false}
          onToggle={() => {}}
          summary={<span data-testid="summary">Summary Text</span>}
        >
          Content
        </CollapsiblePanel>
      );

      expect(screen.getByTestId('summary')).toBeInTheDocument();
    });

    it('hides summary when expanded', () => {
      render(
        <CollapsiblePanel
          title="Test"
          isExpanded={true}
          onToggle={() => {}}
          summary={<span data-testid="summary">Summary Text</span>}
        >
          Content
        </CollapsiblePanel>
      );

      expect(screen.queryByTestId('summary')).not.toBeInTheDocument();
    });

    it('renders string summary', () => {
      render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}} summary="5×5">
          Content
        </CollapsiblePanel>
      );

      expect(screen.getByText('5×5')).toBeInTheDocument();
    });
  });

  describe('headerActions', () => {
    it('shows header actions when expanded', () => {
      render(
        <CollapsiblePanel
          title="Test"
          isExpanded={true}
          onToggle={() => {}}
          headerActions={<button data-testid="action">Action</button>}
        >
          Content
        </CollapsiblePanel>
      );

      expect(screen.getByTestId('action')).toBeInTheDocument();
    });

    it('hides header actions when collapsed', () => {
      render(
        <CollapsiblePanel
          title="Test"
          isExpanded={false}
          onToggle={() => {}}
          headerActions={<button data-testid="action">Action</button>}
        >
          Content
        </CollapsiblePanel>
      );

      expect(screen.queryByTestId('action')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('calls onToggle when header button is clicked', () => {
      const handleToggle = vi.fn();
      render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={handleToggle}>
          Content
        </CollapsiblePanel>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('shows border by default', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}}>
          Content
        </CollapsiblePanel>
      );

      expect(container.firstChild).toHaveClass('border-t');
    });

    it('hides border when showBorder is false', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}} showBorder={false}>
          Content
        </CollapsiblePanel>
      );

      expect(container.firstChild).not.toHaveClass('border-t');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CollapsiblePanel title="Test" isExpanded={false} onToggle={() => {}} className="custom-class">
          Content
        </CollapsiblePanel>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
