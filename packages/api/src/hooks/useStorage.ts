import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File | Blob): Promise<string> => {
      if (!user?.id) throw new Error('Not authenticated');

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl } as never)
        .eq('id', user.id);

      if (updateError) throw updateError;

      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useUploadPatternThumbnail() {
  return useMutation({
    mutationFn: async ({
      patternId,
      file,
    }: {
      patternId: string;
      file: File | Blob;
    }): Promise<string> => {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${patternId}/thumbnail.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pattern-thumbnails')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pattern-thumbnails')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
  });
}

export function useUploadBlockThumbnail() {
  return useMutation({
    mutationFn: async ({
      blockId,
      file,
    }: {
      blockId: string;
      file: File | Blob;
    }): Promise<string> => {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${blockId}/thumbnail.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('block-thumbnails')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('block-thumbnails')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
  });
}
