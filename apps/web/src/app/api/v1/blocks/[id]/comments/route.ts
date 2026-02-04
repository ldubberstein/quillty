import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth, validateAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import {
  badRequest,
  internalError,
  notFound,
  rateLimited,
  validationError,
} from '../../../_lib/errors';
import { invalidateBlockSocialCache } from '../../../_lib/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PAGE_SIZE = 20;

// Validation schema for creating a comment
const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .transform((val) => val.trim()),
});

/**
 * GET /api/v1/blocks/[id]/comments
 * Get comments for a block (public)
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

    // Parse cursor
    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);

    if (isNaN(cursor) || cursor < 0) {
      return badRequest('Invalid cursor');
    }

    const supabase = createServiceClient();

    // Check if block exists and is published
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('id, status')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    // Only allow viewing comments on published blocks (or draft if owner)
    if (block.status !== 'published') {
      const auth = await validateAuth(request);
      const { data: blockOwner } = await supabase
        .from('blocks')
        .select('creator_id')
        .eq('id', id)
        .single();

      if (!auth.user || !blockOwner || auth.user.id !== blockOwner.creator_id) {
        return notFound('Block not found');
      }
    }

    // Fetch comments with user info
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user:users!comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('block_id', id)
      .order('created_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return internalError('Failed to fetch comments');
    }

    return NextResponse.json(
      {
        data: comments || [],
        nextCursor: (comments || []).length === PAGE_SIZE ? cursor + 1 : null,
      },
      {
        headers: rateLimit.headers,
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/blocks/[id]/comments:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * POST /api/v1/blocks/[id]/comments
 * Create a comment on a block (auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting (comments tier: 10/min)
    const rateLimit = await checkRateLimit(request, 'comments');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parseResult = CreateCommentSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const { content } = parseResult.data;

    const supabase = createServiceClient();

    // Check if block exists and is published
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('id, status, comment_count')
      .eq('id', id)
      .single();

    if (blockError || !block) {
      return notFound('Block not found');
    }

    if (block.status !== 'published') {
      return badRequest('Can only comment on published blocks');
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        block_id: id,
        content,
      })
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user:users!comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return internalError('Failed to create comment');
    }

    // Update comment count
    const { error: updateError } = await supabase
      .from('blocks')
      .update({ comment_count: (block.comment_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating comment count:', updateError);
    }

    // Invalidate cache
    await invalidateBlockSocialCache(id);

    return NextResponse.json(
      { data: comment },
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

    console.error('Unexpected error in POST /api/v1/blocks/[id]/comments:', error);
    return internalError('An unexpected error occurred');
  }
}
