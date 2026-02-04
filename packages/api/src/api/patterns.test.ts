import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mocks
const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the http-client
vi.mock('../http-client', () => ({
  apiClient: mockApiClient,
}));

import {
  createPatternApi,
  getPatternApi,
  updatePatternApi,
  deletePatternApi,
  publishPatternApi,
  getMyPatternsApi,
  type CreatePatternApiInput,
  type UpdatePatternApiInput,
  type PublishPatternApiInput,
} from './patterns';

describe('patterns API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatternApi', () => {
    it('creates a pattern via POST /patterns', async () => {
      const input: CreatePatternApiInput = {
        title: 'My Pattern',
        description: 'A beautiful pattern',
        designData: {
          version: 1,
          gridSize: { rows: 4, cols: 5 },
          blockInstances: [],
          palette: {
            roles: [{ id: 'bg', name: 'Background', color: '#FFF' }],
          },
        },
        difficulty: 'beginner',
      };

      const mockPattern = {
        id: 'pattern-123',
        title: 'My Pattern',
        status: 'draft',
      };

      mockApiClient.post.mockResolvedValue({ data: mockPattern });

      const result = await createPatternApi(input);

      expect(mockApiClient.post).toHaveBeenCalledWith('/patterns', input);
      expect(result).toEqual(mockPattern);
    });

    it('handles optional fields', async () => {
      const input: CreatePatternApiInput = {
        title: 'Minimal Pattern',
        designData: {
          gridSize: { rows: 3, cols: 3 },
          blockInstances: [],
          palette: { roles: [] },
        },
      };

      mockApiClient.post.mockResolvedValue({ data: { id: 'p-1' } });

      await createPatternApi(input);

      expect(mockApiClient.post).toHaveBeenCalledWith('/patterns', input);
    });
  });

  describe('getPatternApi', () => {
    it('fetches a pattern by ID via GET /patterns/:id', async () => {
      const mockPatternWithCreator = {
        id: 'pattern-123',
        title: 'Test Pattern',
        creator: {
          id: 'user-456',
          username: 'quilter',
          display_name: 'Quilter Jane',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      mockApiClient.get.mockResolvedValue({ data: mockPatternWithCreator });

      const result = await getPatternApi('pattern-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/patterns/pattern-123');
      expect(result).toEqual(mockPatternWithCreator);
    });
  });

  describe('updatePatternApi', () => {
    it('updates a pattern via PATCH /patterns/:id', async () => {
      const input: UpdatePatternApiInput = {
        title: 'Updated Title',
        description: 'New description',
      };

      const mockUpdatedPattern = {
        id: 'pattern-123',
        title: 'Updated Title',
        description: 'New description',
      };

      mockApiClient.patch.mockResolvedValue({ data: mockUpdatedPattern });

      const result = await updatePatternApi('pattern-123', input);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/patterns/pattern-123', input);
      expect(result).toEqual(mockUpdatedPattern);
    });

    it('updates only specified fields', async () => {
      const input: UpdatePatternApiInput = {
        difficulty: 'advanced',
      };

      mockApiClient.patch.mockResolvedValue({ data: { id: 'p-1', difficulty: 'advanced' } });

      await updatePatternApi('p-1', input);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/patterns/p-1', input);
    });
  });

  describe('deletePatternApi', () => {
    it('deletes a pattern via DELETE /patterns/:id', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await deletePatternApi('pattern-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/patterns/pattern-123');
    });
  });

  describe('publishPatternApi', () => {
    it('publishes a free pattern via POST /patterns/:id/publish', async () => {
      const input: PublishPatternApiInput = {
        type: 'free',
      };

      const mockPublishedPattern = {
        id: 'pattern-123',
        status: 'published_free',
      };

      mockApiClient.post.mockResolvedValue({ data: mockPublishedPattern });

      const result = await publishPatternApi('pattern-123', input);

      expect(mockApiClient.post).toHaveBeenCalledWith('/patterns/pattern-123/publish', input);
      expect(result).toEqual(mockPublishedPattern);
    });

    it('publishes a premium pattern with price', async () => {
      const input: PublishPatternApiInput = {
        type: 'premium',
        priceCents: 999,
      };

      mockApiClient.post.mockResolvedValue({ data: { id: 'p-1', status: 'published_premium' } });

      await publishPatternApi('p-1', input);

      expect(mockApiClient.post).toHaveBeenCalledWith('/patterns/p-1/publish', input);
    });
  });

  describe('getMyPatternsApi', () => {
    it('fetches user patterns via GET /me/patterns', async () => {
      const mockResponse = {
        data: [{ id: 'p-1' }, { id: 'p-2' }],
        pagination: { total: 2, limit: 10, offset: 0, hasMore: false },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getMyPatternsApi();

      expect(mockApiClient.get).toHaveBeenCalledWith('/me/patterns');
      expect(result).toEqual(mockResponse);
    });

    it('adds status query param when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      await getMyPatternsApi({ status: 'draft' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/me/patterns?status=draft');
    });

    it('adds limit and offset query params when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      await getMyPatternsApi({ limit: 20, offset: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/me/patterns?limit=20&offset=10');
    });

    it('combines multiple query params', async () => {
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      await getMyPatternsApi({ status: 'published_free', limit: 5, offset: 15 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/me/patterns?status=published_free&limit=5&offset=15'
      );
    });
  });
});
