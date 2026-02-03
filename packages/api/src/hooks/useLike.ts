import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Like, User, Pattern, Block } from '../types/models';

export interface LikeWithContent extends Like {
  pattern?: Pick<Pattern, 'id' | 'title' | 'thumbnail_url' | 'creator_id'> & {
    creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  };
  block?: Pick<Block, 'id' | 'name' | 'thumbnail_url' | 'creator_id'> & {
    creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  };
}

export function useLikeStatus(
  userId: string | undefined,
  contentId: string | undefined,
  contentType: 'pattern' | 'block'
) {
  return useQuery({
    queryKey: ['like-status', userId, contentType, contentId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !contentId) return false;

      const column = contentType === 'pattern' ? 'pattern_id' : 'block_id';
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq(column, contentId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!contentId,
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      contentId,
      contentType,
      isLiked,
    }: {
      userId: string;
      contentId: string;
      contentType: 'pattern' | 'block';
      isLiked: boolean;
    }): Promise<void> => {
      const column = contentType === 'pattern' ? 'pattern_id' : 'block_id';

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq(column, contentId);
        if (error) throw error;
      } else {
        // Like
        const insertData =
          contentType === 'pattern'
            ? { user_id: userId, pattern_id: contentId }
            : { user_id: userId, block_id: contentId };
        const { error } = await supabase.from('likes').insert(insertData as never);
        if (error) throw error;
      }
    },
    onMutate: async ({ userId, contentId, contentType, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['like-status', userId, contentType, contentId],
      });

      // Snapshot previous value
      const previousStatus = queryClient.getQueryData<boolean>([
        'like-status',
        userId,
        contentType,
        contentId,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['like-status', userId, contentType, contentId],
        !isLiked
      );

      // Also optimistically update the count on the content
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      const previousContent = queryClient.getQueryData([contentKey, contentId]);
      if (previousContent) {
        queryClient.setQueryData([contentKey, contentId], (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const typedOld = old as { like_count?: number };
          return {
            ...typedOld,
            like_count: (typedOld.like_count ?? 0) + (isLiked ? -1 : 1),
          };
        });
      }

      return { previousStatus, previousContent };
    },
    onError: (_err, { userId, contentId, contentType }, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          ['like-status', userId, contentType, contentId],
          context.previousStatus
        );
      }
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      if (context?.previousContent) {
        queryClient.setQueryData([contentKey, contentId], context.previousContent);
      }
    },
    onSettled: (_data, _error, { userId, contentId, contentType }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['like-status', userId, contentType, contentId],
      });
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      queryClient.invalidateQueries({ queryKey: [contentKey, contentId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUserLikes(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-likes', userId],
    queryFn: async (): Promise<LikeWithContent[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          pattern:quilt_patterns(
            id, title, thumbnail_url, creator_id,
            creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
          ),
          block:blocks(
            id, name, thumbnail_url, creator_id,
            creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LikeWithContent[];
    },
    enabled: !!userId,
  });
}
