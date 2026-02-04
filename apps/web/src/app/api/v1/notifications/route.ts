import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../_lib/supabase';
import { requireAuth } from '../_lib/auth';
import { checkRateLimit } from '../_lib/rate-limit';
import { internalError, rateLimited } from '../_lib/errors';

const PAGE_SIZE = 20;

interface NotificationWithDetails {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'purchase' | 'payout';
  read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  pattern: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
  block: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  } | null;
}

/**
 * GET /api/v1/notifications
 * Get notifications for the current user (auth required)
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

    // Parse cursor
    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from('notifications')
      .select(
        `
        id,
        type,
        read,
        created_at,
        actor:users!notifications_actor_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        pattern:quilt_patterns!notifications_pattern_id_fkey (
          id,
          title,
          thumbnail_url
        ),
        block:blocks!notifications_block_id_fkey (
          id,
          name,
          thumbnail_url
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return internalError('Failed to fetch notifications');
    }

    return NextResponse.json(
      {
        data: (notifications || []) as NotificationWithDetails[],
        nextCursor: (notifications || []).length === PAGE_SIZE ? cursor + 1 : null,
      },
      {
        headers: rateLimit.headers,
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

    console.error('Unexpected error in GET /api/v1/notifications:', error);
    return internalError('An unexpected error occurred');
  }
}
