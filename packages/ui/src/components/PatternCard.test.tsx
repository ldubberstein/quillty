import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { PatternCard } from './PatternCard';

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

describe('PatternCard', () => {
  const defaultProps = {
    title: 'Test Pattern',
  };

  it('renders pattern title', () => {
    const tree = renderer.create(<PatternCard {...defaultProps} />);

    const texts = tree.root.findAllByType('Text' as never);
    const titleText = texts.find((t) => t.props.children === 'Test Pattern');
    expect(titleText).toBeTruthy();
  });

  describe('thumbnail', () => {
    it('renders image when thumbnailUrl is provided', () => {
      const tree = renderer.create(
        <PatternCard {...defaultProps} thumbnailUrl="https://example.com/pattern.jpg" />
      );

      const images = tree.root.findAllByType('Image' as never);
      expect(images.length).toBe(1);
      expect(images[0].props.source.uri).toBe('https://example.com/pattern.jpg');
    });

    it('renders placeholder emoji when no thumbnailUrl', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const placeholder = texts.find((t) => t.props.children === '🧵');
      expect(placeholder).toBeTruthy();
    });

    it('renders placeholder when thumbnailUrl is null', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} thumbnailUrl={null} />);

      const texts = tree.root.findAllByType('Text' as never);
      const placeholder = texts.find((t) => t.props.children === '🧵');
      expect(placeholder).toBeTruthy();
    });
  });

  describe('price badge', () => {
    it('shows FREE badge by default', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const freeBadge = texts.find((t) => t.props.children === 'FREE');
      expect(freeBadge).toBeTruthy();
    });

    it('shows FREE badge when not premium', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} isPremium={false} />);

      const texts = tree.root.findAllByType('Text' as never);
      const freeBadge = texts.find((t) => t.props.children === 'FREE');
      expect(freeBadge).toBeTruthy();
    });

    it('shows price when isPremium and price provided', () => {
      const tree = renderer.create(
        <PatternCard {...defaultProps} isPremium={true} price={9.99} />
      ).toJSON();

      // The price is rendered as "$" + {price} in JSX, so check the JSON string
      const jsonStr = JSON.stringify(tree);
      expect(jsonStr).toContain('$');
      expect(jsonStr).toContain('9.99');
      // FREE should not be present
      expect(jsonStr).not.toContain('FREE');
    });

    it('shows FREE badge when isPremium but no price', () => {
      const tree = renderer.create(
        <PatternCard {...defaultProps} isPremium={true} price={null} />
      );

      const texts = tree.root.findAllByType('Text' as never);
      const freeBadge = texts.find((t) => t.props.children === 'FREE');
      expect(freeBadge).toBeTruthy();
    });

    it('shows FREE badge when price is 0', () => {
      const tree = renderer.create(
        <PatternCard {...defaultProps} isPremium={true} price={0} />
      );

      const texts = tree.root.findAllByType('Text' as never);
      // price 0 is falsy, so should show FREE
      const freeBadge = texts.find((t) => t.props.children === 'FREE');
      expect(freeBadge).toBeTruthy();
    });
  });

  describe('creator info', () => {
    it('renders creator name', () => {
      const tree = renderer.create(
        <PatternCard {...defaultProps} creatorName="Pattern Designer" />
      );

      const texts = tree.root.findAllByType('Text' as never);
      const creatorText = texts.find((t) => t.props.children === 'Pattern Designer');
      expect(creatorText).toBeTruthy();
    });

    it('renders "Unknown" when no creator name', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const unknownText = texts.find((t) => t.props.children === 'Unknown');
      expect(unknownText).toBeTruthy();
    });

    it('renders Avatar with creator info', () => {
      const tree = renderer.create(
        <PatternCard
          {...defaultProps}
          creatorName="Pattern Designer"
          creatorAvatarUrl="https://example.com/avatar.jpg"
        />
      );

      const avatar = tree.root.findByType('span' as never);
      expect(avatar.props['data-name']).toBe('Pattern Designer');
      expect(avatar.props['data-src']).toBe('https://example.com/avatar.jpg');
      expect(avatar.props['data-size']).toBe('xs');
    });
  });

  describe('likes', () => {
    it('renders like count', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} likeCount={100} />);

      const texts = tree.root.findAllByType('Text' as never);
      const likeCountText = texts.find((t) => t.props.children === 100);
      expect(likeCountText).toBeTruthy();
    });

    it('defaults to 0 likes', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const likeCountText = texts.find((t) => t.props.children === 0);
      expect(likeCountText).toBeTruthy();
    });

    it('renders heart icon', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />);

      const texts = tree.root.findAllByType('Text' as never);
      const heartText = texts.find((t) => t.props.children === '♥');
      expect(heartText).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('forwards onPress callback', () => {
      const onPress = vi.fn();
      const tree = renderer.create(<PatternCard {...defaultProps} onPress={onPress} />);

      const pressable = tree.root.findByType('Pressable' as never);
      expect(pressable.props.onPress).toBe(onPress);
    });

    it('applies custom className', () => {
      const tree = renderer
        .create(<PatternCard {...defaultProps} className="custom-pattern-class" />)
        .toJSON();

      expect(JSON.stringify(tree)).toContain('custom-pattern-class');
    });
  });

  describe('styling', () => {
    it('applies default card styles', () => {
      const tree = renderer.create(<PatternCard {...defaultProps} />).toJSON();

      const jsonStr = JSON.stringify(tree);
      expect(jsonStr).toContain('rounded-2xl');
      expect(jsonStr).toContain('border-gray-100');
      expect(jsonStr).toContain('bg-white');
    });
  });
});
