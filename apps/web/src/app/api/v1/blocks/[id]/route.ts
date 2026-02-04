import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../_lib/supabase';
import { requireAuth, validateAuth } from '../../_lib/auth';
import { checkRateLimit } from '../../_lib/rate-limit';
import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  rateLimited,
  validationError,
} from '../../_lib/errors';
import {
  cacheGet,
  cacheSet,
  invalidateBlockCache,
  CACHE_KEYS,
  CACHE_TTL,
} from '../../_lib/cache';
import { UpdateBlockInputSchema } from '../schemas';

interface BlockWithCreator {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_platform_block: boolean;
  grid_size: number;
  design_data: unknown;
  difficulty: string;
  piece_count: number;
  like_count: number;
  save_count: number;
  comment_count: number;
  usage_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/blocks/[id]
 * Get a single block by ID
 * Includes Redis caching for published blocks (5 min TTL)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Check auth first to handle draft visibility
    const auth = await validateAuth(request);
    const userId = auth.user?.id;

    // Try cache first for published blocks
    const cacheKey = CACHE_KEYS.block(id);
    const cached = await cacheGet<BlockWithCreator>(cacheKey);

    if (cached) {
      // Cached blocks are always published, so no auth check needed
      return NextResponse.json(
        { data: cached },
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
    const { data: block, error } = await supabase
      .from('blocks')
      .select(
        `
        id,
        creator_id,
        name,
        description,
        thumbnail_url,
        is_platform_block,
        grid_size,
        design_data,
        difficulty,
        piece_count,
        like_count,
        save_count,
        comment_count,
        usage_count,
        status,
        created_at,
        updated_at,
        published_at,
        creator:users!blocks_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !block) {
      return notFound('Block not found');
    }

    // Check draft visibility - only owner can see drafts
    if (block.status === 'draft') {
      if (!userId || userId !== block.creator_id) {
        return notFound('Block not found');
      }
      // Don't cache drafts - return directly
      return NextResponse.json(
        { data: block },
        {
          headers: {
            ...rateLimit.headers,
            'X-Cache': 'SKIP',
          },
        }
      );
    }

    // Cache published blocks
    await cacheSet(cacheKey, block, { ttl: CACHE_TTL.block });

    return NextResponse.json(
      { data: block },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/blocks/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * PATCH /api/v1/blocks/[id]
 * Update a block (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'create');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication
    const user = await requireAuth(request);

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parseResult = UpdateBlockInputSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const input = parseResult.data;

    // Check if block exists and user owns it
    const supabase = createServiceClient();
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlock) {
      return notFound('Block not found');
    }

    if (existingBlock.creator_id !== user.id) {
      return forbidden('You do not have permission to update this block');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.gridSize !== undefined) updateData.grid_size = input.gridSize;
    if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
    if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl;
    if (input.designData !== undefined) {
      updateData.design_data = input.designData;
      updateData.piece_count = input.designData.shapes.length;
    }

    // Update block
    const { data: block, error: updateError } = await supabase
      .from('blocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating block:', updateError);
      return internalError('Failed to update block');
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

    console.error('Unexpected error in PATCH /api/v1/blocks/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * DELETE /api/v1/blocks/[id]
 * Delete a block (owner only, draft only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'create');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication
    const user = await requireAuth(request);

    // Check if block exists and user owns it
    const supabase = createServiceClient();
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlock) {
      return notFound('Block not found');
    }

    if (existingBlock.creator_id !== user.id) {
      return forbidden('You do not have permission to delete this block');
    }

    // Only allow deleting drafts
    if (existingBlock.status !== 'draft') {
      return badRequest('Published blocks cannot be deleted');
    }

    // Delete block
    const { error: deleteError } = await supabase.from('blocks').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting block:', deleteError);
      return internalError('Failed to delete block');
    }

    // Invalidate cache
    await invalidateBlockCache(id);

    return new NextResponse(null, {
      status: 204,
      headers: {
        'X-RateLimit-Limit': rateLimit.headers['X-RateLimit-Limit'],
        'X-RateLimit-Remaining': rateLimit.headers['X-RateLimit-Remaining'],
        'X-RateLimit-Reset': rateLimit.headers['X-RateLimit-Reset'],
      },
    });
  } catch (error) {
    // Handle AuthError from requireAuth
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('Unexpected error in DELETE /api/v1/blocks/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}
