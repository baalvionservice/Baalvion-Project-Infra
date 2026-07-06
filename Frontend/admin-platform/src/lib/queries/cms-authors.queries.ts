import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsAuthorsApi } from '@/lib/api/cms-authors';
import type {
  CreateAuthorPayload,
  UpdateAuthorPayload,
} from '@/lib/types/cms-authors.types';

export const authorKeys = {
  all: ['cms', 'authors'] as const,
  list: (websiteId: string) => [...authorKeys.all, websiteId] as const,
};

export const useWebsiteAuthors = (websiteId: string) =>
  useQuery({
    queryKey: authorKeys.list(websiteId),
    queryFn: () => cmsAuthorsApi.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 5 * 60_000,
  });

export const useCreateAuthor = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAuthorPayload) => cmsAuthorsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.list(websiteId) });
      toast.success('Author created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateAuthor = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAuthorPayload }) =>
      cmsAuthorsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.list(websiteId) });
      toast.success('Author updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteAuthor = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsAuthorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.list(websiteId) });
      toast.success('Author deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
