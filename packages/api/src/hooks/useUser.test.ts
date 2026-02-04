import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted for mocks
const { mockFrom, mockGetUserProfileApi } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUserProfileApi: vi.fn(),
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

// Mock API functions
vi.mock('../api/users', () => ({
  getUserProfileApi: mockGetUserProfileApi,
}));

import { useUser, useUserByUsername } from './useUser';

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

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no userId provided', async () => {
    const { result } = renderHook(() => useUser(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches user by ID', async () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
    });

    const { result } = renderHook(() => useUser('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockUser);
    });

    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('handles error when fetching user', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') }),
    });

    const { result } = renderHook(() => useUser('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUserByUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no username provided', async () => {
    const { result } = renderHook(() => useUserByUsername(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches user profile by username', async () => {
    const mockProfile = {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
      block_count: 5,
      pattern_count: 3,
      is_following: false,
    };

    mockGetUserProfileApi.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useUserByUsername('testuser'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile);
    });

    expect(mockGetUserProfileApi).toHaveBeenCalledWith('testuser');
  });

  it('handles error when fetching profile', async () => {
    mockGetUserProfileApi.mockRejectedValue(new Error('Profile not found'));

    const { result } = renderHook(() => useUserByUsername('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
