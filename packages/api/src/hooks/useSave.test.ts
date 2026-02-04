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

import { useSaveStatus, useToggleSave, useUserSaves } from './useSave';

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

describe('useSaveStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when userId is undefined', async () => {
    const { result } = renderHook(
      () => useSaveStatus(undefined, 'content-1', 'pattern'),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns false when contentId is undefined', async () => {
    const { result } = renderHook(
      () => useSaveStatus('user-1', undefined, 'pattern'),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns true when save exists for pattern', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'save-1' }, error: null }),
    });

    const { result } = renderHook(
      () => useSaveStatus('user-1', 'pattern-1', 'pattern'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });

  it('returns true when save exists for block', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'save-1' }, error: null }),
    });

    const { result } = renderHook(
      () => useSaveStatus('user-1', 'block-1', 'block'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });
  });

  it('returns false when save does not exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { result } = renderHook(
      () => useSaveStatus('user-1', 'pattern-1', 'pattern'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(false);
    });
  });
});

describe('useToggleSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unsaves when isSaved is true for pattern', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useToggleSave(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'pattern-1',
        contentType: 'pattern',
        isSaved: true,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });

  it('saves when isSaved is false for pattern', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useToggleSave(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'pattern-1',
        contentType: 'pattern',
        isSaved: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      pattern_id: 'pattern-1',
    });
  });

  it('saves block when isSaved is false', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useToggleSave(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'block-1',
        contentType: 'block',
        isSaved: false,
      });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      block_id: 'block-1',
    });
  });

  it('optimistically updates save_count when content data exists', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate content data in cache
    queryClient.setQueryData(['pattern', 'pattern-1'], { id: 'pattern-1', save_count: 5 });
    queryClient.setQueryData(['save-status', 'user-1', 'pattern', 'pattern-1'], false);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'pattern-1',
        contentType: 'pattern',
        isSaved: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });

  it('optimistically updates block save_count', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate block data in cache
    queryClient.setQueryData(['block', 'block-1'], { id: 'block-1', save_count: 3 });
    queryClient.setQueryData(['save-status', 'user-1', 'block', 'block-1'], false);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'block-1',
        contentType: 'block',
        isSaved: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });

  it('rolls back on error for pattern', async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error('Save failed'));
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate cache
    queryClient.setQueryData(['save-status', 'user-1', 'pattern', 'pattern-1'], false);
    queryClient.setQueryData(['pattern', 'pattern-1'], { id: 'pattern-1', save_count: 10 });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          userId: 'user-1',
          contentId: 'pattern-1',
          contentType: 'pattern',
          isSaved: false,
        });
      })
    ).rejects.toThrow('Save failed');

    // Status should be rolled back
    expect(queryClient.getQueryData(['save-status', 'user-1', 'pattern', 'pattern-1'])).toBe(false);
  });

  it('rolls back on error for block', async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error('Save failed'));
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Pre-populate cache
    queryClient.setQueryData(['save-status', 'user-1', 'block', 'block-1'], false);
    queryClient.setQueryData(['block', 'block-1'], { id: 'block-1', save_count: 5 });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          userId: 'user-1',
          contentId: 'block-1',
          contentType: 'block',
          isSaved: false,
        });
      })
    ).rejects.toThrow('Save failed');
  });

  it('handles error with no previous context', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('Insert failed')),
    });

    const { result } = renderHook(() => useToggleSave(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          userId: 'user-1',
          contentId: 'pattern-1',
          contentType: 'pattern',
          isSaved: false,
        });
      })
    ).rejects.toThrow('Insert failed');
  });

  it('unsaves block when isSaved is true', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useToggleSave(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: 'user-1',
        contentId: 'block-1',
        contentType: 'block',
        isSaved: true,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });
});

describe('useUserSaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when userId is undefined', async () => {
    const { result } = renderHook(() => useUserSaves(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches user saves', async () => {
    const mockSaves = [
      {
        id: 'save-1',
        pattern: { id: 'pattern-1', title: 'My Pattern' },
      },
      {
        id: 'save-2',
        block: { id: 'block-1', name: 'My Block' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSaves, error: null }),
    });

    const { result } = renderHook(() => useUserSaves('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSaves);
    });

    expect(mockFrom).toHaveBeenCalledWith('saves');
  });

  it('handles error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
    });

    const { result } = renderHook(() => useUserSaves('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
