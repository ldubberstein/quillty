import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../_lib/supabase';
import { requireAuth } from '../_lib/auth';
import { checkRateLimit } from '../_lib/rate-limit';
import { badRequest, internalError, rateLimited, validationError } from '../_lib/errors';
import { CreateBlockInputSchema } from './schemas';

/**
 * POST /api/v1/blocks
 * Create a new block (requires authentication)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    const parseResult = CreateBlockInputSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const input = parseResult.data;

    // Calculate piece count from units
    const pieceCount = input.designData.units.length;

    // Create block in database
    const supabase = createServiceClient();
    const { data: block, error } = await supabase
      .from('blocks')
      .insert({
        creator_id: user.id,
        name: input.name,
        description: input.description || null,
        grid_size: input.gridSize,
        design_data: input.designData,
        difficulty: input.difficulty,
        piece_count: pieceCount,
        thumbnail_url: input.thumbnailUrl || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating block:', error);
      return internalError('Failed to create block');
    }

    return NextResponse.json(
      { data: block },
      {
        status: 201,
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

    console.error('Unexpected error in POST /api/v1/blocks:', error);
    return internalError('An unexpected error occurred');
  }
}
