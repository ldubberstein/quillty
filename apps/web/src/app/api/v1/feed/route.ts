import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../_lib/supabase';
import { validateAuth } from '../_lib/auth';
import { checkRateLimit } from '../_lib/rate-limit';
import { badRequest, internalError, rateLimited } from '../_lib/errors';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '../_lib/cache';

const PAGE_SIZE = 20;

interface FeedItem {
  type: 'pattern' | 'block';
  data: Record<string, unknown>;
}

/**
 * GET /api/v1/feed
 * Get feed items (forYou or following)
 *
 * Query params:
 * - type: 'forYou' | 'following' (default: forYou)
 * - cursor: pagination cursor (page number, default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get('type') || 'forYou';
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);

    if (feedType !== 'forYou' && feedType !== 'following') {
      return badRequest('Invalid feed type. Must be "forYou" or "following"');
    }

    if (isNaN(cursor) || cursor < 0) {
      return badRequest('Invalid cursor. Must be a non-negative integer');
    }

    // Get auth for following feed
    const auth = await validateAuth(request);
    const userId = auth.user?.id;

    // Following feed requires authentication
    if (feedType === 'following' && !userId) {
      return badRequest('Following feed requires authentication');
    }

    // Try cache first
    const cacheKey =
      feedType === 'forYou'
        ? CACHE_KEYS.feed.forYou(cursor.toString())
        : CACHE_KEYS.feed.following(userId!, cursor.toString());

    const cached = await cacheGet<FeedItem[]>(cacheKey);
    if (cached) {
      return NextResponse.json(
        {
          data: cached,
          nextCursor: cached.length === PAGE_SIZE ? cursor + 1 : null,
          cached: true,
        },
        {
          headers: {
            ...rateLimit.headers,
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Fetch from database
    const supabase = createServiceClient();
    let feedItems: FeedItem[];

    if (feedType === 'following' && userId) {
      feedItems = await fetchFollowingFeed(supabase, userId, cursor);
    } else {
      feedItems = await fetchForYouFeed(supabase, cursor);
    }

    // Cache the results
    const ttl =
      feedType === 'forYou' ? CACHE_TTL.feed.forYou : CACHE_TTL.feed.following;
    await cacheSet(cacheKey, feedItems, { ttl });

    return NextResponse.json(
      {
        data: feedItems,
        nextCursor: feedItems.length === PAGE_SIZE ? cursor + 1 : null,
        cached: false,
      },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/feed:', error);
    return internalError('An unexpected error occurred');
  }
}

async function fetchForYouFeed(
  supabase: ReturnType<typeof createServiceClient>,
  cursor: number
): Promise<FeedItem[]> {
  // Fetch patterns and blocks in parallel
  const [patternsResult, blocksResult] = await Promise.all([
    supabase
      .from('quilt_patterns')
      .select(
        `
        id,
        creator_id,
        title,
        description,
        thumbnail_url,
        status,
        price_cents,
        difficulty,
        like_count,
        save_count,
        comment_count,
        published_at,
        created_at,
        creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .in('status', ['published_free', 'published_premium'])
      .order('published_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1),
    supabase
      .from('blocks')
      .select(
        `
        id,
        creator_id,
        name,
        description,
        thumbnail_url,
        grid_size,
        difficulty,
        piece_count,
        like_count,
        save_count,
        comment_count,
        published_at,
        created_at,
        creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1),
  ]);

  if (patternsResult.error) throw patternsResult.error;
  if (blocksResult.error) throw blocksResult.error;

  return combineAndSort(patternsResult.data || [], blocksResult.data || []);
}

async function fetchFollowingFeed(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  cursor: number
): Promise<FeedItem[]> {
  // Get followed users
  const { data: followedUsers, error: followError } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', userId);

  if (followError) throw followError;

  const followedIds = (followedUsers || []).map((f) => f.followed_id);

  if (followedIds.length === 0) {
    return [];
  }

  // Fetch patterns and blocks from followed users
  const [patternsResult, blocksResult] = await Promise.all([
    supabase
      .from('quilt_patterns')
      .select(
        `
        id,
        creator_id,
        title,
        description,
        thumbnail_url,
        status,
        price_cents,
        difficulty,
        like_count,
        save_count,
        comment_count,
        published_at,
        created_at,
        creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .in('status', ['published_free', 'published_premium'])
      .in('creator_id', followedIds)
      .order('published_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1),
    supabase
      .from('blocks')
      .select(
        `
        id,
        creator_id,
        name,
        description,
        thumbnail_url,
        grid_size,
        difficulty,
        piece_count,
        like_count,
        save_count,
        comment_count,
        published_at,
        created_at,
        creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .eq('status', 'published')
      .in('creator_id', followedIds)
      .order('published_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1),
  ]);

  if (patternsResult.error) throw patternsResult.error;
  if (blocksResult.error) throw blocksResult.error;

  return combineAndSort(patternsResult.data || [], blocksResult.data || []);
}

function combineAndSort(
  patterns: Record<string, unknown>[],
  blocks: Record<string, unknown>[]
): FeedItem[] {
  const feedItems: FeedItem[] = [
    ...patterns.map((p) => ({ type: 'pattern' as const, data: p })),
    ...blocks.map((b) => ({ type: 'block' as const, data: b })),
  ].sort((a, b) => {
    const aDate =
      (a.data.published_at as string) || (a.data.created_at as string);
    const bDate =
      (b.data.published_at as string) || (b.data.created_at as string);
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return feedItems;
}
