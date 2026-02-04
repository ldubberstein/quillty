import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted to define mocks
const {
  mockFrom,
  mockGetBlockApi,
  mockCreateBlockApi,
  mockUpdateBlockApi,
  mockPublishBlockApi,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetBlockApi: vi.fn(),
  mockCreateBlockApi: vi.fn(),
  mockUpdateBlockApi: vi.fn(),
  mockPublishBlockApi: vi.fn(),
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
vi.mock('../api/blocks', () => ({
  getBlockApi: mockGetBlockApi,
  createBlockApi: mockCreateBlockApi,
  updateBlockApi: mockUpdateBlockApi,
  publishBlockApi: mockPublishBlockApi,
}));

import {
  useBlock,
  useCreateBlock,
  useUpdateBlock,
  useBlockLibrary,
  useMyDraftBlocks,
  usePublishBlock,
} from './useBlock';

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

describe('useBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no blockId provided', async () => {
    const { result } = renderHook(() => useBlock(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches block when blockId provided', async () => {
    const mockBlock = {
      id: 'block-123',
      name: 'Test Block',
      creator: { id: 'user-1', username: 'test' },
    };

    mockGetBlockApi.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useBlock('block-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockBlock);
    });

    expect(mockGetBlockApi).toHaveBeenCalledWith('block-123');
  });

  it('handles error when fetching block', async () => {
    mockGetBlockApi.mockRejectedValue(new Error('Block not found'));

    const { result } = renderHook(() => useBlock('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates block with API format input', async () => {
    const newBlock = { id: 'block-new', name: 'New Block' };
    mockCreateBlockApi.mockResolvedValue(newBlock);

    const { result } = renderHook(() => useCreateBlock(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        name: 'New Block',
        gridSize: 3,
        designData: { version: 1, shapes: [], previewPalette: { roles: [] } },
      });
    });

    expect(response).toEqual(newBlock);
    expect(mockCreateBlockApi).toHaveBeenCalled();
  });

  it('converts legacy format to API format', async () => {
    const newBlock = { id: 'block-new', name: 'Legacy Block' };
    mockCreateBlockApi.mockResolvedValue(newBlock);

    const { result } = renderHook(() => useCreateBlock(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Legacy Block',
        grid_size: 4,
        design_data: { version: 1, shapes: [] },
        creator_id: 'user-123',
      });
    });

    expect(mockCreateBlockApi).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Legacy Block',
        gridSize: 4,
      })
    );
  });
});

describe('useUpdateBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates block with API format input', async () => {
    const updatedBlock = { id: 'block-123', name: 'Updated' };
    mockUpdateBlockApi.mockResolvedValue(updatedBlock);

    const { result } = renderHook(() => useUpdateBlock(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        id: 'block-123',
        name: 'Updated',
        gridSize: 3,
      });
    });

    expect(response).toEqual(updatedBlock);
    expect(mockUpdateBlockApi).toHaveBeenCalledWith('block-123', expect.objectContaining({
      name: 'Updated',
      gridSize: 3,
    }));
  });

  it('converts legacy format to API format', async () => {
    const updatedBlock = { id: 'block-123', name: 'Legacy Updated' };
    mockUpdateBlockApi.mockResolvedValue(updatedBlock);

    const { result } = renderHook(() => useUpdateBlock(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'block-123',
        name: 'Legacy Updated',
        grid_size: 2,
      });
    });

    expect(mockUpdateBlockApi).toHaveBeenCalledWith('block-123', expect.objectContaining({
      name: 'Legacy Updated',
      gridSize: 2,
    }));
  });
});

describe('useBlockLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches published blocks', async () => {
    const mockBlocks = [
      { id: 'block-1', name: 'Block 1', status: 'published' },
      { id: 'block-2', name: 'Block 2', status: 'published' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockBlocks, error: null }),
    });

    const { result } = renderHook(() => useBlockLibrary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockBlocks);
    });

    expect(mockFrom).toHaveBeenCalledWith('blocks');
  });

  it('handles error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
    });

    const { result } = renderHook(() => useBlockLibrary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useMyDraftBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no userId', async () => {
    const { result } = renderHook(() => useMyDraftBlocks(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches draft blocks for user', async () => {
    const mockDrafts = [
      { id: 'draft-1', name: 'Draft 1', status: 'draft' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockDrafts, error: null }),
    });

    const { result } = renderHook(() => useMyDraftBlocks('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockDrafts);
    });
  });
});

describe('usePublishBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes block with name update', async () => {
    const publishedBlock = { id: 'block-123', name: 'Published Block', status: 'published' };
    mockUpdateBlockApi.mockResolvedValue({ id: 'block-123', name: 'Published Block' });
    mockPublishBlockApi.mockResolvedValue(publishedBlock);

    const { result } = renderHook(() => usePublishBlock(), {
      wrapper: createWrapper(),
    });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        id: 'block-123',
        name: 'Published Block',
        description: 'My description',
      });
    });

    expect(response).toEqual(publishedBlock);
    expect(mockUpdateBlockApi).toHaveBeenCalledWith('block-123', {
      name: 'Published Block',
      description: 'My description',
    });
    expect(mockPublishBlockApi).toHaveBeenCalledWith('block-123');
  });

  it('publishes without update when no name/description', async () => {
    const publishedBlock = { id: 'block-123', status: 'published' };
    mockPublishBlockApi.mockResolvedValue(publishedBlock);

    const { result } = renderHook(() => usePublishBlock(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'block-123',
        name: '',
      });
    });

    expect(mockUpdateBlockApi).not.toHaveBeenCalled();
    expect(mockPublishBlockApi).toHaveBeenCalledWith('block-123');
  });
});
