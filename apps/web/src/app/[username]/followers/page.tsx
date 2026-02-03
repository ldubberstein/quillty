'use client';

import { useRouter } from 'next/navigation';
import { useUserByUsername, useUserFollowers, useAuth } from '@quillty/api';
import { UserRow, FollowListSkeleton } from '@/components';

interface FollowersPageProps {
  params: { username: string };
}

export default function FollowersPage({ params }: FollowersPageProps) {
  const { username } = params;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserByUsername(username);
  const { data: followers, isLoading: followersLoading } = useUserFollowers(profile?.id);

  if (profileLoading || followersLoading) {
    return <FollowListSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-6xl">&#128100;</div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">User not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-6 rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Followers</h1>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {followers && followers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-6xl">&#128100;</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No followers yet</h2>
            <p className="mt-2 text-gray-500">
              When someone follows @{username}, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {followers?.map((follow) => (
              <UserRow
                key={follow.follower_id}
                follow={follow}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
