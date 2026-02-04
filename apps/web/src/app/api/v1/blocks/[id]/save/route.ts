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
 * POST /api/v1/blocks/[id]/save
 * Save a block (auth required)
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
      .select('id, status, save_count')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    if (block.status !== 'published') {
      return badRequest('Can only save published blocks');
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('block_id', id)
      .maybeSingle();

    if (existingSave) {
      return badRequest('Already saved this block');
    }

    // Create save
    const { error: saveError } = await supabase.from('saves').insert({
      user_id: user.id,
      block_id: id,
    });

    if (saveError) {
      console.error('Error creating save:', saveError);
      return internalError('Failed to save block');
    }

    // Update save count
    const { error: updateError } = await supabase
      .from('blocks')
      .update({ save_count: (block.save_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating save count:', updateError);
    }

    // Invalidate cache
    await invalidateBlockSocialCache(id);

    return NextResponse.json(
      {
        data: {
          saved: true,
          save_count: (block.save_count || 0) + 1,
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

    console.error('Unexpected error in POST /api/v1/blocks/[id]/save:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * DELETE /api/v1/blocks/[id]/save
 * Unsave a block (auth required)
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
      .select('id, save_count')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    // Check if saved
    const { data: existingSave } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('block_id', id)
      .maybeSingle();

    if (!existingSave) {
      return badRequest('Not saved');
    }

    // Delete save
    const { error: deleteError } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', user.id)
      .eq('block_id', id);

    if (deleteError) {
      console.error('Error deleting save:', deleteError);
      return internalError('Failed to unsave block');
    }

    // Update save count
    const newCount = Math.max(0, (block.save_count || 0) - 1);
    const { error: updateError } = await supabase
      .from('blocks')
      .update({ save_count: newCount })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating save count:', updateError);
    }

    // Invalidate cache
    await invalidateBlockSocialCache(id);

    return NextResponse.json(
      {
        data: {
          saved: false,
          save_count: newCount,
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

    console.error('Unexpected error in DELETE /api/v1/blocks/[id]/save:', error);
    return internalError('An unexpected error occurred');
  }
}
