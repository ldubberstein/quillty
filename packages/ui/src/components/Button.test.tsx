import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { Button } from './Button';

// Mock React Native components
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('Button', () => {
  it('renders with text content', () => {
    const tree = renderer.create(<Button>Click me</Button>).toJSON();

    expect(tree).toMatchSnapshot();
    // Verify the button renders
    expect(tree).toBeTruthy();
  });

  it('renders with primary variant by default', () => {
    const tree = renderer.create(<Button>Primary</Button>).toJSON();

    // Check that primary classes are applied
    expect(JSON.stringify(tree)).toContain('bg-brand');
  });

  it('renders with secondary variant', () => {
    const tree = renderer.create(<Button variant="secondary">Secondary</Button>).toJSON();

    expect(JSON.stringify(tree)).toContain('bg-white');
    expect(JSON.stringify(tree)).toContain('border-gray-200');
  });

  it('renders with ghost variant', () => {
    const tree = renderer.create(<Button variant="ghost">Ghost</Button>).toJSON();

    expect(JSON.stringify(tree)).toContain('bg-transparent');
  });

  it('applies size classes correctly', () => {
    const smTree = renderer.create(<Button size="sm">Small</Button>).toJSON();
    const mdTree = renderer.create(<Button size="md">Medium</Button>).toJSON();
    const lgTree = renderer.create(<Button size="lg">Large</Button>).toJSON();

    expect(JSON.stringify(smTree)).toContain('min-h-[36px]');
    expect(JSON.stringify(mdTree)).toContain('min-h-[44px]');
    expect(JSON.stringify(lgTree)).toContain('min-h-[52px]');
  });

  it('forwards onPress callback', () => {
    const onPress = vi.fn();
    const tree = renderer.create(<Button onPress={onPress}>Press me</Button>);

    // Get the Pressable component
    const pressable = tree.root.findByType('Pressable' as never);
    expect(pressable.props.onPress).toBe(onPress);
  });

  it('applies disabled prop', () => {
    const tree = renderer.create(<Button disabled>Disabled</Button>);

    const pressable = tree.root.findByType('Pressable' as never);
    expect(pressable.props.disabled).toBe(true);
  });

  it('applies custom className', () => {
    const tree = renderer.create(
      <Button className="custom-class">Custom</Button>
    ).toJSON();

    expect(JSON.stringify(tree)).toContain('custom-class');
  });
});
