import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as renderer from 'react-test-renderer';
import { FeedCard } from './FeedCard';
import type { FeedItemType } from './FeedCard';

// Mock React Native components
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
  Image: 'Image',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Track props passed to mocked components
let patternCardProps: Record<string, unknown> | null = null;
let blockCardProps: Record<string, unknown> | null = null;

// Mock child components as actual React components
vi.mock('./PatternCard', () => ({
  PatternCard: (props: Record<string, unknown>) => {
    patternCardProps = props;
    return React.createElement('MockPatternCard', props);
  },
}));

vi.mock('./BlockCard', () => ({
  BlockCard: (props: Record<string, unknown>) => {
    blockCardProps = props;
    return React.createElement('MockBlockCard', props);
  },
}));

describe('FeedCard', () => {
  const mockPatternItem: FeedItemType = {
    type: 'pattern',
    data: {
      id: 'pattern-123',
      title: 'Beautiful Quilt Pattern',
      thumbnail_url: 'https://example.com/pattern.jpg',
      like_count: 42,
      status: 'published_free',
      price: null,
      creator: {
        id: 'user-456',
        username: 'quilter',
        display_name: 'Quilter Jane',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    },
  };

  const mockBlockItem: FeedItemType = {
    type: 'block',
    data: {
      id: 'block-789',
      name: 'Log Cabin Block',
      thumbnail_url: 'https://example.com/block.jpg',
      like_count: 18,
      creator: {
        id: 'user-101',
        username: 'blockmaker',
        display_name: 'Block Master',
        avatar_url: 'https://example.com/avatar2.jpg',
      },
    },
  };

  beforeEach(() => {
    patternCardProps = null;
    blockCardProps = null;
  });

  it('renders PatternCard for pattern items', () => {
    renderer.create(<FeedCard item={mockPatternItem} />);

    expect(patternCardProps).toBeTruthy();
    expect(patternCardProps?.title).toBe('Beautiful Quilt Pattern');
  });

  it('renders BlockCard for block items', () => {
    renderer.create(<FeedCard item={mockBlockItem} />);

    expect(blockCardProps).toBeTruthy();
    expect(blockCardProps?.name).toBe('Log Cabin Block');
  });

  it('passes creator info to PatternCard', () => {
    renderer.create(<FeedCard item={mockPatternItem} />);

    expect(patternCardProps?.creatorName).toBe('Quilter Jane');
    expect(patternCardProps?.creatorAvatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('passes creator info to BlockCard', () => {
    renderer.create(<FeedCard item={mockBlockItem} />);

    expect(blockCardProps?.creatorName).toBe('Block Master');
    expect(blockCardProps?.creatorAvatarUrl).toBe('https://example.com/avatar2.jpg');
  });

  it('calls onPatternPress when pattern card is pressed', () => {
    const onPatternPress = vi.fn();
    renderer.create(
      <FeedCard item={mockPatternItem} onPatternPress={onPatternPress} />
    );

    // Simulate press by calling onPress prop
    const onPress = patternCardProps?.onPress as () => void;
    onPress?.();

    expect(onPatternPress).toHaveBeenCalledWith('pattern-123');
  });

  it('calls onBlockPress when block card is pressed', () => {
    const onBlockPress = vi.fn();
    renderer.create(
      <FeedCard item={mockBlockItem} onBlockPress={onBlockPress} />
    );

    const onPress = blockCardProps?.onPress as () => void;
    onPress?.();

    expect(onBlockPress).toHaveBeenCalledWith('block-789');
  });

  it('handles premium pattern correctly', () => {
    const premiumPattern: FeedItemType = {
      type: 'pattern',
      data: {
        ...mockPatternItem.data,
        status: 'published_premium',
        price: 9.99,
      },
    };

    renderer.create(<FeedCard item={premiumPattern} />);

    expect(patternCardProps?.isPremium).toBe(true);
    expect(patternCardProps?.price).toBe(9.99);
  });

  it('falls back to username when display_name is null', () => {
    const noDisplayNamePattern: FeedItemType = {
      type: 'pattern',
      data: {
        ...mockPatternItem.data,
        creator: {
          id: 'user-456',
          username: 'quilter',
          display_name: null,
          avatar_url: null,
        },
      },
    };

    renderer.create(<FeedCard item={noDisplayNamePattern} />);

    expect(patternCardProps?.creatorName).toBe('quilter');
  });
});
