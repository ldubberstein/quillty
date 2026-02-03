'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeed, useAuth, type FeedItem } from '@quillty/api';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFeed({
    type: activeTab,
    userId: user?.id,
  });

  const allItems = data?.pages.flat() ?? [];

  // Handle scroll-based pagination
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <h1 className="text-xl font-bold text-gray-900 lg:hidden">Quillty</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('forYou')}
              className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'forYou'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'following'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Following
            </button>
          </div>
        </div>
      </header>

      {/* Feed content */}
      <div className="p-4 lg:p-6" onScroll={handleScroll}>
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-500">Error loading feed</p>
            <p className="mt-2 text-sm text-gray-500">{error?.message}</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl">🧵</div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              {activeTab === 'following'
                ? 'Follow some quilters to see their work here!'
                : 'No patterns or blocks yet'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {activeTab === 'following'
                ? 'Discover creators in the For You tab'
                : 'Be the first to share your creation'}
            </p>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-2 gap-4 sm:columns-2 md:columns-3 lg:columns-3 xl:columns-4">
              {allItems.map((item) => (
                <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
              ))}
            </div>

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="mt-6 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            )}

            {/* Load more button (fallback for scroll) */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  className="rounded-full bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const isPattern = item.type === 'pattern';
  const data = item.data;
  const creator = data.creator;

  const href = isPattern ? `/pattern/${data.id}` : `/block/${data.id}`;
  const title = isPattern ? (data as { title: string }).title : (data as { name: string }).name;
  const thumbnailUrl = data.thumbnail_url;
  const isPremium = isPattern && (data as { status: string }).status === 'published_premium';
  const price = isPattern ? (data as { price?: number | null }).price : null;

  return (
    <Link
      href={href}
      className="mb-4 block break-inside-avoid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className={`relative w-full bg-gray-100 ${isPattern ? 'aspect-[4/5]' : 'aspect-square'}`}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">{isPattern ? '🧵' : '◇'}</span>
          </div>
        )}

        {/* Badges */}
        {isPattern && (
          <span
            className={`absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${
              isPremium ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          >
            {isPremium && price ? `$${price}` : 'FREE'}
          </span>
        )}

        {!isPattern && (
          <span className="absolute left-2 top-2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
            Block
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{title}</h3>

        <div className="mt-2 flex items-center justify-between">
          {/* Creator */}
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {creator?.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.display_name || creator.username}
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-medium text-gray-600">
                  {(creator?.display_name || creator?.username)?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <span className="truncate text-sm text-gray-600">
              {creator?.display_name || creator?.username || 'Unknown'}
            </span>
          </div>

          {/* Likes */}
          <div className="ml-2 flex items-center gap-1 text-gray-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{data.like_count ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeedSkeleton() {
  return (
    <div className="columns-2 gap-4 sm:columns-2 md:columns-3 lg:columns-3 xl:columns-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-gray-100 bg-white"
        >
          <div className={`animate-pulse bg-gray-200 ${i % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`} />
          <div className="p-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
