/**
 * Pattern API Functions
 *
 * Typed functions for pattern-related API endpoints.
 */

import { apiClient } from '../http-client';
import type { Pattern } from '../types/models';

/** Pattern with creator info returned from API */
export interface ApiPatternWithCreator extends Pattern {
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Input for creating a pattern via API */
export interface CreatePatternApiInput {
  title: string;
  description?: string | null;
  designData: {
    version?: 1;
    gridSize: { rows: number; cols: number };
    blockInstances: unknown[];
    palette: {
      roles: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    };
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string | null;
  size?: string | null;
  thumbnailUrl?: string | null;
}

/** Input for updating a pattern via API */
export interface UpdatePatternApiInput {
  title?: string;
  description?: string | null;
  designData?: CreatePatternApiInput['designData'];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string | null;
  size?: string | null;
  thumbnailUrl?: string | null;
}

/** Input for publishing a pattern via API */
export interface PublishPatternApiInput {
  type: 'free' | 'premium';
  priceCents?: number;
}

interface ApiResponse<T> {
  data: T;
}

/**
 * Create a new pattern via API
 */
export async function createPatternApi(input: CreatePatternApiInput): Promise<Pattern> {
  const response = await apiClient.post<ApiResponse<Pattern>>('/patterns', input);
  return response.data;
}

/**
 * Get a pattern by ID via API
 */
export async function getPatternApi(id: string): Promise<ApiPatternWithCreator> {
  const response = await apiClient.get<ApiResponse<ApiPatternWithCreator>>(`/patterns/${id}`);
  return response.data;
}

/**
 * Update a pattern via API
 */
export async function updatePatternApi(id: string, input: UpdatePatternApiInput): Promise<Pattern> {
  const response = await apiClient.patch<ApiResponse<Pattern>>(`/patterns/${id}`, input);
  return response.data;
}

/**
 * Delete a pattern via API (draft only)
 */
export async function deletePatternApi(id: string): Promise<void> {
  await apiClient.delete<void>(`/patterns/${id}`);
}

/**
 * Publish a pattern via API
 */
export async function publishPatternApi(id: string, input: PublishPatternApiInput): Promise<Pattern> {
  const response = await apiClient.post<ApiResponse<Pattern>>(`/patterns/${id}/publish`, input);
  return response.data;
}

/** Response for paginated pattern list */
export interface PatternListResponse {
  data: Pattern[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/** Options for fetching user patterns */
export interface GetMyPatternsOptions {
  status?: 'published_free' | 'published_premium' | 'draft';
  limit?: number;
  offset?: number;
}

/**
 * Get current user's patterns via API
 * Requires authentication
 */
export async function getMyPatternsApi(options: GetMyPatternsOptions = {}): Promise<PatternListResponse> {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  const url = queryString ? `/me/patterns?${queryString}` : '/me/patterns';

  return apiClient.get<PatternListResponse>(url);
}
