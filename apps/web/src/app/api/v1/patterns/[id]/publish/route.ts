import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  rateLimited,
  validationError,
} from '../../../_lib/errors';
import { invalidatePatternCache } from '../../../_lib/cache';
import { PublishPatternInputSchema } from '../../schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/patterns/[id]/publish
 * Publish a pattern (owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting (publish tier: 5/min)
    const rateLimit = await checkRateLimit(request, 'publish');
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

    const parseResult = PublishPatternInputSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const input = parseResult.data;

    // Check if pattern exists and user owns it
    const supabase = createServiceClient();
    const { data: existingPattern, error: fetchError } = await supabase
      .from('quilt_patterns')
      .select('id, creator_id, status, title, design_data')
      .eq('id', id)
      .single();

    if (fetchError || !existingPattern) {
      return notFound('Pattern not found');
    }

    if (existingPattern.creator_id !== user.id) {
      return forbidden('You do not have permission to publish this pattern');
    }

    // Already published
    if (existingPattern.status !== 'draft') {
      return badRequest('Pattern is already published');
    }

    // Validate pattern is ready for publishing
    if (!existingPattern.title || existingPattern.title.trim() === '') {
      return badRequest('Pattern must have a title before publishing');
    }

    // For premium patterns, check if user is a partner
    if (input.type === 'premium') {
      const { data: partner } = await supabase
        .from('partners')
        .select('id, status, stripe_onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!partner) {
        return badRequest('You must be a partner to publish premium patterns');
      }

      const partnerData = partner as { status: string; stripe_onboarding_complete: boolean };
      if (partnerData.status !== 'active' || !partnerData.stripe_onboarding_complete) {
        return badRequest('Please complete partner onboarding before publishing premium patterns');
      }
    }

    // Publish pattern
    const status = input.type === 'premium' ? 'published_premium' : 'published_free';
    const updateData: Record<string, unknown> = {
      status,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (input.type === 'premium' && input.priceCents) {
      updateData.price_cents = input.priceCents;
    }

    const { data: pattern, error: updateError } = await supabase
      .from('quilt_patterns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error publishing pattern:', updateError);
      return internalError('Failed to publish pattern');
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

    console.error('Unexpected error in POST /api/v1/patterns/[id]/publish:', error);
    return internalError('An unexpected error occurred');
  }
}
