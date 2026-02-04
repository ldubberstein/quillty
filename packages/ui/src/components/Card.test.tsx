import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { Card } from './Card';

// Mock React Native components
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('Card', () => {
  it('renders children correctly', () => {
    const tree = renderer
      .create(
        <Card>
          <span>Card content</span>
        </Card>
      )
      .toJSON();

    expect(tree).toBeTruthy();
    expect(JSON.stringify(tree)).toContain('Card content');
  });

  it('applies default styling', () => {
    const tree = renderer
      .create(
        <Card>
          <span>Content</span>
        </Card>
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('rounded-2xl');
    expect(JSON.stringify(tree)).toContain('border-gray-100');
    expect(JSON.stringify(tree)).toContain('bg-white');
  });

  it('merges custom className with default styles', () => {
    const tree = renderer
      .create(
        <Card className="custom-class">
          <span>Content</span>
        </Card>
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('custom-class');
    expect(JSON.stringify(tree)).toContain('rounded-2xl');
  });

  it('forwards additional props to View', () => {
    const tree = renderer.create(
      <Card testID="test-card">
        <span>Content</span>
      </Card>
    );

    const view = tree.root.findByType('View' as never);
    expect(view.props.testID).toBe('test-card');
  });

  it('renders with multiple children', () => {
    const tree = renderer
      .create(
        <Card>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Card>
      )
      .toJSON();

    expect(tree).toBeTruthy();
    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('First');
    expect(jsonStr).toContain('Second');
    expect(jsonStr).toContain('Third');
  });
});
