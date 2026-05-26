import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { cmsContentApi } from '@/lib/api/cms-content';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  CreateContentPayload,
  UpdateContentPayload,
  ContentListParams,
} from '@/lib/types/cms-content.types';

export const contentKeys = {
  all: ['cms', 'content'] as const,
  list: (params?: ContentListParams) => [...contentKeys.all, 'list', params] as const,
  detail: (id: string) => [...contentKeys.all, 'detail', id] as const,
  revisions: (id: string) => [...contentKeys.all, 'revisions', id] as const,
};

export const useContentList = (params: ContentListParams) =>
  useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => cmsContentApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: !!params.websiteId,
  });

export const useContentItem = (id: string) =>
  useQuery({
    queryKey: contentKeys.detail(id),
    queryFn: () => cmsContentApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useContentRevisions = (contentId: string) =>
  useQuery({
    queryKey: contentKeys.revisions(contentId),
    queryFn: () => cmsContentApi.revisions.list(contentId).then((r) => r.data.data),
    enabled: !!contentId,
  });

export const useCreateContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContentPayload) => cmsContentApi.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Content created');
      return res.data.data;
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateContent = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateContentPayload) => cmsContentApi.update(id, payload),
    onSuccess: (res) => {
      qc.setQueryData(contentKeys.detail(id), res.data.data);
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Content saved');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsContentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Content deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDuplicateContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsContentApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Content duplicated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRestoreRevision = (contentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: string) => cmsContentApi.revisions.restore(contentId, revisionId),
    onSuccess: (res) => {
      qc.setQueryData(contentKeys.detail(contentId), res.data.data);
      qc.invalidateQueries({ queryKey: contentKeys.revisions(contentId) });
      toast.success('Revision restored');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useBulkDeleteContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => cmsContentApi.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Items deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Autosave hook — debounced, silent (no toast)
export const useAutosave = (id: string) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markSaved = useCmsStore((s) => s.markSaved);

  const save = useCallback(
    (payload: UpdateContentPayload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await cmsContentApi.autosave(id, payload);
          markSaved(res.data.data.savedAt);
        } catch {
          // Silent — user saves manually if autosave fails
        }
      }, 2000);
    },
    [id, markSaved]
  );

  return save;
};
