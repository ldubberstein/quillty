'use client';

import { useSaveStatus, useToggleSave } from '@quillty/api';

interface SaveButtonProps {
  userId?: string;
  contentId: string;
  contentType: 'pattern' | 'block';
  saveCount: number;
  variant?: 'icon' | 'full';
}

export function SaveButton({
  userId,
  contentId,
  contentType,
  saveCount,
  variant = 'full',
}: SaveButtonProps) {
  const { data: isSaved, isLoading: statusLoading } = useSaveStatus(
    userId,
    contentId,
    contentType
  );
  const { mutate: toggleSave, isPending } = useToggleSave();

  const handleClick = () => {
    if (!userId) {
      window.location.href = '/login';
      return;
    }
    toggleSave({
      userId,
      contentId,
      contentType,
      isSaved: !!isSaved,
    });
  };

  const isActive = !!isSaved;
  const isDisabled = isPending || statusLoading;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`flex items-center gap-1 transition-colors ${
          isActive ? 'text-brand' : 'text-gray-500 hover:text-brand'
        } ${isDisabled ? 'opacity-50' : ''}`}
        aria-label={isActive ? 'Unsave' : 'Save'}
      >
        <svg
          className="h-5 w-5"
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <span className="text-sm font-medium">{saveCount}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border px-6 py-2 font-medium transition sm:flex-none ${
        isActive
          ? 'border-brand/20 bg-brand/10 text-brand'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
      } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <svg
        className="h-5 w-5"
        fill={isActive ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {isActive ? 'Saved' : 'Save'}
    </button>
  );
}
