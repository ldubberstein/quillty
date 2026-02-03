import { useQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import type { User } from '../types/models';

export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<User | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!userId,
  });
}

export function useUserByUsername(username?: string) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async (): Promise<User | null> => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!username,
  });
}
