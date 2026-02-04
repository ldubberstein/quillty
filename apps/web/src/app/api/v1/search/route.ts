import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../_lib/supabase';
import { checkRateLimit } from '../_lib/rate-limit';
import { badRequest, internalError, rateLimited } from '../_lib/errors';
import { cacheGet, cacheSet, CACHE_TTL } from '../_lib/cache';

const PAGE_SIZE = 20;

type SearchType = 'blocks' | 'patterns' | 'users' | 'all';

interface SearchResult {
  blocks?: Array<{
    id: string;
    name: string;
    description: string | null;
    thumbnail_url: string | null;
    creator: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    like_count: number;
    published_at: string | null;
  }>;
  patterns?: Array<{
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    status: string;
    price_cents: number | null;
    creator: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    like_count: number;
    published_at: string | null;
  }>;
  users?: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    follower_count: number;
  }>;
}

/**
 * GET /api/v1/search
 * Search blocks, patterns, and users
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - type: 'blocks' | 'patterns' | 'users' | 'all' (default: 'all')
 *   - cursor: pagination cursor (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting (search tier: 30/min)
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const type = (searchParams.get('type') || 'all') as SearchType;
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);

    // Validate query
    if (query.length < 2) {
      return badRequest('Search query must be at least 2 characters');
    }

    if (query.length > 100) {
      return badRequest('Search query is too long');
    }

    if (!['blocks', 'patterns', 'users', 'all'].includes(type)) {
      return badRequest('Invalid search type');
    }

    if (isNaN(cursor) || cursor < 0) {
      return badRequest('Invalid cursor');
    }

    // Try cache first
    const cacheKey = `search:${type}:${query.toLowerCase()}:${cursor}`;
    const cached = await cacheGet<SearchResult>(cacheKey);

    if (cached) {
      return NextResponse.json(
        { data: cached, nextCursor: hasMoreResults(cached) ? cursor + 1 : null },
        {
          headers: {
            ...rateLimit.headers,
            'X-Cache': 'HIT',
          },
        }
      );
    }

    const supabase = createServiceClient();
    const result: SearchResult = {};

    // Search blocks
    if (type === 'blocks' || type === 'all') {
      const { data: blocks, error: blocksError } = await supabase
        .from('blocks')
        .select(
          `
          id,
          name,
          description,
          thumbnail_url,
          like_count,
          published_at,
          creator:users!blocks_creator_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq('status', 'published')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('like_count', { ascending: false })
        .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

      if (blocksError) {
        console.error('Error searching blocks:', blocksError);
      } else {
        result.blocks = blocks as SearchResult['blocks'];
      }
    }

    // Search patterns
    if (type === 'patterns' || type === 'all') {
      const { data: patterns, error: patternsError } = await supabase
        .from('quilt_patterns')
        .select(
          `
          id,
          title,
          description,
          thumbnail_url,
          status,
          price_cents,
          like_count,
          published_at,
          creator:users!quilt_patterns_creator_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .in('status', ['published_free', 'published_premium'])
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('like_count', { ascending: false })
        .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

      if (patternsError) {
        console.error('Error searching patterns:', patternsError);
      } else {
        result.patterns = patterns as SearchResult['patterns'];
      }
    }

    // Search users
    if (type === 'users' || type === 'all') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          display_name,
          avatar_url,
          bio,
          follower_count
        `
        )
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('follower_count', { ascending: false })
        .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

      if (usersError) {
        console.error('Error searching users:', usersError);
      } else {
        result.users = users as SearchResult['users'];
      }
    }

    // Cache the result (shorter TTL for search: 2 min)
    await cacheSet(cacheKey, result, { ttl: CACHE_TTL.search });

    return NextResponse.json(
      { data: result, nextCursor: hasMoreResults(result) ? cursor + 1 : null },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/search:', error);
    return internalError('An unexpected error occurred');
  }
}

function hasMoreResults(result: SearchResult): boolean {
  return (
    (result.blocks?.length === PAGE_SIZE) ||
    (result.patterns?.length === PAGE_SIZE) ||
    (result.users?.length === PAGE_SIZE)
  );
}
