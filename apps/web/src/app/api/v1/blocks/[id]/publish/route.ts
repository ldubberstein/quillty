import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import { badRequest, forbidden, internalError, notFound, rateLimited } from '../../../_lib/errors';
import { invalidateBlockCache } from '../../../_lib/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/blocks/[id]/publish
 * Publish a block (owner only, draft only)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting - stricter for publish
    const rateLimit = await checkRateLimit(request, 'publish');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication
    const user = await requireAuth(request);

    // Check if block exists and user owns it
    const supabase = createServiceClient();
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('id, creator_id, status, name, design_data')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlock) {
      return notFound('Block not found');
    }

    if (existingBlock.creator_id !== user.id) {
      return forbidden('You do not have permission to publish this block');
    }

    // Check if already published
    if (existingBlock.status === 'published') {
      return badRequest('Block is already published');
    }

    // Validate block has required content for publishing
    const designData = existingBlock.design_data as { units?: unknown[]; shapes?: unknown[] };
    const units = designData?.units ?? designData?.shapes ?? [];
    if (units.length === 0) {
      return badRequest('Block must have at least one unit to be published');
    }

    if (!existingBlock.name || existingBlock.name.trim() === '') {
      return badRequest('Block must have a name to be published');
    }

    // Publish block
    const now = new Date().toISOString();
    const { data: block, error: updateError } = await supabase
      .from('blocks')
      .update({
        status: 'published',
        published_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error publishing block:', updateError);
      return internalError('Failed to publish block');
    }

    // Invalidate cache
    await invalidateBlockCache(id);

    return NextResponse.json(
      { data: block },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.headers['X-RateLimit-Limit'],
          'X-RateLimit-Remaining': rateLimit.headers['X-RateLimit-Remaining'],
          'X-RateLimit-Reset': rateLimit.headers['X-RateLimit-Reset'],
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

    console.error('Unexpected error in POST /api/v1/blocks/[id]/publish:', error);
    return internalError('An unexpected error occurred');
  }
}
