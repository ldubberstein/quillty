'use client';

import { useLikeStatus, useToggleLike } from '@quillty/api';

interface LikeButtonProps {
  userId?: string;
  contentId: string;
  contentType: 'pattern' | 'block';
  likeCount: number;
  variant?: 'icon' | 'full';
}

export function LikeButton({
  userId,
  contentId,
  contentType,
  likeCount,
  variant = 'full',
}: LikeButtonProps) {
  const { data: isLiked, isLoading: statusLoading } = useLikeStatus(
    userId,
    contentId,
    contentType
  );
  const { mutate: toggleLike, isPending } = useToggleLike();

  const handleClick = () => {
    if (!userId) {
      // Redirect to login or show modal
      window.location.href = '/login';
      return;
    }
    toggleLike({
      userId,
      contentId,
      contentType,
      isLiked: !!isLiked,
    });
  };

  const isActive = !!isLiked;
  const isDisabled = isPending || statusLoading;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`flex items-center gap-1 transition-colors ${
          isActive ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
        } ${isDisabled ? 'opacity-50' : ''}`}
        aria-label={isActive ? 'Unlike' : 'Like'}
      >
        <svg
          className="h-5 w-5"
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isActive ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border px-6 py-2 font-medium transition sm:flex-none ${
        isActive
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
      } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <svg
        className="h-5 w-5"
        fill={isActive ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isActive ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isActive ? 'Liked' : 'Like'}
    </button>
  );
}
