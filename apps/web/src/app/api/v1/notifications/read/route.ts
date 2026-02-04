import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '../../_lib/supabase';
import { requireAuth } from '../../_lib/auth';
import { checkRateLimit } from '../../_lib/rate-limit';
import {
  badRequest,
  internalError,
  rateLimited,
  validationError,
} from '../../_lib/errors';
import { invalidateNotificationCache } from '../../_lib/cache';

// Validation schema for marking notifications as read
const MarkReadSchema = z.object({
  notificationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one notification ID required')
    .max(100, 'Cannot mark more than 100 notifications at once')
    .optional(),
  all: z.boolean().optional(),
}).refine(
  (data) => data.notificationIds !== undefined || data.all === true,
  { message: 'Either notificationIds or all=true must be provided' }
);

/**
 * POST /api/v1/notifications/read
 * Mark notifications as read (auth required)
 *
 * Body:
 * - notificationIds: string[] - specific notification IDs to mark as read
 * - all: boolean - mark all notifications as read
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'api');
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

    const parseResult = MarkReadSchema.safeParse(body);
    if (!parseResult.success) {
      return validationError('Validation failed', parseResult.error.flatten());
    }

    const { notificationIds, all } = parseResult.data;

    const supabase = createServiceClient();

    if (all) {
      // Mark all unread notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return internalError('Failed to mark notifications as read');
      }
    } else if (notificationIds) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return internalError('Failed to mark notifications as read');
      }
    }

    // Invalidate notification cache
    await invalidateNotificationCache(user.id);

    return NextResponse.json(
      { data: { success: true } },
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

    console.error('Unexpected error in POST /api/v1/notifications/read:', error);
    return internalError('An unexpected error occurred');
  }
}
