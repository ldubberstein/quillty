import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../_lib/supabase';
import { requireAuth } from '../../_lib/auth';
import { checkRateLimit } from '../../_lib/rate-limit';
import { internalError, rateLimited } from '../../_lib/errors';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '../../_lib/cache';

/**
 * GET /api/v1/notifications/count
 * Get unread notification count (auth required)
 * Uses Redis caching (1 min TTL)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    // Try cache first
    const cacheKey = CACHE_KEYS.notifications.unreadCount(user.id);
    const cached = await cacheGet<number>(cacheKey);

    if (cached !== null) {
      return NextResponse.json(
        { data: { count: cached } },
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
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error fetching notification count:', error);
      return internalError('Failed to fetch notification count');
    }

    const unreadCount = count || 0;

    // Cache the count
    await cacheSet(cacheKey, unreadCount, { ttl: CACHE_TTL.notifications });

    return NextResponse.json(
      { data: { count: unreadCount } },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    // Handle AuthError from requireAuth
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('Unexpected error in GET /api/v1/notifications/count:', error);
    return internalError('An unexpected error occurred');
  }
}
