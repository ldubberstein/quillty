import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Pattern, PatternInsert, PatternUpdate, User } from '../types/models';

export interface PatternWithDetails extends Pattern {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export function usePattern(patternId?: string) {
  return useQuery({
    queryKey: ['pattern', patternId],
    queryFn: async (): Promise<PatternWithDetails | null> => {
      if (!patternId) return null;

      const { data, error } = await supabase
        .from('quilt_patterns')
        .select(`
          *,
          creator:users!quilt_patterns_creator_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('id', patternId)
        .single();

      if (error) throw error;
      return data as PatternWithDetails;
    },
    enabled: !!patternId,
  });
}

export function useCreatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pattern: PatternInsert): Promise<Pattern> => {
      const { data, error } = await supabase
        .from('quilt_patterns')
        .insert(pattern as never)
        .select()
        .single();

      if (error) throw error;
      return data as Pattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUpdatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: PatternUpdate & { id: string }): Promise<Pattern> => {
      const { data, error } = await supabase
        .from('quilt_patterns')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Pattern;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pattern', data.id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
