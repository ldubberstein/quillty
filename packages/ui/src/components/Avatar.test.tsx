import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { Avatar } from './Avatar';

// Mock React Native components
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('Avatar', () => {
  describe('with image source', () => {
    it('renders image when src is provided', () => {
      const tree = renderer
        .create(<Avatar src="https://example.com/avatar.jpg" />)
        .toJSON();

      expect(tree).toBeTruthy();
      expect(JSON.stringify(tree)).toContain('Image');
      expect(JSON.stringify(tree)).toContain('https://example.com/avatar.jpg');
    });

    it('does not render initials when src is provided', () => {
      const tree = renderer.create(
        <Avatar src="https://example.com/avatar.jpg" name="John Doe" />
      );

      // Should have Image, not Text with initials
      const images = tree.root.findAllByType('Image' as never);
      expect(images.length).toBe(1);
    });
  });

  describe('with initials fallback', () => {
    it('renders initials when no src provided', () => {
      const tree = renderer.create(<Avatar name="John Doe" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('JD');
    });

    it('renders first two initials for multi-word names', () => {
      const tree = renderer.create(<Avatar name="John Michael Doe" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('JM');
    });

    it('renders single initial for single-word names', () => {
      const tree = renderer.create(<Avatar name="John" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('J');
    });

    it('converts initials to uppercase', () => {
      const tree = renderer.create(<Avatar name="john doe" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('JD');
    });

    it('renders ? when no name provided', () => {
      const tree = renderer.create(<Avatar />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('?');
    });

    it('renders ? when name is empty string', () => {
      const tree = renderer.create(<Avatar name="" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('?');
    });

    it('renders initials when src is null', () => {
      const tree = renderer.create(<Avatar src={null} name="Jane Doe" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.children).toBe('JD');
    });
  });

  describe('sizes', () => {
    const sizeMap = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 56,
      xl: 80,
    };

    it('defaults to md size', () => {
      const tree = renderer.create(<Avatar name="Test" />);

      const view = tree.root.findByType('View' as never);
      expect(view.props.style.width).toBe(40);
      expect(view.props.style.height).toBe(40);
    });

    it.each(Object.entries(sizeMap))('renders %s size correctly', (size, dimension) => {
      const tree = renderer.create(
        <Avatar name="Test" size={size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'} />
      );

      const view = tree.root.findByType('View' as never);
      expect(view.props.style.width).toBe(dimension);
      expect(view.props.style.height).toBe(dimension);
    });

    it('applies correct text size for xs', () => {
      const tree = renderer.create(<Avatar name="Test" size="xs" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.className).toContain('text-[10px]');
    });

    it('applies correct text size for sm', () => {
      const tree = renderer.create(<Avatar name="Test" size="sm" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.className).toContain('text-xs');
    });

    it('applies correct text size for md', () => {
      const tree = renderer.create(<Avatar name="Test" size="md" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.className).toContain('text-sm');
    });

    it('applies correct text size for lg', () => {
      const tree = renderer.create(<Avatar name="Test" size="lg" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.className).toContain('text-base');
    });

    it('applies correct text size for xl', () => {
      const tree = renderer.create(<Avatar name="Test" size="xl" />);

      const text = tree.root.findByType('Text' as never);
      expect(text.props.className).toContain('text-xl');
    });
  });

  describe('styling', () => {
    it('applies default container styles', () => {
      const tree = renderer.create(<Avatar name="Test" />).toJSON();

      const jsonStr = JSON.stringify(tree);
      expect(jsonStr).toContain('rounded-full');
      expect(jsonStr).toContain('bg-gray-200');
    });

    it('merges custom className', () => {
      const tree = renderer
        .create(<Avatar name="Test" className="custom-class" />)
        .toJSON();

      expect(JSON.stringify(tree)).toContain('custom-class');
    });

    it('forwards additional props', () => {
      const tree = renderer.create(<Avatar name="Test" testID="avatar-test" />);

      const view = tree.root.findByType('View' as never);
      expect(view.props.testID).toBe('avatar-test');
    });
  });
});
