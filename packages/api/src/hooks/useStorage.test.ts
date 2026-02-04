import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Use vi.hoisted for mocks
const { mockFrom, mockStorage, mockUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockStorage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' },
      }),
    }),
  },
  mockUser: { id: 'user-123' },
}));

// Mock Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: mockFrom,
    storage: mockStorage,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({ user: mockUser }),
}));

import {
  useUploadAvatar,
  useUploadPatternThumbnail,
  useUploadBlockThumbnail,
} from './useStorage';

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

describe('useUploadAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      }),
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('uploads avatar and updates user profile', async () => {
    const mockFile = new File(['test'], 'avatar.png', { type: 'image/png' });

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(),
    });

    let avatarUrl;
    await act(async () => {
      avatarUrl = await result.current.mutateAsync(mockFile);
    });

    expect(avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(mockStorage.from).toHaveBeenCalledWith('avatars');
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('handles Blob without name', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(mockBlob);
    });

    expect(mockStorage.from).toHaveBeenCalledWith('avatars');
  });

  it('throws error when upload fails', async () => {
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
      getPublicUrl: vi.fn(),
    });

    const mockFile = new File(['test'], 'avatar.png', { type: 'image/png' });

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync(mockFile);
      })
    ).rejects.toThrow('Upload failed');
  });
});

describe('useUploadPatternThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/pattern-thumb.jpg' },
      }),
    });
  });

  it('uploads pattern thumbnail', async () => {
    const mockFile = new File(['test'], 'thumbnail.png', { type: 'image/png' });

    const { result } = renderHook(() => useUploadPatternThumbnail(), {
      wrapper: createWrapper(),
    });

    let url;
    await act(async () => {
      url = await result.current.mutateAsync({
        patternId: 'pattern-123',
        file: mockFile,
      });
    });

    expect(url).toBe('https://example.com/pattern-thumb.jpg');
    expect(mockStorage.from).toHaveBeenCalledWith('pattern-thumbnails');
  });

  it('handles Blob without name', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadPatternThumbnail(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        patternId: 'pattern-123',
        file: mockBlob,
      });
    });

    expect(mockStorage.from).toHaveBeenCalledWith('pattern-thumbnails');
  });
});

describe('useUploadBlockThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/block-thumb.jpg' },
      }),
    });
  });

  it('uploads block thumbnail', async () => {
    const mockFile = new File(['test'], 'thumbnail.png', { type: 'image/png' });

    const { result } = renderHook(() => useUploadBlockThumbnail(), {
      wrapper: createWrapper(),
    });

    let url;
    await act(async () => {
      url = await result.current.mutateAsync({
        blockId: 'block-123',
        file: mockFile,
      });
    });

    expect(url).toBe('https://example.com/block-thumb.jpg');
    expect(mockStorage.from).toHaveBeenCalledWith('block-thumbnails');
  });

  it('throws error when upload fails', async () => {
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('Storage error') }),
      getPublicUrl: vi.fn(),
    });

    const mockFile = new File(['test'], 'thumbnail.png', { type: 'image/png' });

    const { result } = renderHook(() => useUploadBlockThumbnail(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          blockId: 'block-123',
          file: mockFile,
        });
      })
    ).rejects.toThrow('Storage error');
  });
});
