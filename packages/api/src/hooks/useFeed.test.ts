import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted to define mocks
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

// Mock the Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

import { useFeed } from './useFeed';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches forYou feed with patterns and blocks', async () => {
    const mockPatterns = [
      {
        id: 'pattern-1',
        title: 'Pattern One',
        published_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        creator: { id: 'user-1', username: 'user1' },
      },
    ];

    const mockBlocks = [
      {
        id: 'block-1',
        name: 'Block One',
        published_at: '2024-01-03T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        creator: { id: 'user-2', username: 'user2' },
      },
    ];

    // Create chainable mock for patterns query
    const patternsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockPatterns, error: null }),
    };

    // Create chainable mock for blocks query
    const blocksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockBlocks, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quilt_patterns') return patternsQuery;
      if (table === 'blocks') return blocksQuery;
      return patternsQuery;
    });

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Check that feed items are combined and sorted by date
    const feedItems = result.current.data?.pages[0];
    expect(feedItems).toHaveLength(2);

    // Block should come first (more recent published_at)
    expect(feedItems?.[0].type).toBe('block');
    expect(feedItems?.[1].type).toBe('pattern');
  });

  it('fetches following feed filtered by followed users', async () => {
    const mockFollows = [{ followed_id: 'user-followed-1' }, { followed_id: 'user-followed-2' }];

    const mockPatterns = [
      {
        id: 'pattern-1',
        title: 'Followed Pattern',
        published_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        creator: { id: 'user-followed-1', username: 'followed1' },
      },
    ];

    const mockBlocks: unknown[] = [];

    // Create chainable mock
    const followsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockFollows, error: null }),
    };

    const patternsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockPatterns, error: null }),
    };

    const blocksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockBlocks, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'follows') return followsQuery;
      if (table === 'quilt_patterns') return patternsQuery;
      if (table === 'blocks') return blocksQuery;
      return followsQuery;
    });

    const { result } = renderHook(
      () => useFeed({ type: 'following', userId: 'user-123' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const feedItems = result.current.data?.pages[0];
    expect(feedItems).toHaveLength(1);
    expect(feedItems?.[0].type).toBe('pattern');
  });

  it('handles query errors gracefully', async () => {
    const errorQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      }),
    };

    const blocksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quilt_patterns') return errorQuery;
      if (table === 'blocks') return blocksQuery;
      return errorQuery;
    });

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('supports pagination with getNextPageParam', async () => {
    // Create a full page of 20 items to trigger hasNextPage
    const mockPatterns = Array.from({ length: 20 }, (_, i) => ({
      id: `pattern-${i}`,
      title: `Pattern ${i}`,
      published_at: `2024-01-0${Math.min(i + 1, 9)}T00:00:00Z`,
      created_at: '2024-01-01T00:00:00Z',
      creator: { id: `user-${i}`, username: `user${i}` },
    }));

    const patternsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockPatterns, error: null }),
    };

    const blocksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quilt_patterns') return patternsQuery;
      if (table === 'blocks') return blocksQuery;
      return patternsQuery;
    });

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // When we have a full page (20 items), hasNextPage should be true
    expect(result.current.hasNextPage).toBe(true);
  });
});
