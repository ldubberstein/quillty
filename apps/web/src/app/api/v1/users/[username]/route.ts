import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../_lib/supabase';
import { validateAuth } from '../../_lib/auth';
import { checkRateLimit } from '../../_lib/rate-limit';
import { internalError, notFound, rateLimited } from '../../_lib/errors';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '../../_lib/cache';

interface RouteParams {
  params: Promise<{ username: string }>;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_partner: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface UserProfileResponse extends UserProfile {
  is_following?: boolean;
  block_count: number;
  pattern_count: number;
}

/**
 * GET /api/v1/users/[username]
 * Get public profile for a user by username
 * Includes Redis caching (5 min TTL)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { username } = await params;

    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Check auth for is_following status
    const auth = await validateAuth(request);
    const currentUserId = auth.user?.id;

    // Try cache first (profile data without is_following)
    const cacheKey = CACHE_KEYS.user(username);
    const cached = await cacheGet<UserProfileResponse>(cacheKey);

    if (cached) {
      // Add is_following dynamically (not cached)
      let isFollowing: boolean | undefined;
      if (currentUserId && currentUserId !== cached.id) {
        isFollowing = await checkIsFollowing(currentUserId, cached.id);
      }

      return NextResponse.json(
        {
          data: {
            ...cached,
            is_following: isFollowing,
          },
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

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_partner,
        follower_count,
        following_count,
        created_at
      `
      )
      .eq('username', username)
      .single();

    if (userError || !user) {
      return notFound('User not found');
    }

    // Get counts for published content
    const [blocksResult, patternsResult] = await Promise.all([
      supabase
        .from('blocks')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'published'),
      supabase
        .from('quilt_patterns')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .in('status', ['published_free', 'published_premium']),
    ]);

    const profileData: UserProfileResponse = {
      ...user,
      block_count: blocksResult.count || 0,
      pattern_count: patternsResult.count || 0,
    };

    // Check if current user is following this profile
    let isFollowing: boolean | undefined;
    if (currentUserId && currentUserId !== user.id) {
      isFollowing = await checkIsFollowing(currentUserId, user.id);
    }

    // Cache the profile data (without is_following - that's user-specific)
    await cacheSet(cacheKey, profileData, { ttl: CACHE_TTL.user });

    return NextResponse.json(
      {
        data: {
          ...profileData,
          is_following: isFollowing,
        },
      },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/users/[username]:', error);
    return internalError('An unexpected error occurred');
  }
}

async function checkIsFollowing(
  followerId: string,
  followedId: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();

  return data !== null;
}
