import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '../../_lib/supabase';
import { invalidateNotificationCache } from '../../_lib/cache';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/v1/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Stripe webhook: Missing signature');
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing signature' } },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      console.error('Stripe webhook signature verification failed:', message);
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid signature' } },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // Log unhandled event types for debugging
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Webhook handler failed' } },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 * Creates purchase record and sends notification to creator
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const supabase = createServiceClient();

  // Extract metadata from payment intent
  const { user_id, pattern_id, creator_id } = paymentIntent.metadata;

  if (!user_id || !pattern_id || !creator_id) {
    console.error('Payment intent missing required metadata:', paymentIntent.id);
    return;
  }

  // Check if purchase already exists (idempotency)
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (existingPurchase) {
    console.log('Purchase already exists for payment intent:', paymentIntent.id);
    return;
  }

  // Calculate fees (platform takes 15%)
  const amountCents = paymentIntent.amount;
  const platformFeeCents = Math.round(amountCents * 0.15);
  const creatorPayoutCents = amountCents - platformFeeCents;

  // Create purchase record
  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id,
    pattern_id,
    stripe_payment_intent_id: paymentIntent.id,
    amount_cents: amountCents,
    platform_fee_cents: platformFeeCents,
    creator_payout_cents: creatorPayoutCents,
    status: 'completed',
  });

  if (purchaseError) {
    console.error('Error creating purchase record:', purchaseError);
    throw purchaseError;
  }

  // Send notification to creator
  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: creator_id,
    type: 'purchase',
    actor_id: user_id,
    pattern_id,
    read: false,
  });

  if (notificationError) {
    console.error('Error creating purchase notification:', notificationError);
    // Don't throw - notification is not critical
  }

  // Invalidate creator's notification cache
  await invalidateNotificationCache(creator_id);

  console.log('Purchase completed:', {
    paymentIntentId: paymentIntent.id,
    userId: user_id,
    patternId: pattern_id,
    amount: amountCents,
  });
}

/**
 * Handle Stripe Connect account updates
 * Updates partner onboarding status
 */
async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const supabase = createServiceClient();

  // Find partner by Stripe account ID
  const { data: partner, error: fetchError } = await supabase
    .from('partners')
    .select('id, user_id, stripe_onboarding_complete')
    .eq('stripe_account_id', account.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching partner:', fetchError);
    return;
  }

  if (!partner) {
    console.log('No partner found for Stripe account:', account.id);
    return;
  }

  // Check if account is fully onboarded
  const isOnboarded =
    account.details_submitted === true &&
    account.charges_enabled === true &&
    account.payouts_enabled === true;

  // Only update if status changed
  if (partner.stripe_onboarding_complete !== isOnboarded) {
    const updateData: Record<string, unknown> = {
      stripe_onboarding_complete: isOnboarded,
      updated_at: new Date().toISOString(),
    };

    // If onboarding complete, set status to active
    if (isOnboarded) {
      updateData.status = 'active';
    }

    const { error: updateError } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', partner.id);

    if (updateError) {
      console.error('Error updating partner:', updateError);
      throw updateError;
    }

    // Send notification if onboarding completed
    if (isOnboarded && !partner.stripe_onboarding_complete) {
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: partner.user_id,
        type: 'payout',
        read: false,
      });

      if (notificationError) {
        console.error('Error creating onboarding notification:', notificationError);
      }

      await invalidateNotificationCache(partner.user_id);
    }

    console.log('Partner onboarding status updated:', {
      partnerId: partner.id,
      stripeAccountId: account.id,
      onboarded: isOnboarded,
    });
  }
}
