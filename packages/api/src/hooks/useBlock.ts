import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import type { Block, BlockInsert, BlockUpdate, User } from '../types/models';

export interface BlockWithDetails extends Block {
  creator?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export function useBlock(blockId?: string) {
  return useQuery({
    queryKey: ['block', blockId],
    queryFn: async (): Promise<BlockWithDetails | null> => {
      if (!blockId) return null;

      const { data, error } = await supabase
        .from('blocks')
        .select(`
          *,
          creator:users!blocks_creator_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('id', blockId)
        .single();

      if (error) throw error;
      return data as BlockWithDetails;
    },
    enabled: !!blockId,
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (block: BlockInsert): Promise<Block> => {
      const { data, error } = await supabase
        .from('blocks')
        .insert(block as never)
        .select()
        .single();

      if (error) throw error;
      return data as Block;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: BlockUpdate & { id: string }): Promise<Block> => {
      const { data, error } = await supabase
        .from('blocks')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Block;
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
      const { data, error } = await supabase
        .from('blocks')
        .update({
          name,
          description,
          status: 'published',
          published_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Block;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['block', data.id] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'drafts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
