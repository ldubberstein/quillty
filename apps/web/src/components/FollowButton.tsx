'use client';

import { useFollowStatus, useToggleFollow } from '@quillty/api';

interface FollowButtonProps {
  currentUserId?: string;
  targetUserId: string;
  variant?: 'small' | 'medium' | 'large';
}

export function FollowButton({
  currentUserId,
  targetUserId,
  variant = 'medium',
}: FollowButtonProps) {
  const { data: isFollowing, isLoading: statusLoading } = useFollowStatus(
    currentUserId,
    targetUserId
  );
  const { mutate: toggleFollow, isPending } = useToggleFollow();

  // Don't show follow button for own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  const handleClick = () => {
    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }
    toggleFollow({
      followerId: currentUserId,
      followedId: targetUserId,
      isFollowing: !!isFollowing,
    });
  };

  const isActive = !!isFollowing;
  const isDisabled = isPending || statusLoading;

  const sizeClasses = {
    small: 'px-4 py-1.5 text-sm min-h-[32px]',
    medium: 'px-6 py-2 text-sm min-h-[40px]',
    large: 'px-8 py-3 text-base min-h-[48px]',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`rounded-full font-semibold transition ${sizeClasses[variant]} ${
        isActive
          ? 'border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          : 'bg-brand text-white hover:bg-brand-dark'
      } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {isActive ? 'Following' : 'Follow'}
    </button>
  );
}
