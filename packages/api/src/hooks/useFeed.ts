import { useInfiniteQuery } from '@tanstack/react-query';
import type { Pattern, Block, User } from '../types/models';
import { getFeedApi, type ApiFeedItem, type FeedType } from '../api/feed';

// Extended types that include creator info
export interface PatternWithCreator extends Pattern {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface BlockWithCreator extends Block {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export type FeedItem =
  | { type: 'pattern'; data: PatternWithCreator }
  | { type: 'block'; data: BlockWithCreator };

interface FeedOptions {
  type: FeedType;
  userId?: string;
}

/**
 * Fetch feed items via the API
 * Uses Redis caching on the server (60s for forYou, 30s for following)
 */
export function useFeed({ type, userId }: FeedOptions) {
  return useInfiniteQuery({
    queryKey: ['feed', type, userId],
    queryFn: async ({ pageParam = 0 }): Promise<FeedItem[]> => {
      const response = await getFeedApi({
        type,
        cursor: pageParam,
      });

      // Transform API response to local types
      return response.data.map((item: ApiFeedItem) => ({
        type: item.type,
        data: item.data as unknown as PatternWithCreator | BlockWithCreator,
      })) as FeedItem[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Return next cursor if we got a full page
      return lastPage.length === 20 ? lastPageParam + 1 : undefined;
    },
  });
}
