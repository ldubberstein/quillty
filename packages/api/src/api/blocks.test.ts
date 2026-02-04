import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock the http-client
vi.mock('../http-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import {
  createBlockApi,
  getBlockApi,
  updateBlockApi,
  deleteBlockApi,
  publishBlockApi,
  type CreateBlockApiInput,
  type UpdateBlockApiInput,
} from './blocks';

describe('Block API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBlock = {
    id: 'block-123',
    creator_id: 'user-123',
    name: 'Test Block',
    description: 'A test block',
    thumbnail_url: null,
    is_platform_block: false,
    grid_size: 3,
    design_data: {
      version: 1,
      shapes: [],
      previewPalette: { roles: [] },
    },
    difficulty: 'beginner' as const,
    piece_count: 0,
    like_count: 0,
    save_count: 0,
    comment_count: 0,
    usage_count: 0,
    status: 'draft' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    published_at: null,
  };

  const validInput: CreateBlockApiInput = {
    name: 'New Block',
    gridSize: 3,
    designData: {
      version: 1,
      shapes: [],
      previewPalette: {
        roles: [
          { id: 'background', name: 'Background', color: '#FFFFFF' },
        ],
      },
    },
  };

  describe('createBlockApi', () => {
    it('should call POST /blocks with input', async () => {
      mockPost.mockResolvedValueOnce({ data: mockBlock });

      const result = await createBlockApi(validInput);

      expect(mockPost).toHaveBeenCalledWith('/blocks', validInput);
      expect(result).toEqual(mockBlock);
    });

    it('should pass optional fields', async () => {
      const inputWithOptionals: CreateBlockApiInput = {
        ...validInput,
        description: 'Test description',
        difficulty: 'advanced',
        thumbnailUrl: 'https://example.com/thumb.png',
      };

      mockPost.mockResolvedValueOnce({ data: mockBlock });

      await createBlockApi(inputWithOptionals);

      expect(mockPost).toHaveBeenCalledWith('/blocks', inputWithOptionals);
    });
  });

  describe('getBlockApi', () => {
    it('should call GET /blocks/:id', async () => {
      const blockWithCreator = {
        ...mockBlock,
        creator: {
          id: 'user-123',
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: null,
        },
      };

      mockGet.mockResolvedValueOnce({ data: blockWithCreator });

      const result = await getBlockApi('block-123');

      expect(mockGet).toHaveBeenCalledWith('/blocks/block-123');
      expect(result).toEqual(blockWithCreator);
      expect(result.creator?.username).toBe('testuser');
    });
  });

  describe('updateBlockApi', () => {
    it('should call PATCH /blocks/:id with updates', async () => {
      const updates: UpdateBlockApiInput = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      mockPatch.mockResolvedValueOnce({ data: { ...mockBlock, ...updates } });

      const result = await updateBlockApi('block-123', updates);

      expect(mockPatch).toHaveBeenCalledWith('/blocks/block-123', updates);
      expect(result.name).toBe('Updated Name');
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateBlockApiInput = {
        gridSize: 4,
      };

      mockPatch.mockResolvedValueOnce({
        data: { ...mockBlock, grid_size: 4 },
      });

      await updateBlockApi('block-123', partialUpdate);

      expect(mockPatch).toHaveBeenCalledWith('/blocks/block-123', partialUpdate);
    });
  });

  describe('deleteBlockApi', () => {
    it('should call DELETE /blocks/:id', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteBlockApi('block-123');

      expect(mockDelete).toHaveBeenCalledWith('/blocks/block-123');
    });

    it('should return void', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      const result = await deleteBlockApi('block-123');

      expect(result).toBeUndefined();
    });
  });

  describe('publishBlockApi', () => {
    it('should call POST /blocks/:id/publish', async () => {
      const publishedBlock = {
        ...mockBlock,
        status: 'published' as const,
        published_at: '2024-01-02T00:00:00Z',
      };

      mockPost.mockResolvedValueOnce({ data: publishedBlock });

      const result = await publishBlockApi('block-123');

      expect(mockPost).toHaveBeenCalledWith('/blocks/block-123/publish');
      expect(result.status).toBe('published');
      expect(result.published_at).toBe('2024-01-02T00:00:00Z');
    });
  });
});
