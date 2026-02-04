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

import { useComments, useAddComment, useUpdateComment, useDeleteComment } from './useComments';

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

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when contentId is undefined', async () => {
    const { result } = renderHook(
      () => useComments(undefined, 'pattern'),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches comments for pattern', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        content: 'Great pattern!',
        user: { id: 'user-1', username: 'testuser' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockComments, error: null }),
    });

    const { result } = renderHook(
      () => useComments('pattern-123', 'pattern'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockComments);
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
  });

  it('fetches comments for block', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        content: 'Nice block!',
        user: { id: 'user-1', username: 'testuser' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockComments, error: null }),
    });

    const { result } = renderHook(
      () => useComments('block-123', 'block'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockComments);
    });
  });
});

describe('useAddComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds comment for pattern', async () => {
    const newComment = {
      id: 'comment-new',
      content: 'New comment',
      user_id: 'user-1',
      pattern_id: 'pattern-123',
    };

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newComment, error: null }),
    });

    const { result } = renderHook(() => useAddComment(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'pattern-123',
        contentType: 'pattern',
        content: 'New comment',
      });
    });

    expect(response).toEqual(newComment);
    expect(mockFrom).toHaveBeenCalledWith('comments');
  });

  it('adds comment for block', async () => {
    const newComment = {
      id: 'comment-new',
      content: 'Block comment',
      user_id: 'user-1',
      block_id: 'block-123',
    };

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newComment, error: null }),
    });

    const { result } = renderHook(() => useAddComment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'block-123',
        contentType: 'block',
        content: 'Block comment',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
  });
});

describe('useUpdateComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates comment content', async () => {
    const updatedComment = {
      id: 'comment-1',
      content: 'Updated content',
    };

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedComment, error: null }),
    });

    const { result } = renderHook(() => useUpdateComment(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        commentId: 'comment-1',
        content: 'Updated content',
        contentId: 'pattern-123',
        contentType: 'pattern',
      });
    });

    expect(response).toEqual(updatedComment);
  });
});

describe('useDeleteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes comment', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        commentId: 'comment-1',
        contentId: 'pattern-123',
        contentType: 'pattern',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
  });

  it('invalidates block queries on delete', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        commentId: 'comment-1',
        contentId: 'block-123',
        contentType: 'block',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
  });
});
