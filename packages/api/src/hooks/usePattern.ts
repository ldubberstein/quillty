import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Pattern, PatternInsert, PatternUpdate, User } from '../types/models';
import {
  createPatternApi,
  getPatternApi,
  updatePatternApi,
  publishPatternApi,
  type CreatePatternApiInput,
  type UpdatePatternApiInput,
  type PublishPatternApiInput,
  type ApiPatternWithCreator,
} from '../api/patterns';

export interface PatternWithDetails extends Pattern {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

/**
 * Fetch a single pattern by ID via the API
 * Uses Redis caching on the server for published patterns
 */
export function usePattern(patternId?: string) {
  return useQuery({
    queryKey: ['pattern', patternId],
    queryFn: async (): Promise<ApiPatternWithCreator | null> => {
      if (!patternId) return null;
      return getPatternApi(patternId);
    },
    enabled: !!patternId,
  });
}

/**
 * Legacy pattern fetch using direct Supabase
 * @deprecated Use usePattern instead which uses the API with caching
 */
export function usePatternDirect(patternId?: string) {
  return useQuery({
    queryKey: ['pattern', 'direct', patternId],
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

/**
 * Input for creating a pattern via the hook
 * Accepts either the API input format or the legacy database format
 */
export type CreatePatternHookInput = CreatePatternApiInput | PatternInsert;

export function useCreatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePatternHookInput): Promise<Pattern> => {
      // Convert to API input format if needed
      if ('designData' in input) {
        return createPatternApi(input);
      }

      // Legacy format - use direct Supabase
      const { data, error } = await supabase
        .from('quilt_patterns')
        .insert(input as never)
        .select()
        .single();

      if (error) throw error;
      return data as Pattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
    },
  });
}

/**
 * Input for updating a pattern via the hook
 * Accepts either the API input format or the legacy database format
 */
export type UpdatePatternHookInput = (UpdatePatternApiInput | PatternUpdate) & { id: string };

function isApiUpdateInput(input: UpdatePatternApiInput | PatternUpdate): input is UpdatePatternApiInput {
  return 'designData' in input || 'thumbnailUrl' in input;
}

export function useUpdatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePatternHookInput): Promise<Pattern> => {
      const { id, ...updates } = input;

      // Convert to API input format if needed
      if (isApiUpdateInput(updates)) {
        return updatePatternApi(id, updates);
      }

      // Legacy format - use direct Supabase
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

export function usePublishPattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      publishInput,
    }: {
      id: string;
      title: string;
      description?: string;
      publishInput: PublishPatternApiInput;
    }): Promise<Pattern> => {
      // First update the title/description if provided
      if (title || description !== undefined) {
        await updatePatternApi(id, { title, description });
      }
      // Then publish via the API
      return publishPatternApi(id, publishInput);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pattern', data.id] });
      queryClient.invalidateQueries({ queryKey: ['patterns', 'drafts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
