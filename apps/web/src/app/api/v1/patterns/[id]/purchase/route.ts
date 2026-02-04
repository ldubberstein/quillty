import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  rateLimited,
} from '../../../_lib/errors';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/patterns/[id]/purchase
 * Create a payment intent to purchase a premium pattern
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Rate limiting (create tier: 20/min)
    const rateLimit = await checkRateLimit(request, 'create');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    const supabase = createServiceClient();

    // Fetch pattern details
    const { data: pattern, error: fetchError } = await supabase
      .from('quilt_patterns')
      .select('id, creator_id, title, status, price_cents')
      .eq('id', id)
      .single();

    if (fetchError || !pattern) {
      return notFound('Pattern not found');
    }

    // Verify pattern is premium and published
    if (pattern.status !== 'published_premium') {
      return badRequest('This pattern is not available for purchase');
    }

    if (!pattern.price_cents || pattern.price_cents <= 0) {
      return badRequest('Pattern does not have a valid price');
    }

    // Prevent self-purchase
    if (pattern.creator_id === user.id) {
      return forbidden('You cannot purchase your own pattern');
    }

    // Check if user already purchased this pattern
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('pattern_id', id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      return badRequest('You have already purchased this pattern');
    }

    // Get creator's Stripe Connect account
    const { data: partner } = await supabase
      .from('partners')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', pattern.creator_id)
      .maybeSingle();

    if (!partner?.stripe_account_id || !partner.stripe_onboarding_complete) {
      return badRequest('Creator is not set up to receive payments');
    }

    // Calculate platform fee (15%)
    const platformFeeCents = Math.round(pattern.price_cents * 0.15);

    // Create PaymentIntent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pattern.price_cents,
      currency: 'usd',
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: partner.stripe_account_id,
      },
      metadata: {
        user_id: user.id,
        pattern_id: id,
        creator_id: pattern.creator_id,
        pattern_title: pattern.title,
      },
    });

    return NextResponse.json(
      {
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: pattern.price_cents,
          currency: 'usd',
        },
      },
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

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error creating payment intent:', error);
      return internalError('Payment processing error');
    }

    console.error('Unexpected error in POST /api/v1/patterns/[id]/purchase:', error);
    return internalError('An unexpected error occurred');
  }
}
