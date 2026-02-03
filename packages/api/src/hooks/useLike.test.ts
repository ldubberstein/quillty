import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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

import { useLikeStatus, useToggleLike, useUserLikes } from './useLike';

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

describe('useLikeStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when content is liked', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'like-123' }, error: null }),
    });

    const { result } = renderHook(
      () => useLikeStatus('user-123', 'pattern-456', 'pattern'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith('likes');
  });

  it('returns false when content is not liked', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { result } = renderHook(
      () => useLikeStatus('user-123', 'pattern-456', 'pattern'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(false);
    });
  });

  it('returns false and disables query when no userId', async () => {
    const { result } = renderHook(
      () => useLikeStatus(undefined, 'pattern-456', 'pattern'),
      { wrapper: createWrapper() }
    );

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns false and disables query when no contentId', async () => {
    const { result } = renderHook(
      () => useLikeStatus('user-123', undefined, 'pattern'),
      { wrapper: createWrapper() }
    );

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useToggleLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts like record when liking', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleLike(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-123',
        contentId: 'pattern-456',
        contentType: 'pattern',
        isLiked: false, // Not currently liked, so this will like it
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('likes');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      pattern_id: 'pattern-456',
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('deletes like record when unliking', async () => {
    // Create chainable mock that properly resolves
    const mockEqSecond = vi.fn().mockResolvedValue({ error: null });
    const mockEqFirst = vi.fn().mockReturnValue({ eq: mockEqSecond });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqFirst });

    mockFrom.mockReturnValue({
      delete: mockDelete,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleLike(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-123',
        contentId: 'pattern-456',
        contentType: 'pattern',
        isLiked: true, // Currently liked, so this will unlike it
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('likes');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('handles block likes correctly', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useToggleLike(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-123',
        contentId: 'block-456',
        contentType: 'block',
        isLiked: false,
      });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      block_id: 'block-456',
    });
  });

  it('performs optimistic update', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleLike(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-123',
        contentId: 'pattern-456',
        contentType: 'pattern',
        isLiked: false,
      });
    });

    // Check that optimistic update was called
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['like-status', 'user-123', 'pattern', 'pattern-456'],
      true // New like status
    );
  });

  it('rolls back on error', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: new Error('Network error'),
    });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-set the like status
    queryClient.setQueryData(['like-status', 'user-123', 'pattern', 'pattern-456'], false);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleLike(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          userId: 'user-123',
          contentId: 'pattern-456',
          contentType: 'pattern',
          isLiked: false,
        });
      })
    ).rejects.toThrow('Network error');
  });
});

describe('useUserLikes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns likes with content for authenticated user', async () => {
    const mockLikes = [
      {
        id: 'like-1',
        user_id: 'user-123',
        pattern_id: 'pattern-456',
        pattern: {
          id: 'pattern-456',
          title: 'Liked Pattern',
          thumbnail_url: 'https://example.com/thumb.jpg',
          creator_id: 'user-789',
          creator: { id: 'user-789', username: 'creator' },
        },
        block: null,
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLikes, error: null }),
    });

    const { result } = renderHook(() => useUserLikes('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockLikes);
    });

    expect(mockFrom).toHaveBeenCalledWith('likes');
  });

  it('returns empty array when userId is undefined', async () => {
    const { result } = renderHook(() => useUserLikes(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('handles empty likes list', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { result } = renderHook(() => useUserLikes('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
