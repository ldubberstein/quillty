import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

// Mock the http-client
vi.mock('../http-client', () => ({
  apiClient: {
    get: mockGet,
  },
}));

import { getFeedApi, type FeedResponse } from './feed';

describe('Feed API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFeedResponse: FeedResponse = {
    data: [
      { type: 'block', data: { id: 'block-1', name: 'Test Block' } },
      { type: 'pattern', data: { id: 'pattern-1', title: 'Test Pattern' } },
    ],
    nextCursor: 1,
    cached: false,
  };

  describe('getFeedApi', () => {
    it('should call GET /feed with no params by default', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      const result = await getFeedApi();

      expect(mockGet).toHaveBeenCalledWith('/feed');
      expect(result).toEqual(mockFeedResponse);
    });

    it('should include type param when specified', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      await getFeedApi({ type: 'forYou' });

      expect(mockGet).toHaveBeenCalledWith('/feed?type=forYou');
    });

    it('should include cursor param when specified', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      await getFeedApi({ cursor: 2 });

      expect(mockGet).toHaveBeenCalledWith('/feed?cursor=2');
    });

    it('should include both type and cursor params', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      await getFeedApi({ type: 'following', cursor: 3 });

      expect(mockGet).toHaveBeenCalledWith('/feed?type=following&cursor=3');
    });

    it('should handle cursor value of 0', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      await getFeedApi({ cursor: 0 });

      expect(mockGet).toHaveBeenCalledWith('/feed?cursor=0');
    });

    it('should return feed items', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      const result = await getFeedApi({ type: 'forYou' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe('block');
      expect(result.data[1].type).toBe('pattern');
    });

    it('should return nextCursor for pagination', async () => {
      mockGet.mockResolvedValueOnce(mockFeedResponse);

      const result = await getFeedApi();

      expect(result.nextCursor).toBe(1);
    });

    it('should return null nextCursor when no more pages', async () => {
      mockGet.mockResolvedValueOnce({
        ...mockFeedResponse,
        nextCursor: null,
      });

      const result = await getFeedApi();

      expect(result.nextCursor).toBeNull();
    });

    it('should indicate cache status', async () => {
      mockGet.mockResolvedValueOnce({
        ...mockFeedResponse,
        cached: true,
      });

      const result = await getFeedApi();

      expect(result.cached).toBe(true);
    });
  });
});
