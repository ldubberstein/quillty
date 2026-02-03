import Link from 'next/link';
import Image from 'next/image';
import type { FollowWithUser } from '@quillty/api';
import { FollowButton } from './FollowButton';

interface UserRowProps {
  follow: FollowWithUser;
  currentUserId?: string;
}

export function UserRow({ follow, currentUserId }: UserRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <Link href={`/${follow.user.username}`} className="shrink-0">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {follow.user.avatar_url ? (
            <Image
              src={follow.user.avatar_url}
              alt={follow.user.display_name || follow.user.username}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-gray-600">
              {(follow.user.display_name || follow.user.username)?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </Link>
      <Link href={`/${follow.user.username}`} className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">
          {follow.user.display_name || follow.user.username}
        </p>
        <p className="truncate text-sm text-gray-500">@{follow.user.username}</p>
        {follow.user.bio && (
          <p className="mt-1 line-clamp-1 text-sm text-gray-600">{follow.user.bio}</p>
        )}
      </Link>
      <FollowButton
        currentUserId={currentUserId}
        targetUserId={follow.user.id}
        variant="small"
      />
    </div>
  );
}
