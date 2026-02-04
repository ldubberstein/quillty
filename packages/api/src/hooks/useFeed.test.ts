import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted to define mock data
const { mockGetFeedApi, setMockResponse } = vi.hoisted(() => {
  let mockResponse: { data: unknown[]; nextCursor: number | null; cached: boolean } = {
    data: [],
    nextCursor: null,
    cached: false,
  };
  let mockError: Error | null = null;

  return {
    mockGetFeedApi: vi.fn().mockImplementation(async () => {
      if (mockError) throw mockError;
      return mockResponse;
    }),
    setMockResponse: (
      data: unknown[],
      nextCursor: number | null = null,
      error: Error | null = null
    ) => {
      mockResponse = { data, nextCursor, cached: false };
      mockError = error;
    },
  };
});

// Mock the feed API
vi.mock('../api/feed', () => ({
  getFeedApi: mockGetFeedApi,
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
    setMockResponse([], null, null);
  });

  it('fetches forYou feed with patterns and blocks', async () => {
    const mockFeedItems = [
      {
        type: 'block',
        data: {
          id: 'block-1',
          name: 'Block One',
          published_at: '2024-01-03T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          creator: { id: 'user-2', username: 'user2' },
        },
      },
      {
        type: 'pattern',
        data: {
          id: 'pattern-1',
          title: 'Pattern One',
          published_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          creator: { id: 'user-1', username: 'user1' },
        },
      },
    ];

    setMockResponse(mockFeedItems);

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Check that feed items are returned
    const feedItems = result.current.data?.pages[0];
    expect(feedItems).toHaveLength(2);

    // Block should come first (as returned by API - already sorted)
    expect(feedItems?.[0].type).toBe('block');
    expect(feedItems?.[1].type).toBe('pattern');
  });

  it('fetches following feed filtered by followed users', async () => {
    const mockFeedItems = [
      {
        type: 'pattern',
        data: {
          id: 'pattern-1',
          title: 'Followed Pattern',
          published_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          creator: { id: 'user-followed-1', username: 'followed1' },
        },
      },
    ];

    setMockResponse(mockFeedItems);

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
    const error = new Error('Database connection failed');
    setMockResponse([], null, error);

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
    const mockFeedItems = Array.from({ length: 20 }, (_, i) => ({
      type: 'pattern' as const,
      data: {
        id: `pattern-${i}`,
        title: `Pattern ${i}`,
        published_at: `2024-01-0${Math.min(i + 1, 9)}T00:00:00Z`,
        created_at: '2024-01-01T00:00:00Z',
        creator: { id: `user-${i}`, username: `user${i}` },
      },
    }));

    setMockResponse(mockFeedItems);

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // When we have a full page (20 items), hasNextPage should be true
    expect(result.current.hasNextPage).toBe(true);
  });

  it('returns hasNextPage false when less than 20 items', async () => {
    const mockFeedItems = [
      {
        type: 'pattern',
        data: {
          id: 'pattern-1',
          title: 'Only Pattern',
          published_at: '2024-01-01T00:00:00Z',
          creator: { id: 'user-1', username: 'user1' },
        },
      },
    ];

    setMockResponse(mockFeedItems);

    const { result } = renderHook(() => useFeed({ type: 'forYou' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('passes correct parameters to API', async () => {
    setMockResponse([]);

    const { result } = renderHook(() => useFeed({ type: 'following', userId: 'user-123' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockGetFeedApi).toHaveBeenCalledWith({
      type: 'following',
      cursor: 0,
    });
  });
});
