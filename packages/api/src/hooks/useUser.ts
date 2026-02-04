import { useQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import type { User } from '../types/models';
import { getUserProfileApi, type ApiUserProfile } from '../api/users';

/**
 * Fetch user by ID (direct Supabase - typically for current user)
 */
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

/**
 * Fetch user profile by username via the API
 * Uses Redis caching on the server (5 min TTL)
 * Includes block_count, pattern_count, and is_following
 */
export function useUserByUsername(username?: string) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async (): Promise<ApiUserProfile | null> => {
      if (!username) return null;
      return getUserProfileApi(username);
    },
    enabled: !!username,
  });
}

// Re-export the API type for consumers
export type { ApiUserProfile };
