/**
 * Block API Functions
 *
 * Typed functions for block-related API endpoints.
 */

import { apiClient } from '../http-client';
import type { Block } from '../types/models';

/** Block with creator info returned from API */
export interface ApiBlockWithCreator extends Block {
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Input for creating a block via API */
export interface CreateBlockApiInput {
  name: string;
  description?: string | null;
  gridSize: 2 | 3 | 4;
  designData: {
    version?: 1;
    shapes: unknown[];
    previewPalette: {
      roles: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    };
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string | null;
}

/** Input for updating a block via API */
export interface UpdateBlockApiInput {
  name?: string;
  description?: string | null;
  gridSize?: 2 | 3 | 4;
  designData?: CreateBlockApiInput['designData'];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string | null;
}

interface ApiResponse<T> {
  data: T;
}

/**
 * Create a new block via API
 */
export async function createBlockApi(input: CreateBlockApiInput): Promise<Block> {
  const response = await apiClient.post<ApiResponse<Block>>('/blocks', input);
  return response.data;
}

/**
 * Get a block by ID via API
 */
export async function getBlockApi(id: string): Promise<ApiBlockWithCreator> {
  const response = await apiClient.get<ApiResponse<ApiBlockWithCreator>>(`/blocks/${id}`);
  return response.data;
}

/**
 * Update a block via API
 */
export async function updateBlockApi(id: string, input: UpdateBlockApiInput): Promise<Block> {
  const response = await apiClient.patch<ApiResponse<Block>>(`/blocks/${id}`, input);
  return response.data;
}

/**
 * Delete a block via API (draft only)
 */
export async function deleteBlockApi(id: string): Promise<void> {
  await apiClient.delete<void>(`/blocks/${id}`);
}

/**
 * Publish a block via API
 */
export async function publishBlockApi(id: string): Promise<Block> {
  const response = await apiClient.post<ApiResponse<Block>>(`/blocks/${id}/publish`);
  return response.data;
}
