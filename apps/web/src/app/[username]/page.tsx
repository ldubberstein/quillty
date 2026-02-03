import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@quillty/api';
import { ProfileActions } from '@/components';

type User = Database['public']['Tables']['users']['Row'];
type Pattern = Database['public']['Tables']['quilt_patterns']['Row'];
type Block = Database['public']['Tables']['blocks']['Row'];

interface Props {
  params: Promise<{ username: string }>;
}

async function getProfile(username: string): Promise<User | null> {
  const supabase = createServerClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as User;
}

async function getPatterns(userId: string): Promise<Pattern[]> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('quilt_patterns')
    .select('*')
    .eq('creator_id', userId)
    .in('status', ['published_free', 'published_premium'])
    .order('created_at', { ascending: false })
    .limit(12);

  return (data ?? []) as Pattern[];
}

async function getBlocks(userId: string): Promise<Block[]> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('blocks')
    .select('*')
    .eq('creator_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12);

  return (data ?? []) as Block[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: 'Profile Not Found | Quillty',
    };
  }

  const displayName = profile.display_name || `@${profile.username}`;
  const description = profile.bio || `Check out ${displayName}'s quilting patterns on Quillty`;

  return {
    title: `${displayName} (@${profile.username}) | Quillty`,
    description,
    openGraph: {
      title: `${displayName} on Quillty`,
      description,
      type: 'profile',
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: `${displayName} on Quillty`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  const [patterns, blocks] = await Promise.all([
    getPatterns(profile.id),
    getBlocks(profile.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 sm:h-32 sm:w-32">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-medium text-gray-600 sm:text-4xl">
                  {profile.display_name?.[0] || profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_partner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Partner
                  </span>
                )}
              </div>

              <p className="mt-1 text-gray-500">@{profile.username}</p>

              {profile.bio && (
                <p className="mt-4 max-w-lg text-gray-700">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="mt-6 flex items-center justify-center gap-8 sm:justify-start">
                <div className="text-center sm:text-left">
                  <span className="block text-xl font-bold text-gray-900">
                    {patterns.length}
                  </span>
                  <span className="text-sm text-gray-500">Patterns</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="block text-xl font-bold text-gray-900">
                    {blocks.length}
                  </span>
                  <span className="text-sm text-gray-500">Blocks</span>
                </div>
                <Link
                  href={`/${profile.username}/followers`}
                  className="text-center transition hover:opacity-70 sm:text-left"
                >
                  <span className="block text-xl font-bold text-gray-900">
                    {profile.follower_count}
                  </span>
                  <span className="text-sm text-gray-500">Followers</span>
                </Link>
                <Link
                  href={`/${profile.username}/following`}
                  className="text-center transition hover:opacity-70 sm:text-left"
                >
                  <span className="block text-xl font-bold text-gray-900">
                    {profile.following_count}
                  </span>
                  <span className="text-sm text-gray-500">Following</span>
                </Link>
              </div>

              {/* Follow/Edit Profile Button */}
              <ProfileActions profileUserId={profile.id} />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Patterns Section */}
        {patterns.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Patterns</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {patterns.map((pattern: Pattern) => (
                <Link
                  key={pattern.id}
                  href={`/pattern/${pattern.id}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-square bg-gray-100">
                    {pattern.thumbnail_url ? (
                      <img
                        src={pattern.thumbnail_url}
                        alt={pattern.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate font-medium text-gray-900">
                      {pattern.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {pattern.status === 'published_premium' && pattern.price_cents ? (
                        <span className="text-sm font-medium text-brand">
                          ${(pattern.price_cents / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600">Free</span>
                      )}
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {pattern.like_count} likes
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Blocks Section */}
        {blocks.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold text-gray-900">Blocks</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {blocks.map((block: Block) => (
                <Link
                  key={block.id}
                  href={`/block/${block.id}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-square bg-gray-100">
                    {block.thumbnail_url ? (
                      <img
                        src={block.thumbnail_url}
                        alt={block.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Block
                      </span>
                    </div>
                    <h3 className="truncate font-medium text-gray-900">
                      {block.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {block.like_count} likes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {patterns.length === 0 && blocks.length === 0 && (
          <div className="py-16 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No patterns yet
            </h3>
            <p className="mt-2 text-gray-500">
              {profile.display_name || `@${profile.username}`} hasn&apos;t published any patterns or blocks yet.
            </p>
          </div>
        )}
      </main>

      {/* Footer with Quillty branding */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </div>
            <span className="font-medium">Quillty</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Discover & create beautiful quilting patterns
          </p>
        </div>
      </footer>
    </div>
  );
}
