import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../_lib/supabase';
import { requireAuth } from '../../_lib/auth';
import { checkRateLimit } from '../../_lib/rate-limit';
import { internalError, rateLimited, unauthorized } from '../../_lib/errors';

/**
 * GET /api/v1/me/blocks
 * Get current user's blocks (both published and drafts)
 * Requires authentication
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Require authentication
    let user;
    try {
      user = await requireAuth(request);
    } catch {
      return unauthorized('Authentication required');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'published', 'draft', or null (all)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    const supabase = createServiceClient();
    let query = supabase
      .from('blocks')
      .select('*', { count: 'exact' })
      .eq('creator_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if specified
    if (status === 'published') {
      query = query.eq('status', 'published');
    } else if (status === 'draft') {
      query = query.eq('status', 'draft');
    }

    const { data: blocks, error, count } = await query;

    if (error) {
      console.error('Error fetching user blocks:', error);
      return internalError('Failed to fetch blocks');
    }

    return NextResponse.json(
      {
        data: blocks || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
      {
        headers: rateLimit.headers,
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/me/blocks:', error);
    return internalError('An unexpected error occurred');
  }
}
