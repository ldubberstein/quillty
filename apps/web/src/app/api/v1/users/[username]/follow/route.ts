import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '../../../_lib/supabase';
import { requireAuth } from '../../../_lib/auth';
import { checkRateLimit } from '../../../_lib/rate-limit';
import {
  internalError,
  notFound,
  rateLimited,
  badRequest,
} from '../../../_lib/errors';
import { invalidateFollowCache } from '../../../_lib/cache';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * POST /api/v1/users/[username]/follow
 * Follow a user (auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { username } = await params;

    // Rate limiting (social tier: 60/min)
    const rateLimit = await checkRateLimit(request, 'social');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    const supabase = createServiceClient();

    // Get current user's username for cache invalidation
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return internalError('Failed to get current user');
    }

    // Get target user
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, username, follower_count')
      .eq('username', username)
      .single();

    if (targetError || !targetUser) {
      return notFound('User not found');
    }

    // Can't follow yourself
    if (targetUser.id === user.id) {
      return badRequest('Cannot follow yourself');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followed_id', targetUser.id)
      .maybeSingle();

    if (existingFollow) {
      return badRequest('Already following this user');
    }

    // Create follow
    const { error: followError } = await supabase.from('follows').insert({
      follower_id: user.id,
      followed_id: targetUser.id,
    });

    if (followError) {
      console.error('Error creating follow:', followError);
      return internalError('Failed to follow user');
    }

    // Update follower count for target user
    const { error: updateFollowerError } = await supabase
      .from('users')
      .update({ follower_count: (targetUser.follower_count || 0) + 1 })
      .eq('id', targetUser.id);

    if (updateFollowerError) {
      console.error('Error updating follower count:', updateFollowerError);
    }

    // Update following count for current user
    const { data: currentUserData } = await supabase
      .from('users')
      .select('following_count')
      .eq('id', user.id)
      .single();

    if (currentUserData) {
      await supabase
        .from('users')
        .update({ following_count: (currentUserData.following_count || 0) + 1 })
        .eq('id', user.id);
    }

    // Invalidate caches
    await invalidateFollowCache(currentUser.username, targetUser.username);

    return NextResponse.json(
      {
        data: {
          following: true,
          follower_count: (targetUser.follower_count || 0) + 1,
        },
      },
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

    console.error('Unexpected error in POST /api/v1/users/[username]/follow:', error);
    return internalError('An unexpected error occurred');
  }
}

/**
 * DELETE /api/v1/users/[username]/follow
 * Unfollow a user (auth required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { username } = await params;

    // Rate limiting (social tier: 60/min)
    const rateLimit = await checkRateLimit(request, 'social');
    if (!rateLimit.success) {
      return rateLimited('Rate limit exceeded. Please try again later.');
    }

    // Authentication required
    const user = await requireAuth(request);

    const supabase = createServiceClient();

    // Get current user's username for cache invalidation
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('username, following_count')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return internalError('Failed to get current user');
    }

    // Get target user
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, username, follower_count')
      .eq('username', username)
      .single();

    if (targetError || !targetUser) {
      return notFound('User not found');
    }

    // Check if following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followed_id', targetUser.id)
      .maybeSingle();

    if (!existingFollow) {
      return badRequest('Not following this user');
    }

    // Delete follow
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followed_id', targetUser.id);

    if (deleteError) {
      console.error('Error deleting follow:', deleteError);
      return internalError('Failed to unfollow user');
    }

    // Update follower count for target user
    const newFollowerCount = Math.max(0, (targetUser.follower_count || 0) - 1);
    const { error: updateFollowerError } = await supabase
      .from('users')
      .update({ follower_count: newFollowerCount })
      .eq('id', targetUser.id);

    if (updateFollowerError) {
      console.error('Error updating follower count:', updateFollowerError);
    }

    // Update following count for current user
    const newFollowingCount = Math.max(0, (currentUser.following_count || 0) - 1);
    await supabase
      .from('users')
      .update({ following_count: newFollowingCount })
      .eq('id', user.id);

    // Invalidate caches
    await invalidateFollowCache(currentUser.username, targetUser.username);

    return NextResponse.json(
      {
        data: {
          following: false,
          follower_count: newFollowerCount,
        },
      },
      {
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

    console.error('Unexpected error in DELETE /api/v1/users/[username]/follow:', error);
    return internalError('An unexpected error occurred');
  }
}
