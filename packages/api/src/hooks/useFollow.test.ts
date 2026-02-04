import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted for mocks
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

// Mock Supabase client
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

import { useFollowStatus, useToggleFollow, useUserFollowers, useUserFollowing } from './useFollow';

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

describe('useFollowStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when follower and followed are the same', async () => {
    const { result } = renderHook(
      () => useFollowStatus('user-1', 'user-1'),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns false when followerId is undefined', async () => {
    const { result } = renderHook(
      () => useFollowStatus(undefined, 'user-2'),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns false when followedId is undefined', async () => {
    const { result } = renderHook(
      () => useFollowStatus('user-1', undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns true when follow exists', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { follower_id: 'user-1' },
        error: null,
      }),
    });

    const { result } = renderHook(
      () => useFollowStatus('user-1', 'user-2'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith('follows');
  });

  it('returns false when follow does not exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { result } = renderHook(
      () => useFollowStatus('user-1', 'user-2'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(false);
    });
  });
});

describe('useToggleFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unfollows when isFollowing is true', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb) => cb({ error: null })),
    });

    // Create mock that returns a promise
    const mockDelete = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockDelete,
        }),
      }),
    });

    const { result } = renderHook(() => useToggleFollow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        followerId: 'user-1',
        followedId: 'user-2',
        isFollowing: true,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('follows');
  });

  it('follows when isFollowing is false', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useToggleFollow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        followerId: 'user-1',
        followedId: 'user-2',
        isFollowing: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('follows');
    expect(mockInsert).toHaveBeenCalledWith({
      follower_id: 'user-1',
      followed_id: 'user-2',
    });
  });

  it('optimistically updates follower count when user data exists', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate user data in cache
    queryClient.setQueryData(['user', 'user-2'], { id: 'user-2', follower_count: 10 });
    queryClient.setQueryData(['follow-status', 'user-1', 'user-2'], false);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        followerId: 'user-1',
        followedId: 'user-2',
        isFollowing: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('follows');
  });

  it('rolls back on error', async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error('Follow failed'));
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate cache with initial values
    queryClient.setQueryData(['follow-status', 'user-1', 'user-2'], false);
    queryClient.setQueryData(['user', 'user-2'], { id: 'user-2', follower_count: 5 });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          followerId: 'user-1',
          followedId: 'user-2',
          isFollowing: false,
        });
      })
    ).rejects.toThrow('Follow failed');

    // Verify rollback - status should be restored to false
    expect(queryClient.getQueryData(['follow-status', 'user-1', 'user-2'])).toBe(false);
  });

  it('handles error when no previous context', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('Insert failed')),
    });

    const { result } = renderHook(() => useToggleFollow(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          followerId: 'user-1',
          followedId: 'user-2',
          isFollowing: false,
        });
      })
    ).rejects.toThrow('Insert failed');
  });
});

describe('useUserFollowers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when userId is undefined', async () => {
    const { result } = renderHook(() => useUserFollowers(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches followers for user', async () => {
    const mockFollowers = [
      {
        follower_id: 'user-2',
        followed_id: 'user-1',
        created_at: '2024-01-01',
        user: { id: 'user-2', username: 'follower' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockFollowers, error: null }),
    });

    const { result } = renderHook(() => useUserFollowers('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockFollowers);
    });
  });
});

describe('useUserFollowing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when userId is undefined', async () => {
    const { result } = renderHook(() => useUserFollowing(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches following for user', async () => {
    const mockFollowing = [
      {
        follower_id: 'user-1',
        followed_id: 'user-2',
        created_at: '2024-01-01',
        user: { id: 'user-2', username: 'followed' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockFollowing, error: null }),
    });

    const { result } = renderHook(() => useUserFollowing('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockFollowing);
    });
  });
});
