'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useComments, useAddComment, useDeleteComment, type CommentWithUser } from '@quillty/api';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  contentId: string;
  contentType: 'pattern' | 'block';
  currentUserId?: string;
  commentCount: number;
}

export function CommentSection({
  contentId,
  contentType,
  currentUserId,
  commentCount,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments, isLoading } = useComments(contentId, contentType);
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();

  const MAX_COMMENT_LENGTH = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim() || newComment.length > MAX_COMMENT_LENGTH) return;

    addComment(
      {
        userId: currentUserId,
        contentId,
        contentType,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment('');
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    deleteComment({ commentId, contentId, contentType });
  };

  return (
    <div className="border-t border-gray-100 pt-6">
      <h3 className="font-semibold text-gray-900">
        Comments {commentCount > 0 && `(${commentCount})`}
      </h3>

      {/* Comment Input */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            maxLength={MAX_COMMENT_LENGTH}
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs ${newComment.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
              {newComment.length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              type="submit"
              disabled={isAdding || !newComment.trim()}
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdding ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-gray-600">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>{' '}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={currentUserId === comment.user_id}
              onDelete={() => handleDelete(comment.id)}
            />
          ))
        ) : (
          <p className="py-8 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: CommentWithUser;
  isOwner: boolean;
  onDelete: () => void;
}

function CommentItem({ comment, isOwner, onDelete }: CommentItemProps) {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className="flex gap-3">
      <Link href={`/${comment.user.username}`} className="shrink-0">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {comment.user.avatar_url ? (
            <Image
              src={comment.user.avatar_url}
              alt={comment.user.display_name || comment.user.username}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {(comment.user.display_name || comment.user.username)?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${comment.user.username}`}
            className="font-medium text-gray-900 hover:underline"
          >
            {comment.user.display_name || comment.user.username}
          </Link>
          <span className="text-xs text-gray-400">{timeAgo}</span>
          {isOwner && (
            <button
              onClick={onDelete}
              className="ml-auto text-xs text-gray-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-gray-700">{comment.content}</p>
      </div>
    </div>
  );
}

// Scroll-to-comments button for detail pages
export function CommentButton({
  commentCount,
  onClick,
}: {
  commentCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-none"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {commentCount > 0 ? `${commentCount} Comments` : 'Comment'}
    </button>
  );
}
