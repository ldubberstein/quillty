'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useProfile } from '@quillty/api';

const navItems = [
  { href: '/feed', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/create', label: 'Create', icon: 'plus' },
  { href: '/activity', label: 'Activity', icon: 'heart' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile } = useProfile();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <svg
                className="h-5 w-5 text-white"
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
            <span className="text-xl font-bold text-gray-900">Quillty</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${item.icon === 'plus' ? 'mt-4 bg-brand text-white hover:bg-brand-dark hover:text-white' : ''}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-4">
          {authLoading ? (
            <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {profile?.display_name?.[0] || profile?.username?.[0] || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {profile?.display_name || profile?.username}
                </p>
                <p className="truncate text-xs text-gray-500">@{profile?.username}</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 ${
                  item.icon === 'plus'
                    ? '-mt-3 rounded-full bg-brand p-3'
                    : ''
                }`}
              >
                <NavIcon
                  name={item.icon}
                  className={
                    item.icon === 'plus'
                      ? 'text-white'
                      : isActive
                        ? 'text-brand'
                        : 'text-gray-400'
                  }
                />
                {item.icon !== 'plus' && (
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-brand' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
          <Link
            href={user ? '/settings/profile' : '/login'}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5"
          >
            <NavIcon
              name="user"
              className={pathname.startsWith('/settings') ? 'text-brand' : 'text-gray-400'}
            />
            <span
              className={`text-[10px] font-medium ${
                pathname.startsWith('/settings') ? 'text-brand' : 'text-gray-400'
              }`}
            >
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

function NavIcon({ name, className = '' }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    search: (
      <svg className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    plus: (
      <svg className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    heart: (
      <svg className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    user: (
      <svg className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return icons[name] || null;
}
