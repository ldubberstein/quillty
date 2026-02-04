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

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './useNotifications';

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

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when userId is undefined', async () => {
    const { result } = renderHook(() => useNotifications(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches notifications for user', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'like',
        actor: { id: 'user-2', username: 'likeuser' },
        pattern: { id: 'pattern-1', title: 'My Pattern' },
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
    });

    const { result } = renderHook(() => useNotifications('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockNotifications);
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });
});

describe('useUnreadNotificationCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 when userId is undefined', async () => {
    const { result } = renderHook(() => useUnreadNotificationCount(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches unread count for user', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb) => cb({ count: 5, error: null })),
    });

    // Use a proper mock chain
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useUnreadNotificationCount('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBe(5);
    });
  });

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useUnreadNotificationCount('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBe(0);
    });
  });
});

describe('useMarkNotificationRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks notification as read', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        notificationId: 'notif-1',
        userId: 'user-1',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });
});

describe('useMarkAllNotificationsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks all notifications as read', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    });

    // Mock the full chain
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq1 }),
    });

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ userId: 'user-1' });
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });
});
