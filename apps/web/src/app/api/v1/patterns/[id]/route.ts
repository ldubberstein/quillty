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
  invalidatePatternCache,
  CACHE_KEYS,
  CACHE_TTL,
} from '../../_lib/cache';
import { UpdatePatternInputSchema } from '../schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatternWithCreator {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  price_cents: number | null;
  difficulty: string;
  category: string | null;
  size: string | null;
  design_data: unknown;
  like_count: number;
  save_count: number;
  comment_count: number;
  view_count: number;
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

/**
 * GET /api/v1/patterns/[id]
 * Get a single pattern by ID
 * Includes Redis caching for published patterns (5 min TTL)
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

    // Check auth for draft visibility
    const auth = await validateAuth(request);
    const userId = auth.user?.id;

    // Try cache first for published patterns
    const cacheKey = CACHE_KEYS.pattern(id);
    const cached = await cacheGet<PatternWithCreator>(cacheKey);

    if (cached) {
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
    const { data: pattern, error } = await supabase
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
        category,
        size,
        design_data,
        like_count,
        save_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        published_at,
        creator:users!quilt_patterns_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !pattern) {
      return notFound('Pattern not found');
    }

    // Check draft visibility - only owner can see drafts
    if (pattern.status === 'draft') {
      if (!userId || userId !== pattern.creator_id) {
        return notFound('Pattern not found');
      }
      // Don't cache drafts
      return NextResponse.json(
        { data: pattern },
        {
          headers: {
            ...rateLimit.headers,
            'X-Cache': 'SKIP',
          },
        }
      );
    }

    // Cache published patterns
    await cacheSet(cacheKey, pattern, { ttl: CACHE_TTL.pattern });

    return NextResponse.json(
      { data: pattern },
      {
        headers: {
          ...rateLimit.headers,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/patterns/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * PATCH /api/v1/patterns/[id]
 * Update a pattern (owner only)
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

    const parseResult = UpdatePatternInputSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const input = parseResult.data;

    // Check if pattern exists and user owns it
    const supabase = createServiceClient();
    const { data: existingPattern, error: fetchError } = await supabase
      .from('quilt_patterns')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingPattern) {
      return notFound('Pattern not found');
    }

    if (existingPattern.creator_id !== user.id) {
      return forbidden('You do not have permission to update this pattern');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.size !== undefined) updateData.size = input.size;
    if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl;
    if (input.designData !== undefined) updateData.design_data = input.designData;

    // Update pattern
    const { data: pattern, error: updateError } = await supabase
      .from('quilt_patterns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating pattern:', updateError);
      return internalError('Failed to update pattern');
    }

    // Invalidate cache
    await invalidatePatternCache(id);

    return NextResponse.json(
      { data: pattern },
      { headers: rateLimit.headers }
    );
  } catch (error) {
    // Handle AuthError from requireAuth
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('Unexpected error in PATCH /api/v1/patterns/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * DELETE /api/v1/patterns/[id]
 * Delete a pattern (owner only, draft only)
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

    // Check if pattern exists and user owns it
    const supabase = createServiceClient();
    const { data: existingPattern, error: fetchError } = await supabase
      .from('quilt_patterns')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingPattern) {
      return notFound('Pattern not found');
    }

    if (existingPattern.creator_id !== user.id) {
      return forbidden('You do not have permission to delete this pattern');
    }

    // Only allow deleting drafts
    if (existingPattern.status !== 'draft') {
      return badRequest('Published patterns cannot be deleted');
    }

    // Delete pattern
    const { error: deleteError } = await supabase
      .from('quilt_patterns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting pattern:', deleteError);
      return internalError('Failed to delete pattern');
    }

    // Invalidate cache
    await invalidatePatternCache(id);

    return new NextResponse(null, {
      status: 204,
      headers: rateLimit.headers,
    });
  } catch (error) {
    // Handle AuthError from requireAuth
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('Unexpected error in DELETE /api/v1/patterns/[id]:', error);
    return internalError('An unexpected error occurred');
  }
}
