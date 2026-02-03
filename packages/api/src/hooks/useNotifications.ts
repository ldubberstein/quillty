import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Notification, User, Pattern, Block } from '../types/models';

export interface NotificationWithDetails extends Notification {
  actor?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  pattern?: Pick<Pattern, 'id' | 'title' | 'thumbnail_url'>;
  block?: Pick<Block, 'id' | 'name' | 'thumbnail_url'>;
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<NotificationWithDetails[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:users!notifications_actor_id_fkey(id, username, display_name, avatar_url),
          pattern:quilt_patterns(id, title, thumbnail_url),
          block:blocks(id, name, thumbnail_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NotificationWithDetails[];
    },
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-notification-count', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
    }: {
      notificationId: string;
      userId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as never)
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', userId],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }): Promise<void> => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as never)
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', userId],
      });
    },
  });
}
