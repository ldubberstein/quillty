import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted to define mocks
const { mockFrom, mockGetPatternApi, mockCreatePatternApi, mockUpdatePatternApi, mockPublishPatternApi } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetPatternApi: vi.fn(),
  mockCreatePatternApi: vi.fn(),
  mockUpdatePatternApi: vi.fn(),
  mockPublishPatternApi: vi.fn(),
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

// Mock the API functions
vi.mock('../api/patterns', () => ({
  getPatternApi: mockGetPatternApi,
  createPatternApi: mockCreatePatternApi,
  updatePatternApi: mockUpdatePatternApi,
  publishPatternApi: mockPublishPatternApi,
}));

import {
  usePattern,
  usePatternDirect,
  useCreatePattern,
  useUpdatePattern,
  usePublishPattern,
} from './usePattern';

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

describe('usePattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no patternId provided', async () => {
    const { result } = renderHook(() => usePattern(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.data).toBe(undefined);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches pattern with creator when patternId provided', async () => {
    const mockPattern = {
      id: 'pattern-123',
      title: 'My Quilt Pattern',
      description: 'A beautiful quilt',
      creator: {
        id: 'user-456',
        username: 'quilter',
        display_name: 'Quilter Jane',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };

    mockGetPatternApi.mockResolvedValue(mockPattern);

    const { result } = renderHook(() => usePattern('pattern-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPattern);
    });

    expect(mockGetPatternApi).toHaveBeenCalledWith('pattern-123');
  });

  it('handles pattern not found', async () => {
    mockGetPatternApi.mockRejectedValue(new Error('Pattern not found'));

    const { result } = renderHook(() => usePattern('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreatePattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates pattern successfully', async () => {
    const newPattern = {
      title: 'New Pattern',
      description: 'Description',
      creator_id: 'user-123',
      design_data: {},
    };

    const createdPattern = {
      id: 'pattern-new',
      ...newPattern,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: createdPattern, error: null }),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreatePattern(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync(newPattern);
    });

    expect(response).toEqual(createdPattern);
    expect(mockFrom).toHaveBeenCalledWith('quilt_patterns');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed'] });
  });

  it('handles creation error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Validation failed'),
      }),
    });

    const { result } = renderHook(() => useCreatePattern(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          title: '',
          description: 'Missing title',
          creator_id: 'user-123',
          design_data: {},
        });
      })
    ).rejects.toThrow('Validation failed');
  });
});

describe('useUpdatePattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates pattern successfully', async () => {
    const updatedPattern = {
      id: 'pattern-123',
      title: 'Updated Title',
      description: 'Updated description',
    };

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedPattern, error: null }),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdatePattern(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        id: 'pattern-123',
        title: 'Updated Title',
      });
    });

    expect(response).toEqual(updatedPattern);
    expect(mockFrom).toHaveBeenCalledWith('quilt_patterns');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pattern', 'pattern-123'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed'] });
  });

  it('handles update error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Pattern not found'),
      }),
    });

    const { result } = renderHook(() => useUpdatePattern(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'nonexistent',
          title: 'Updated',
        });
      })
    ).rejects.toThrow('Pattern not found');
  });

  it('uses API format for update with designData', async () => {
    const updatedPattern = { id: 'pattern-123', title: 'Updated' };
    mockUpdatePatternApi.mockResolvedValue(updatedPattern);

    const { result } = renderHook(() => useUpdatePattern(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'pattern-123',
        title: 'Updated',
        designData: {
          gridSize: { rows: 4, cols: 5 },
          blockInstances: [],
          palette: { roles: [] },
        },
      });
    });

    expect(mockUpdatePatternApi).toHaveBeenCalled();
  });
});

describe('usePatternDirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no patternId provided', async () => {
    const { result } = renderHook(() => usePatternDirect(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches pattern directly from Supabase', async () => {
    const mockPattern = {
      id: 'pattern-123',
      title: 'My Pattern',
      creator: { id: 'user-1', username: 'test' },
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPattern, error: null }),
    });

    const { result } = renderHook(() => usePatternDirect('pattern-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPattern);
    });

    expect(mockFrom).toHaveBeenCalledWith('quilt_patterns');
  });
});

describe('usePublishPattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes pattern with title update', async () => {
    const publishedPattern = { id: 'pattern-123', status: 'published_free' };
    mockUpdatePatternApi.mockResolvedValue({ id: 'pattern-123' });
    mockPublishPatternApi.mockResolvedValue(publishedPattern);

    const { result } = renderHook(() => usePublishPattern(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        id: 'pattern-123',
        title: 'Published Pattern',
        description: 'My description',
        publishInput: { type: 'free' },
      });
    });

    expect(response).toEqual(publishedPattern);
    expect(mockUpdatePatternApi).toHaveBeenCalledWith('pattern-123', {
      title: 'Published Pattern',
      description: 'My description',
    });
    expect(mockPublishPatternApi).toHaveBeenCalledWith('pattern-123', { type: 'free' });
  });

  it('publishes premium pattern with price', async () => {
    const publishedPattern = { id: 'pattern-123', status: 'published_premium' };
    mockUpdatePatternApi.mockResolvedValue({});
    mockPublishPatternApi.mockResolvedValue(publishedPattern);

    const { result } = renderHook(() => usePublishPattern(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'pattern-123',
        title: 'Premium Pattern',
        publishInput: { type: 'premium', priceCents: 999 },
      });
    });

    expect(mockPublishPatternApi).toHaveBeenCalledWith('pattern-123', {
      type: 'premium',
      priceCents: 999,
    });
  });

  it('publishes without update when no title', async () => {
    const publishedPattern = { id: 'pattern-123', status: 'published_free' };
    mockPublishPatternApi.mockResolvedValue(publishedPattern);

    const { result } = renderHook(() => usePublishPattern(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'pattern-123',
        title: '',
        publishInput: { type: 'free' },
      });
    });

    expect(mockUpdatePatternApi).not.toHaveBeenCalled();
    expect(mockPublishPatternApi).toHaveBeenCalledWith('pattern-123', { type: 'free' });
  });
});
