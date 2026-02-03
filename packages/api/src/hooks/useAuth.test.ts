import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignUp,
  mockSignInWithPassword,
  mockSignOut,
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockFrom,
  mockUnsubscribe,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockFrom: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

// Mock the Supabase client
vi.mock('../client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: vi.fn(),
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  },
}));

import {
  useAuth,
  useProfile,
  useUpdateProfile,
  useSignUp,
  useSignIn,
  useSignOut,
  useResetPassword,
  useUpdatePassword,
  useCheckUsername,
} from './useAuth';

// Store auth state callback for testing
let authStateCallback: ((event: string, session: unknown) => void) | null = null;

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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });
  });

  it('returns loading state initially', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('returns user and session when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('returns null user when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('updates state on auth state change', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate auth state change
    const newUser = { id: 'user-456', email: 'new@example.com' };
    const newSession = { user: newUser, access_token: 'new-token' };

    act(() => {
      if (authStateCallback) {
        authStateCallback('SIGNED_IN', newSession);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(newUser);
    });

    expect(result.current.session).toEqual(newSession);
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('creates user account successfully', async () => {
    // Mock username check - username not taken
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSignUp.mockResolvedValue({
      data: { user: { id: 'new-user' }, session: null },
      error: null,
    });

    const { result } = renderHook(() => useSignUp(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User',
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          username: 'testuser',
          display_name: 'Test User',
        },
      },
    });
  });

  it('throws error when username is taken', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'existing-user' },
        error: null,
      }),
    });

    const { result } = renderHook(() => useSignUp(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          email: 'test@example.com',
          password: 'password123',
          username: 'takenuser',
        });
      })
    ).rejects.toThrow('Username is already taken');
  });

  it('propagates Supabase auth error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSignUp.mockResolvedValue({
      data: null,
      error: new Error('Email already registered'),
    });

    const { result } = renderHook(() => useSignUp(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          email: 'existing@example.com',
          password: 'password123',
          username: 'newuser',
        });
      })
    ).rejects.toThrow('Email already registered');
  });
});

describe('useSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('signs in user successfully', async () => {
    const mockSession = { user: { id: 'user-123' }, access_token: 'token' };
    mockSignInWithPassword.mockResolvedValue({
      data: mockSession,
      error: null,
    });

    const { result } = renderHook(() => useSignIn(), { wrapper: createWrapper() });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(response).toEqual(mockSession);
  });

  it('throws error for invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: new Error('Invalid login credentials'),
    });

    const { result } = renderHook(() => useSignIn(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
      })
    ).rejects.toThrow('Invalid login credentials');
  });
});

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('signs out successfully and clears cache', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useSignOut(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('throws error on sign out failure', async () => {
    mockSignOut.mockResolvedValue({
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync();
      })
    ).rejects.toThrow('Network error');
  });
});

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('sends password reset email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ email: 'test@example.com' });
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({})
    );
  });

  it('uses custom redirect URL when provided', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@example.com',
        redirectUrl: 'https://app.example.com/reset',
      });
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'https://app.example.com/reset',
    });
  });

  it('throws error for invalid email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: new Error('User not found'),
    });

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ email: 'nonexistent@example.com' });
      })
    ).rejects.toThrow('User not found');
  });
});

describe('useUpdatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('updates password successfully', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useUpdatePassword(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('newpassword123');
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newpassword123',
    });
  });

  it('throws error on update failure', async () => {
    mockUpdateUser.mockResolvedValue({
      error: new Error('Password too weak'),
    });

    const { result } = renderHook(() => useUpdatePassword(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync('weak');
      })
    ).rejects.toThrow('Password too weak');
  });
});

describe('useCheckUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('returns true when username is available', async () => {
    const mockEq = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { result } = renderHook(() => useCheckUsername(), { wrapper: createWrapper() });

    let isAvailable;
    await act(async () => {
      isAvailable = await result.current('availableuser');
    });

    expect(isAvailable).toBe(true);
    expect(mockEq).toHaveBeenCalledWith('username', 'availableuser');
  });

  it('returns false when username is taken', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'existing-user' },
        error: null,
      }),
    });

    const { result } = renderHook(() => useCheckUsername(), { wrapper: createWrapper() });

    let isAvailable;
    await act(async () => {
      isAvailable = await result.current('takenuser');
    });

    expect(isAvailable).toBe(false);
  });
});

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('returns undefined when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(undefined);
  });

  it('fetches profile when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };
    const mockProfile = {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
    };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const mockEq = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile);
    });

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('updates profile successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };
    const updatedProfile = {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Updated Name',
    };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    // Wait for auth to settle
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.mutateAsync({ display_name: 'Updated Name' });
    });

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Updated Name' });
  });
});
