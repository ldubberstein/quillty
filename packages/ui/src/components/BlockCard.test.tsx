import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { BlockCard } from './BlockCard';

// Mock React Native components
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  Pressable: 'Pressable',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock Avatar component
vi.mock('./Avatar', () => ({
  Avatar: ({ src, name, size }: { src?: string; name?: string; size?: string }) => (
    <span data-testid="avatar" data-src={src} data-name={name} data-size={size}>
      Avatar
    </span>
  ),
}));

describe('BlockCard', () => {
  const defaultProps = {
    name: 'Test Block',
  };

  it('renders block name', () => {
    const tree = renderer.create(<BlockCard {...defaultProps} />);

    const texts = tree.root.findAllByType('Text' as never);
    const nameText = texts.find((t) => t.props.children === 'Test Block');
    expect(nameText).toBeTruthy();
  });

  it('renders "Block" badge', () => {
    const tree = renderer.create(<BlockCard {...defaultProps} />);

    const texts = tree.root.findAllByType('Text' as never);
    const badgeText = texts.find((t) => t.props.children === 'Block');
    expect(badgeText).toBeTruthy();
  });

  describe('thumbnail', () => {
    it('renders image when thumbnailUrl is provided', () => {
      const tree = renderer.create(
        <BlockCard {...defaultProps} thumbnailUrl="https://example.com/thumb.jpg" />
      );

      const images = tree.root.findAllByType('Image' as never);
      expect(images.length).toBe(1);
      expect(images[0].props.source.uri).toBe('https://example.com/thumb.jpg');
    });

    it('renders placeholder when thumbnailUrl is not provided', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const placeholder = texts.find((t) => t.props.children === '◇');
      expect(placeholder).toBeTruthy();
    });

    it('renders placeholder when thumbnailUrl is null', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} thumbnailUrl={null} />);

      const texts = tree.root.findAllByType('Text' as never);
      const placeholder = texts.find((t) => t.props.children === '◇');
      expect(placeholder).toBeTruthy();
    });
  });

  describe('creator info', () => {
    it('renders creator name', () => {
      const tree = renderer.create(
        <BlockCard {...defaultProps} creatorName="Jane Designer" />
      );

      const texts = tree.root.findAllByType('Text' as never);
      const creatorText = texts.find((t) => t.props.children === 'Jane Designer');
      expect(creatorText).toBeTruthy();
    });

    it('renders "Unknown" when no creator name', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const unknownText = texts.find((t) => t.props.children === 'Unknown');
      expect(unknownText).toBeTruthy();
    });

    it('renders Avatar with creator info', () => {
      const tree = renderer.create(
        <BlockCard
          {...defaultProps}
          creatorName="Jane Designer"
          creatorAvatarUrl="https://example.com/avatar.jpg"
        />
      );

      const avatar = tree.root.findByType('span' as never);
      expect(avatar.props['data-name']).toBe('Jane Designer');
      expect(avatar.props['data-src']).toBe('https://example.com/avatar.jpg');
      expect(avatar.props['data-size']).toBe('xs');
    });
  });

  describe('likes', () => {
    it('renders like count', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} likeCount={42} />);

      const texts = tree.root.findAllByType('Text' as never);
      const likeCountText = texts.find((t) => t.props.children === 42);
      expect(likeCountText).toBeTruthy();
    });

    it('defaults to 0 likes', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const likeCountText = texts.find((t) => t.props.children === 0);
      expect(likeCountText).toBeTruthy();
    });

    it('renders heart icon', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const heartText = texts.find((t) => t.props.children === '♥');
      expect(heartText).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('forwards onPress callback', () => {
      const onPress = vi.fn();
      const tree = renderer.create(<BlockCard {...defaultProps} onPress={onPress} />);

      const pressable = tree.root.findByType('Pressable' as never);
      expect(pressable.props.onPress).toBe(onPress);
    });

    it('applies custom className', () => {
      const tree = renderer
        .create(<BlockCard {...defaultProps} className="custom-block-class" />)
        .toJSON();

      expect(JSON.stringify(tree)).toContain('custom-block-class');
    });
  });

  describe('styling', () => {
    it('applies default card styles', () => {
      const tree = renderer.create(<BlockCard {...defaultProps} />).toJSON();

      const jsonStr = JSON.stringify(tree);
      expect(jsonStr).toContain('rounded-2xl');
      expect(jsonStr).toContain('border-gray-100');
      expect(jsonStr).toContain('bg-white');
    });
  });
});
