'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePattern, useAuth } from '@quillty/api';
import { LikeButton, SaveButton, CommentSection, CommentButton } from '@/components';

interface PatternPageProps {
  params: { id: string };
}

export default function PatternPage({ params }: PatternPageProps) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { data: pattern, isLoading, isError, error } = usePattern(id);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const scrollToComments = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return <PatternSkeleton />;
  }

  if (isError || !pattern) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-6xl">🧵</div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Pattern not found</h1>
        <p className="mt-2 text-gray-500">{error?.message || 'This pattern may have been removed.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark"
        >
          Go back
        </button>
      </div>
    );
  }

  const isPremium = pattern.status === 'published_premium';
  const isOwner = user?.id === pattern.creator_id;
  const difficulty = pattern.difficulty || 'beginner';
  const category = pattern.category || 'other';
  const priceDisplay = pattern.price_cents ? (pattern.price_cents / 100).toFixed(2) : null;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
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
          <h1 className="flex-1 truncate text-lg font-semibold text-gray-900">Pattern</h1>
          {isOwner && (
            <Link
              href={`/create/pattern/${id}/edit`}
              className="flex h-10 items-center rounded-full bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Edit
            </Link>
          )}
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 sm:aspect-video lg:aspect-[21/9]">
        {pattern.thumbnail_url ? (
          <Image
            src={pattern.thumbnail_url}
            alt={pattern.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-8xl">🧵</span>
          </div>
        )}

        {/* Price Badge */}
        <span
          className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-semibold text-white ${
            isPremium ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        >
          {isPremium && priceDisplay ? `$${priceDisplay}` : 'FREE'}
        </span>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
        {/* Title and Creator */}
        <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">{pattern.title}</h2>

        <Link
          href={`/${pattern.creator?.username || ''}`}
          className="mt-4 flex items-center gap-3 rounded-lg p-2 -ml-2 transition hover:bg-gray-50"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-200">
            {pattern.creator?.avatar_url ? (
              <Image
                src={pattern.creator.avatar_url}
                alt={pattern.creator.display_name || pattern.creator.username}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600">
                {(pattern.creator?.display_name || pattern.creator?.username)?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {pattern.creator?.display_name || pattern.creator?.username || 'Unknown'}
            </p>
            {pattern.creator?.username && (
              <p className="text-sm text-gray-500">@{pattern.creator.username}</p>
            )}
          </div>
        </Link>

        {/* Stats Row */}
        <div className="mt-6 flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{pattern.like_count ?? 0}</span>
            <span className="text-gray-400">likes</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{pattern.comment_count ?? 0}</span>
            <span className="text-gray-400">comments</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span className="font-medium">{pattern.save_count ?? 0}</span>
            <span className="text-gray-400">saves</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getDifficultyColor(difficulty)}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
          {pattern.size && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {pattern.size}
            </span>
          )}
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
          </span>
        </div>

        {/* Description */}
        {pattern.description && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">About this pattern</h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">{pattern.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <LikeButton
            userId={user?.id}
            contentId={id}
            contentType="pattern"
            likeCount={pattern.like_count ?? 0}
          />
          <SaveButton
            userId={user?.id}
            contentId={id}
            contentType="pattern"
            saveCount={pattern.save_count ?? 0}
          />
          <CommentButton
            commentCount={pattern.comment_count ?? 0}
            onClick={scrollToComments}
          />
        </div>

        {/* View Instructions / Purchase Button */}
        <div className="mt-6">
          {isPremium && !isOwner ? (
            <button className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-amber-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Purchase for ${priceDisplay}
            </button>
          ) : (
            <button className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-lg font-semibold text-white transition hover:bg-brand-dark">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Instructions
            </button>
          )}
        </div>

        {/* Print Button */}
        {(!isPremium || isOwner) && (
          <button className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Pattern
          </button>
        )}

        {/* Comments Section */}
        <div ref={commentSectionRef} className="mt-8">
          <CommentSection
            contentId={id}
            contentType="pattern"
            currentUserId={user?.id}
            commentCount={pattern.comment_count ?? 0}
          />
        </div>
      </div>
    </div>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-700';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700';
    case 'advanced':
      return 'bg-orange-100 text-orange-700';
    case 'expert':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function PatternSkeleton() {
  return (
    <div className="min-h-screen pb-24">
      {/* Header skeleton */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </header>

      {/* Hero skeleton */}
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200 sm:aspect-video lg:aspect-[21/9]" />

      {/* Content skeleton */}
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
        <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          <div>
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="mt-6 flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-20 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="mt-6">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
