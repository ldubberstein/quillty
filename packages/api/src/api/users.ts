/**
 * User API Functions
 *
 * Typed functions for user-related API endpoints.
 */

import { apiClient } from '../http-client';

/** User profile returned from API */
export interface ApiUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_partner: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
  block_count: number;
  pattern_count: number;
  is_following?: boolean;
}

interface ApiResponse<T> {
  data: T;
}

/**
 * Get user profile by username via API
 * Uses Redis caching on the server (5 min TTL)
 */
export async function getUserProfileApi(username: string): Promise<ApiUserProfile> {
  const response = await apiClient.get<ApiResponse<ApiUserProfile>>(`/users/${username}`);
  return response.data;
}
