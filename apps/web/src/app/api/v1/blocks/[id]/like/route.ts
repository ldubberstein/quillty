import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import {
  internalError,
  notFound,
  rateLimited,
  badRequest,
} from '../../../_lib/errors';
import { invalidateBlockSocialCache } from '../../../_lib/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/blocks/[id]/like
 * Like a block (auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting (social tier: 60/min)
    const rateLimit = await checkRateLimit(request, 'social');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    const supabase = createServiceClient();

    // Check if block exists and is published
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('id, status, like_count')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    if (block.status !== 'published') {
      return badRequest('Can only like published blocks');
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('block_id', id)
      .maybeSingle();

    if (existingLike) {
      return badRequest('Already liked this block');
    }

    // Create like
    const { error: likeError } = await supabase.from('likes').insert({
      user_id: user.id,
      block_id: id,
    });

    if (likeError) {
      console.error('Error creating like:', likeError);
      return internalError('Failed to like block');
    }

    // Update like count
    const { error: updateError } = await supabase
      .from('blocks')
      .update({ like_count: (block.like_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating like count:', updateError);
    }

    // Invalidate cache
    await invalidateBlockSocialCache(id);

    return NextResponse.json(
      {
        data: {
          liked: true,
          like_count: (block.like_count || 0) + 1,
        },
      },
      {
        status: 201,
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

    console.error('Unexpected error in POST /api/v1/blocks/[id]/like:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * DELETE /api/v1/blocks/[id]/like
 * Unlike a block (auth required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting (social tier: 60/min)
    const rateLimit = await checkRateLimit(request, 'social');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    const supabase = createServiceClient();

    // Check if block exists
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('id, like_count')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    // Check if liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('block_id', id)
      .maybeSingle();

    if (!existingLike) {
      return badRequest('Not liked');
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('block_id', id);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return internalError('Failed to unlike block');
    }

    // Update like count
    const newCount = Math.max(0, (block.like_count || 0) - 1);
    const { error: updateError } = await supabase
      .from('blocks')
      .update({ like_count: newCount })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating like count:', updateError);
    }

    // Invalidate cache
    await invalidateBlockSocialCache(id);

    return NextResponse.json(
      {
        data: {
          liked: false,
          like_count: newCount,
        },
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

    console.error('Unexpected error in DELETE /api/v1/blocks/[id]/like:', error);
    return internalError('An unexpected error occurred');
  }
}
