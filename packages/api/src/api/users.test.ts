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

import { getUserProfileApi, type ApiUserProfile } from './users';

describe('User API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserProfile: ApiUserProfile = {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
    bio: 'A test user bio',
    is_partner: false,
    follower_count: 100,
    following_count: 50,
    created_at: '2024-01-01T00:00:00Z',
    block_count: 10,
    pattern_count: 5,
    is_following: false,
  };

  describe('getUserProfileApi', () => {
    it('should call GET /users/:username', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUserProfile });

      const result = await getUserProfileApi('testuser');

      expect(mockGet).toHaveBeenCalledWith('/users/testuser');
      expect(result).toEqual(mockUserProfile);
    });

    it('should return user profile data', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUserProfile });

      const result = await getUserProfileApi('testuser');

      expect(result.id).toBe('user-123');
      expect(result.username).toBe('testuser');
      expect(result.display_name).toBe('Test User');
    });

    it('should include follower/following counts', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUserProfile });

      const result = await getUserProfileApi('testuser');

      expect(result.follower_count).toBe(100);
      expect(result.following_count).toBe(50);
    });

    it('should include content counts', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUserProfile });

      const result = await getUserProfileApi('testuser');

      expect(result.block_count).toBe(10);
      expect(result.pattern_count).toBe(5);
    });

    it('should include is_following status', async () => {
      mockGet.mockResolvedValueOnce({ data: { ...mockUserProfile, is_following: true } });

      const result = await getUserProfileApi('testuser');

      expect(result.is_following).toBe(true);
    });

    it('should handle partner users', async () => {
      mockGet.mockResolvedValueOnce({ data: { ...mockUserProfile, is_partner: true } });

      const result = await getUserProfileApi('testuser');

      expect(result.is_partner).toBe(true);
    });

    it('should handle usernames with special characters', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUserProfile });

      await getUserProfileApi('user_123');

      expect(mockGet).toHaveBeenCalledWith('/users/user_123');
    });
  });
});
