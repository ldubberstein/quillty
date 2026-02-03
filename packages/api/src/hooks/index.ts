export { useUser, useUserByUsername } from './useUser';
export {
  useFeed,
  type FeedItem,
  type PatternWithCreator,
  type BlockWithCreator,
} from './useFeed';
export {
  usePattern,
  useCreatePattern,
  useUpdatePattern,
  type PatternWithDetails,
} from './usePattern';
export {
  useBlock,
  useCreateBlock,
  useUpdateBlock,
  useBlockLibrary,
  type BlockWithDetails,
} from './useBlock';
export {
  useAuth,
  useProfile,
  useUpdateProfile,
  useSignUp,
  useSignIn,
  useSignInWithGoogle,
  useSignInWithApple,
  useSignOut,
  useResetPassword,
  useUpdatePassword,
  useCheckUsername,
} from './useAuth';
export { useUploadAvatar } from './useStorage';

// Social hooks
export {
  useLikeStatus,
  useToggleLike,
  useUserLikes,
  type LikeWithContent,
} from './useLike';
export {
  useSaveStatus,
  useToggleSave,
  useUserSaves,
  type SaveWithContent,
} from './useSave';
export {
  useFollowStatus,
  useToggleFollow,
  useUserFollowers,
  useUserFollowing,
  type FollowWithUser,
} from './useFollow';
export {
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  type CommentWithUser,
} from './useComments';
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationWithDetails,
} from './useNotifications';
