import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { User } from '../types/models';

export interface FollowWithUser {
  follower_id: string;
  followed_id: string;
  created_at: string;
  user: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'bio'>;
}

export function useFollowStatus(
  followerId: string | undefined,
  followedId: string | undefined
) {
  return useQuery({
    queryKey: ['follow-status', followerId, followedId],
    queryFn: async (): Promise<boolean> => {
      if (!followerId || !followedId || followerId === followedId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('followed_id', followedId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!followerId && !!followedId && followerId !== followedId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followerId,
      followedId,
      isFollowing,
    }: {
      followerId: string;
      followedId: string;
      isFollowing: boolean;
    }): Promise<void> => {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('followed_id', followedId);
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: followerId, followed_id: followedId } as never);
        if (error) throw error;
      }
    },
    onMutate: async ({ followerId, followedId, isFollowing }) => {
      await queryClient.cancelQueries({
        queryKey: ['follow-status', followerId, followedId],
      });

      const previousStatus = queryClient.getQueryData<boolean>([
        'follow-status',
        followerId,
        followedId,
      ]);

      queryClient.setQueryData(
        ['follow-status', followerId, followedId],
        !isFollowing
      );

      // Optimistically update follower count on the followed user
      const previousUser = queryClient.getQueryData(['user', followedId]);
      if (previousUser) {
        queryClient.setQueryData(['user', followedId], (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const typedOld = old as { follower_count?: number };
          return {
            ...typedOld,
            follower_count: (typedOld.follower_count ?? 0) + (isFollowing ? -1 : 1),
          };
        });
      }

      return { previousStatus, previousUser };
    },
    onError: (_err, { followerId, followedId }, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          ['follow-status', followerId, followedId],
          context.previousStatus
        );
      }
      if (context?.previousUser) {
        queryClient.setQueryData(['user', followedId], context.previousUser);
      }
    },
    onSettled: (_data, _error, { followerId, followedId }) => {
      queryClient.invalidateQueries({
        queryKey: ['follow-status', followerId, followedId],
      });
      queryClient.invalidateQueries({ queryKey: ['user', followedId] });
      queryClient.invalidateQueries({ queryKey: ['user-followers', followedId] });
      queryClient.invalidateQueries({ queryKey: ['user-following', followerId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUserFollowers(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-followers', userId],
    queryFn: async (): Promise<FollowWithUser[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          followed_id,
          created_at,
          user:users!follows_follower_id_fkey(id, username, display_name, avatar_url, bio)
        `)
        .eq('followed_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FollowWithUser[];
    },
    enabled: !!userId,
  });
}

export function useUserFollowing(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-following', userId],
    queryFn: async (): Promise<FollowWithUser[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          followed_id,
          created_at,
          user:users!follows_followed_id_fkey(id, username, display_name, avatar_url, bio)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FollowWithUser[];
    },
    enabled: !!userId,
  });
}
