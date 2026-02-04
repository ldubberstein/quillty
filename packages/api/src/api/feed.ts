/**
 * Feed API Functions
 *
 * Typed functions for feed-related API endpoints.
 */

import { apiClient } from '../http-client';

/** Feed item types (raw API response) */
export interface ApiFeedItem {
  type: 'pattern' | 'block';
  data: Record<string, unknown>;
}

/** Feed response from API */
export interface FeedResponse {
  data: ApiFeedItem[];
  nextCursor: number | null;
  cached: boolean;
}

export type FeedType = 'forYou' | 'following';

interface GetFeedParams {
  type?: FeedType;
  cursor?: number;
}

/**
 * Get feed items via API
 * Supports forYou and following feed types with cursor-based pagination
 */
export async function getFeedApi(params: GetFeedParams = {}): Promise<FeedResponse> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.cursor !== undefined) searchParams.set('cursor', params.cursor.toString());

  const queryString = searchParams.toString();
  const url = queryString ? `/feed?${queryString}` : '/feed';

  return apiClient.get<FeedResponse>(url);
}
