import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Pattern, Block, User } from '../types/models';

const PAGE_SIZE = 20;

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
  type: 'forYou' | 'following';
  userId?: string;
}

export function useFeed({ type, userId }: FeedOptions) {
  return useInfiniteQuery({
    queryKey: ['feed', type, userId],
    queryFn: async ({ pageParam = 0 }): Promise<FeedItem[]> => {
      // Fetch patterns with creator info
      const patternsQuery = supabase
        .from('quilt_patterns')
        .select(`
          *,
          creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
        `)
        .in('status', ['published_free', 'published_premium'])
        .order('published_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      // Fetch blocks with creator info
      const blocksQuery = supabase
        .from('blocks')
        .select(`
          *,
          creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      // If following feed, filter by followed users
      if (type === 'following' && userId) {
        const { data: followedUsers } = await supabase
          .from('follows')
          .select('followed_id')
          .eq('follower_id', userId);

        const followedIds = (followedUsers || []).map(f => f.followed_id);

        if (followedIds.length > 0) {
          // Filter both queries by followed users
          const [patternsResult, blocksResult] = await Promise.all([
            supabase
              .from('quilt_patterns')
              .select(`
                *,
                creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
              `)
              .in('status', ['published_free', 'published_premium'])
              .in('creator_id', followedIds)
              .order('published_at', { ascending: false })
              .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1),
            supabase
              .from('blocks')
              .select(`
                *,
                creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
              `)
              .eq('status', 'published')
              .in('creator_id', followedIds)
              .order('published_at', { ascending: false })
              .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1),
          ]);

          if (patternsResult.error) throw patternsResult.error;
          if (blocksResult.error) throw blocksResult.error;

          return combineAndSort(
            (patternsResult.data || []) as unknown as PatternWithCreator[],
            (blocksResult.data || []) as unknown as BlockWithCreator[]
          );
        }

        return []; // No followed users
      }

      const [patternsResult, blocksResult] = await Promise.all([
        patternsQuery,
        blocksQuery,
      ]);

      if (patternsResult.error) throw patternsResult.error;
      if (blocksResult.error) throw blocksResult.error;

      return combineAndSort(
        (patternsResult.data || []) as unknown as PatternWithCreator[],
        (blocksResult.data || []) as unknown as BlockWithCreator[]
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
  });
}

function combineAndSort(patterns: PatternWithCreator[], blocks: BlockWithCreator[]): FeedItem[] {
  const feedItems: FeedItem[] = [
    ...patterns.map((p) => ({ type: 'pattern' as const, data: p })),
    ...blocks.map((b) => ({ type: 'block' as const, data: b })),
  ].sort((a, b) => {
    const aDate = a.data.published_at || a.data.created_at;
    const bDate = b.data.published_at || b.data.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return feedItems;
}
