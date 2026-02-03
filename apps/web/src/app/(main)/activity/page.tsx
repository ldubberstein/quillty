'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  useAuth,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationWithDetails,
} from '@quillty/api';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(user?.id);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();

  if (authLoading) {
    return <ActivitySkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-6xl">&#128276;</div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Sign in to see your activity</h1>
        <p className="mt-2 text-gray-500">Get notified when someone likes, comments, or follows you.</p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (notificationsLoading) {
    return <ActivitySkeleton />;
  }

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleMarkAllRead = () => {
    if (user && unreadCount > 0) {
      markAllRead({ userId: user.id });
    }
  };

  const handleNotificationClick = (notification: NotificationWithDetails) => {
    if (!notification.read && user) {
      markRead({ notificationId: notification.id, userId: user.id });
    }
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <h1 className="text-xl font-bold text-gray-900">Activity</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-sm font-medium text-brand hover:text-brand-dark disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Quick links */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:px-6">
          <Link
            href="/collections/liked"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            Liked
          </Link>
          <Link
            href="/collections/saved"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Saved
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
        {notifications && notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-6xl">&#128276;</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No activity yet</h2>
            <p className="mt-2 text-gray-500">
              When someone likes your work, comments, or follows you, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications?.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationWithDetails;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const getNotificationContent = () => {
    switch (notification.type) {
      case 'like':
        if (notification.pattern) {
          return (
            <>
              <span className="font-medium">
                {notification.actor?.display_name || notification.actor?.username || 'Someone'}
              </span>{' '}
              liked your pattern{' '}
              <span className="font-medium">{notification.pattern.title}</span>
            </>
          );
        }
        if (notification.block) {
          return (
            <>
              <span className="font-medium">
                {notification.actor?.display_name || notification.actor?.username || 'Someone'}
              </span>{' '}
              liked your block{' '}
              <span className="font-medium">{notification.block.name}</span>
            </>
          );
        }
        return null;
      case 'comment':
        if (notification.pattern) {
          return (
            <>
              <span className="font-medium">
                {notification.actor?.display_name || notification.actor?.username || 'Someone'}
              </span>{' '}
              commented on your pattern{' '}
              <span className="font-medium">{notification.pattern.title}</span>
            </>
          );
        }
        if (notification.block) {
          return (
            <>
              <span className="font-medium">
                {notification.actor?.display_name || notification.actor?.username || 'Someone'}
              </span>{' '}
              commented on your block{' '}
              <span className="font-medium">{notification.block.name}</span>
            </>
          );
        }
        return null;
      case 'follow':
        return (
          <>
            <span className="font-medium">
              {notification.actor?.display_name || notification.actor?.username || 'Someone'}
            </span>{' '}
            started following you
          </>
        );
      case 'purchase':
        return (
          <>
            <span className="font-medium">
              {notification.actor?.display_name || notification.actor?.username || 'Someone'}
            </span>{' '}
            purchased your pattern{' '}
            <span className="font-medium">{notification.pattern?.title}</span>
          </>
        );
      default:
        return null;
    }
  };

  const getNotificationLink = (): string => {
    if (notification.type === 'follow' && notification.actor) {
      return `/${notification.actor.username}`;
    }
    if (notification.pattern) {
      return `/pattern/${notification.pattern.id}`;
    }
    if (notification.block) {
      return `/block/${notification.block.id}`;
    }
    return '#';
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'comment':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'follow':
        return (
          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 'purchase':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <Link
      href={getNotificationLink()}
      onClick={onClick}
      className={`flex items-start gap-4 rounded-xl p-4 transition hover:bg-gray-50 ${
        !notification.read ? 'bg-brand/5' : ''
      }`}
    >
      {/* Actor avatar */}
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {notification.actor?.avatar_url ? (
            <Image
              src={notification.actor.avatar_url}
              alt={notification.actor.display_name || notification.actor.username}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-gray-600">
              {(notification.actor?.display_name || notification.actor?.username)?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        {/* Icon badge */}
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
          {getNotificationIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-gray-700">{content}</p>
        <p className="mt-1 text-sm text-gray-500">{timeAgo}</p>
      </div>

      {/* Thumbnail */}
      {(notification.pattern?.thumbnail_url || notification.block?.thumbnail_url) && (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={notification.pattern?.thumbnail_url || notification.block?.thumbnail_url || ''}
            alt=""
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Unread indicator */}
      {!notification.read && (
        <div className="shrink-0">
          <div className="h-2 w-2 rounded-full bg-brand" />
        </div>
      )}
    </Link>
  );
}

function ActivitySkeleton() {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-2 px-4 pb-3 lg:px-6">
          <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl p-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
