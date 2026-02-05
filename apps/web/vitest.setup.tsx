import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/dynamic for SSR-disabled components
vi.mock('next/dynamic', () => ({
  default: () => {
    // Return a simple component that renders nothing (mocked dynamic component)
    const DynamicComponent = () => null;
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
  Group: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <div data-testid="konva-group" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  Rect: ({
    onClick,
    onTap,
    ...props
  }: {
    onClick?: (e: { evt: MouseEvent }) => void;
    onTap?: (e: { evt: TouchEvent }) => void;
    [key: string]: unknown;
  }) => (
    <div
      data-testid="konva-rect"
      onClick={(e) => {
        // Wrap DOM event in Konva-like event structure
        if (onClick) onClick({ evt: e.nativeEvent as MouseEvent });
      }}
      {...props}
    />
  ),
  Line: (props: Record<string, unknown>) => <div data-testid="konva-line" {...props} />,
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);
