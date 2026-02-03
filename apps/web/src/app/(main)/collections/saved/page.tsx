'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth, useUserSaves, type SaveWithContent } from '@quillty/api';

export default function SavedCollectionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: saves, isLoading: savesLoading } = useUserSaves(user?.id);

  if (authLoading) {
    return <CollectionSkeleton title="Saved" />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-6xl">&#128278;</div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Sign in to see your saves</h1>
        <p className="mt-2 text-gray-500">Save patterns and blocks to find them later.</p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (savesLoading) {
    return <CollectionSkeleton title="Saved" />;
  }

  const patterns = saves?.filter((save) => save.pattern) ?? [];
  const blocks = saves?.filter((save) => save.block) ?? [];

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
          <h1 className="flex-1 text-lg font-semibold text-gray-900">Saved</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        {saves && saves.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-6xl">&#128278;</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No saves yet</h2>
            <p className="mt-2 text-gray-500">
              Patterns and blocks you save will appear here.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark"
            >
              Explore patterns
            </Link>
          </div>
        ) : (
          <>
            {/* Patterns Section */}
            {patterns.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-xl font-bold text-gray-900">
                  Patterns ({patterns.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {patterns.map((save) => (
                    <SavedPatternCard key={save.id} save={save} />
                  ))}
                </div>
              </section>
            )}

            {/* Blocks Section */}
            {blocks.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-bold text-gray-900">
                  Blocks ({blocks.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {blocks.map((save) => (
                    <SavedBlockCard key={save.id} save={save} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SavedPatternCard({ save }: { save: SaveWithContent }) {
  if (!save.pattern) return null;

  return (
    <Link
      href={`/pattern/${save.pattern.id}`}
      className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square bg-gray-100">
        {save.pattern.thumbnail_url ? (
          <Image
            src={save.pattern.thumbnail_url}
            alt={save.pattern.title}
            width={300}
            height={300}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl">&#129525;</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-medium text-gray-900">{save.pattern.title}</h3>
        {save.pattern.creator && (
          <p className="mt-1 truncate text-sm text-gray-500">
            by {save.pattern.creator.display_name || save.pattern.creator.username}
          </p>
        )}
      </div>
    </Link>
  );
}

function SavedBlockCard({ save }: { save: SaveWithContent }) {
  if (!save.block) return null;

  return (
    <Link
      href={`/block/${save.block.id}`}
      className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square bg-gray-100">
        {save.block.thumbnail_url ? (
          <Image
            src={save.block.thumbnail_url}
            alt={save.block.name}
            width={300}
            height={300}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl">&#9671;</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <span className="mb-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Block
        </span>
        <h3 className="truncate font-medium text-gray-900">{save.block.name}</h3>
        {save.block.creator && (
          <p className="mt-1 truncate text-sm text-gray-500">
            by {save.block.creator.display_name || save.block.creator.username}
          </p>
        )}
      </div>
    </Link>
  );
}

function CollectionSkeleton({ title: _title }: { title: string }) {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="mb-6 h-7 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="aspect-square animate-pulse bg-gray-200" />
              <div className="p-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
