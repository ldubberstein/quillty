import { useQuery } from '@tanstack/react-query';
import { getMyBlocksApi, type GetMyBlocksOptions, type BlockListResponse } from '../api/blocks';

/**
 * Hook to fetch the current user's blocks
 * Requires the user to be authenticated
 */
export function useMyBlocks(options: GetMyBlocksOptions = {}) {
  const { status, limit = 50, offset = 0 } = options;

  return useQuery({
    queryKey: ['myBlocks', { status, limit, offset }],
    queryFn: async (): Promise<BlockListResponse> => {
      return getMyBlocksApi({ status, limit, offset });
    },
    // Don't retry on 401 (authentication errors)
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch only the current user's published blocks
 * Useful for the Pattern Designer block library
 */
export function useMyPublishedBlocks(limit = 50) {
  return useMyBlocks({ status: 'published', limit });
}

/**
 * Hook to fetch only the current user's draft blocks
 */
export function useMyDraftBlocks(limit = 50) {
  return useMyBlocks({ status: 'draft', limit });
}
