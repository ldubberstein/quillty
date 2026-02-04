import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted for mocks
const { mockGetMyBlocksApi } = vi.hoisted(() => ({
  mockGetMyBlocksApi: vi.fn(),
}));

// Mock API functions
vi.mock('../api/blocks', () => ({
  getMyBlocksApi: mockGetMyBlocksApi,
}));

import { useMyBlocks, useMyPublishedBlocks, useMyDraftBlocks } from './useMyBlocks';

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

describe('useMyBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches blocks with default options', async () => {
    const mockResponse = {
      data: [{ id: 'block-1' }, { id: 'block-2' }],
      pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
    };

    mockGetMyBlocksApi.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMyBlocks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
      status: undefined,
      limit: 50,
      offset: 0,
    });
  });

  it('fetches blocks with custom options', async () => {
    const mockResponse = {
      data: [{ id: 'block-1' }],
      pagination: { total: 1, limit: 10, offset: 5, hasMore: false },
    };

    mockGetMyBlocksApi.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useMyBlocks({ status: 'published', limit: 10, offset: 5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
      status: 'published',
      limit: 10,
      offset: 5,
    });
  });

  it('does not retry on 401 errors', async () => {
    const authError = new Error('401 Unauthorized');
    mockGetMyBlocksApi.mockRejectedValue(authError);

    const { result } = renderHook(() => useMyBlocks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should only be called once (no retry)
    expect(mockGetMyBlocksApi).toHaveBeenCalledTimes(1);
  });
});

describe('useMyPublishedBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches published blocks with default limit', async () => {
    const mockResponse = {
      data: [{ id: 'block-1', status: 'published' }],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    };

    mockGetMyBlocksApi.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMyPublishedBlocks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
      status: 'published',
      limit: 50,
      offset: 0,
    });
  });

  it('fetches published blocks with custom limit', async () => {
    mockGetMyBlocksApi.mockResolvedValue({ data: [], pagination: {} });

    renderHook(() => useMyPublishedBlocks(20), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
        status: 'published',
        limit: 20,
        offset: 0,
      });
    });
  });
});

describe('useMyDraftBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches draft blocks with default limit', async () => {
    const mockResponse = {
      data: [{ id: 'draft-1', status: 'draft' }],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    };

    mockGetMyBlocksApi.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMyDraftBlocks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
      status: 'draft',
      limit: 50,
      offset: 0,
    });
  });

  it('fetches draft blocks with custom limit', async () => {
    mockGetMyBlocksApi.mockResolvedValue({ data: [], pagination: {} });

    renderHook(() => useMyDraftBlocks(10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockGetMyBlocksApi).toHaveBeenCalledWith({
        status: 'draft',
        limit: 10,
        offset: 0,
      });
    });
  });
});
