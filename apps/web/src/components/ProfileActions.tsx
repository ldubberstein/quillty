'use client';

import Link from 'next/link';
import { useAuth } from '@quillty/api';
import { FollowButton } from './FollowButton';

interface ProfileActionsProps {
  profileUserId: string;
}

export function ProfileActions({ profileUserId }: ProfileActionsProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mt-6 flex justify-center gap-3 sm:mt-0 sm:justify-start">
        <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  const isOwnProfile = user?.id === profileUserId;

  if (isOwnProfile) {
    return (
      <div className="mt-6 flex justify-center gap-3 sm:mt-0 sm:justify-start">
        <Link
          href="/settings/profile"
          className="rounded-full border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Edit Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center gap-3 sm:mt-0 sm:justify-start">
      <FollowButton
        currentUserId={user?.id}
        targetUserId={profileUserId}
        variant="medium"
      />
    </div>
  );
}
