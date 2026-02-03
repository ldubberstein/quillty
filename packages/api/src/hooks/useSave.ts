import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Save, User, Pattern, Block } from '../types/models';

export interface SaveWithContent extends Save {
  pattern?: Pick<Pattern, 'id' | 'title' | 'thumbnail_url' | 'creator_id'> & {
    creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  };
  block?: Pick<Block, 'id' | 'name' | 'thumbnail_url' | 'creator_id'> & {
    creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  };
}

export function useSaveStatus(
  userId: string | undefined,
  contentId: string | undefined,
  contentType: 'pattern' | 'block'
) {
  return useQuery({
    queryKey: ['save-status', userId, contentType, contentId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !contentId) return false;

      const column = contentType === 'pattern' ? 'pattern_id' : 'block_id';
      const { data, error } = await supabase
        .from('saves')
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

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      contentId,
      contentType,
      isSaved,
    }: {
      userId: string;
      contentId: string;
      contentType: 'pattern' | 'block';
      isSaved: boolean;
    }): Promise<void> => {
      const column = contentType === 'pattern' ? 'pattern_id' : 'block_id';

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', userId)
          .eq(column, contentId);
        if (error) throw error;
      } else {
        // Save
        const insertData =
          contentType === 'pattern'
            ? { user_id: userId, pattern_id: contentId }
            : { user_id: userId, block_id: contentId };
        const { error } = await supabase.from('saves').insert(insertData as never);
        if (error) throw error;
      }
    },
    onMutate: async ({ userId, contentId, contentType, isSaved }) => {
      await queryClient.cancelQueries({
        queryKey: ['save-status', userId, contentType, contentId],
      });

      const previousStatus = queryClient.getQueryData<boolean>([
        'save-status',
        userId,
        contentType,
        contentId,
      ]);

      queryClient.setQueryData(
        ['save-status', userId, contentType, contentId],
        !isSaved
      );

      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      const previousContent = queryClient.getQueryData([contentKey, contentId]);
      if (previousContent) {
        queryClient.setQueryData([contentKey, contentId], (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const typedOld = old as { save_count?: number };
          return {
            ...typedOld,
            save_count: (typedOld.save_count ?? 0) + (isSaved ? -1 : 1),
          };
        });
      }

      return { previousStatus, previousContent };
    },
    onError: (_err, { userId, contentId, contentType }, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          ['save-status', userId, contentType, contentId],
          context.previousStatus
        );
      }
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      if (context?.previousContent) {
        queryClient.setQueryData([contentKey, contentId], context.previousContent);
      }
    },
    onSettled: (_data, _error, { userId, contentId, contentType }) => {
      queryClient.invalidateQueries({
        queryKey: ['save-status', userId, contentType, contentId],
      });
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      queryClient.invalidateQueries({ queryKey: [contentKey, contentId] });
      queryClient.invalidateQueries({ queryKey: ['user-saves', userId] });
    },
  });
}

export function useUserSaves(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-saves', userId],
    queryFn: async (): Promise<SaveWithContent[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('saves')
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
      return data as SaveWithContent[];
    },
    enabled: !!userId,
  });
}
