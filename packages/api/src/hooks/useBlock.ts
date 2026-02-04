import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Block, BlockInsert, BlockUpdate, User } from '../types/models';
import {
  createBlockApi,
  getBlockApi,
  updateBlockApi,
  publishBlockApi,
  type CreateBlockApiInput,
  type UpdateBlockApiInput,
  type ApiBlockWithCreator,
} from '../api/blocks';

export interface BlockWithDetails extends Block {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

/**
 * Fetch a single block by ID via the API
 * Uses Redis caching on the server for published blocks
 */
export function useBlock(blockId?: string) {
  return useQuery({
    queryKey: ['block', blockId],
    queryFn: async (): Promise<ApiBlockWithCreator | null> => {
      if (!blockId) return null;
      return getBlockApi(blockId);
    },
    enabled: !!blockId,
  });
}

/**
 * Input for creating a block via the hook
 * Accepts either the API input format or the legacy database format
 */
export type CreateBlockHookInput = CreateBlockApiInput | BlockInsert;

export function useCreateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlockHookInput): Promise<Block> => {
      // Convert to API input format if needed
      const apiInput: CreateBlockApiInput =
        'gridSize' in input
          ? input
          : {
              name: input.name,
              description: input.description,
              gridSize: (input.grid_size || 3) as 2 | 3 | 4,
              designData: input.design_data as CreateBlockApiInput['designData'],
              difficulty: input.difficulty,
              thumbnailUrl: input.thumbnail_url,
            };

      return createBlockApi(apiInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}

/**
 * Input for updating a block via the hook
 * Accepts either the API input format or the legacy database format
 */
export type UpdateBlockHookInput = (UpdateBlockApiInput | BlockUpdate) & { id: string };

function isApiUpdateInput(input: UpdateBlockApiInput | BlockUpdate): input is UpdateBlockApiInput {
  return 'gridSize' in input || 'designData' in input || 'thumbnailUrl' in input;
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBlockHookInput): Promise<Block> => {
      const { id, ...updates } = input;

      // Convert to API input format if needed
      let apiInput: UpdateBlockApiInput;
      if (isApiUpdateInput(updates)) {
        apiInput = updates;
      } else {
        // Legacy BlockUpdate format
        const dbUpdate = updates as BlockUpdate;
        apiInput = {
          name: dbUpdate.name,
          description: dbUpdate.description,
          gridSize: dbUpdate.grid_size as 2 | 3 | 4 | undefined,
          designData: dbUpdate.design_data as UpdateBlockApiInput['designData'],
          difficulty: dbUpdate.difficulty,
          thumbnailUrl: dbUpdate.thumbnail_url,
        };
      }

      return updateBlockApi(id, apiInput);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['block', data.id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useBlockLibrary() {
  return useQuery({
    queryKey: ['blocks', 'library'],
    queryFn: async (): Promise<Block[]> => {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('status', 'published')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return (data || []) as Block[];
    },
  });
}

export function useMyDraftBlocks(userId?: string) {
  return useQuery({
    queryKey: ['blocks', 'drafts', userId],
    queryFn: async (): Promise<Block[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('creator_id', userId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Block[];
    },
    enabled: !!userId,
  });
}

export function usePublishBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description?: string;
    }): Promise<Block> => {
      // First update the name/description if provided
      if (name || description !== undefined) {
        await updateBlockApi(id, { name, description });
      }
      // Then publish via the API
      return publishBlockApi(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['block', data.id] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'drafts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
