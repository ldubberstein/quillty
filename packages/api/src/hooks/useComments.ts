import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Comment, User } from '../types/models';

export interface CommentWithUser extends Comment {
  user: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export function useComments(
  contentId: string | undefined,
  contentType: 'pattern' | 'block'
) {
  return useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: async (): Promise<CommentWithUser[]> => {
      if (!contentId) return [];

      const column = contentType === 'pattern' ? 'pattern_id' : 'block_id';
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq(column, contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CommentWithUser[];
    },
    enabled: !!contentId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      contentId,
      contentType,
      content,
    }: {
      userId: string;
      contentId: string;
      contentType: 'pattern' | 'block';
      content: string;
    }): Promise<Comment> => {
      const insertData =
        contentType === 'pattern'
          ? { user_id: userId, pattern_id: contentId, content }
          : { user_id: userId, block_id: contentId, content };

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (_data, { contentId, contentType }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', contentType, contentId],
      });
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      queryClient.invalidateQueries({ queryKey: [contentKey, contentId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
      contentId: string;
      contentType: 'pattern' | 'block';
    }): Promise<Comment> => {
      const { data, error } = await supabase
        .from('comments')
        .update({ content } as never)
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (_data, { contentId, contentType }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', contentType, contentId],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      contentId: string;
      contentType: 'pattern' | 'block';
    }): Promise<void> => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: (_data, { contentId, contentType }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', contentType, contentId],
      });
      const contentKey = contentType === 'pattern' ? 'pattern' : 'block';
      queryClient.invalidateQueries({ queryKey: [contentKey, contentId] });
    },
  });
}
