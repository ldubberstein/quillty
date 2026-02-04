import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../_lib/supabase';
import { requireAuth } from '../_lib/auth';
import { checkRateLimit } from '../_lib/rate-limit';
import {
  badRequest,
  internalError,
  rateLimited,
  validationError,
} from '../_lib/errors';
import { CreatePatternInputSchema } from './schemas';
import type { Json } from '@quillty/api';

const PAGE_SIZE = 20;

/**
 * GET /api/v1/patterns
 * List published patterns (public)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    if (isNaN(cursor) || cursor < 0) {
      return badRequest('Invalid cursor');
    }

    const supabase = createServiceClient();

    // Build query
    let query = supabase
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
        like_count,
        save_count,
        comment_count,
        view_count,
        published_at,
        created_at,
        creator:users!quilt_patterns_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .in('status', ['published_free', 'published_premium'])
      .order('published_at', { ascending: false })
      .range(cursor * PAGE_SIZE, (cursor + 1) * PAGE_SIZE - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'] as const;
    if (difficulty && validDifficulties.includes(difficulty as typeof validDifficulties[number])) {
      query = query.eq('difficulty', difficulty as typeof validDifficulties[number]);
    }

    const { data: patterns, error } = await query;

    if (error) {
      console.error('Error fetching patterns:', error);
      return internalError('Failed to fetch patterns');
    }

    return NextResponse.json(
      {
        data: patterns || [],
        nextCursor: (patterns || []).length === PAGE_SIZE ? cursor + 1 : null,
      },
      {
        headers: rateLimit.headers,
      }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/patterns:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * POST /api/v1/patterns
 * Create a new pattern (auth required)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'create');
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

    const parseResult = CreatePatternInputSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const input = parseResult.data;

    const supabase = createServiceClient();

    // Create pattern
    const { data: pattern, error } = await supabase
      .from('quilt_patterns')
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description,
        design_data: input.designData as unknown as Json,
        difficulty: input.difficulty || 'beginner',
        category: input.category,
        size: input.size,
        thumbnail_url: input.thumbnailUrl,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pattern:', error);
      return internalError('Failed to create pattern');
    }

    return NextResponse.json(
      { data: pattern },
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

    console.error('Unexpected error in POST /api/v1/patterns:', error);
    return internalError('An unexpected error occurred');
  }
}
