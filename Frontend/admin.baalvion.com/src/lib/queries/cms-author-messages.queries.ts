import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsAuthorMessagesApi } from '@/lib/api/cms-author-messages';
import type { PaginationParams } from '@/lib/types/common.types';

export const authorMessageKeys = {
  all: ['cms', 'author-messages'] as const,
  list: (websiteId: string, params?: PaginationParams) => [...authorMessageKeys.all, websiteId, params] as const,
};

export const useAuthorMessages = (websiteId: string, params?: PaginationParams) =>
  useQuery({
    queryKey: authorMessageKeys.list(websiteId, params),
    queryFn: () => cmsAuthorMessagesApi.list(websiteId, params).then((r) => r.data),
    enabled: !!websiteId,
    staleTime: 30_000,
  });

export const useMarkAuthorMessageRead = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsAuthorMessagesApi.markRead(websiteId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: authorMessageKeys.all }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useMarkAuthorMessageUnread = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsAuthorMessagesApi.markUnread(websiteId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: authorMessageKeys.all }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
