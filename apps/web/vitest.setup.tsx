import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/dynamic for SSR-disabled components
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a simple component that renders the dynamically loaded component
    const DynamicComponent = (props: Record<string, unknown>) => {
      const Component = vi.fn(() => null);
      return Component(props);
    };
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

// Mock react-konva since it requires browser canvas
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-layer">{children}</div>
  ),
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-group">{children}</div>
  ),
  Rect: (props: Record<string, unknown>) => <div data-testid="konva-rect" {...props} />,
  Line: (props: Record<string, unknown>) => <div data-testid="konva-line" {...props} />,
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);
