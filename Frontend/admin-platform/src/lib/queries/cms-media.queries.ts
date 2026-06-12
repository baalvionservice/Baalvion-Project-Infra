'use client';

// Media is stored org-wide in cms-service (cms_media_assets has org_id, no website_id),
// so the library is shared across the org's websites. These hooks wrap the real
// mediaApi (upload / list / update / delete) with cache invalidation.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mediaApi, type MediaFile } from '@/lib/api/media';
import type { PaginationParams } from '@/lib/types/common.types';

export const mediaKeys = {
  all: ['cms', 'media'] as const,
  list: (params?: Record<string, unknown>) => [...mediaKeys.all, 'list', params] as const,
};

export const useMediaFiles = (params?: PaginationParams & { folderId?: string; mimeType?: string }) =>
  useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => mediaApi.files.list(params).then((r) => r.data),
    staleTime: 30_000,
  });

export const useUploadMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: string }) => {
      const fd = new FormData();
      fd.append('file', file);
      if (folderId) fd.append('folderId', folderId);
      return mediaApi.files.upload(fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mediaKeys.all }),
    onError: (e: { message: string }) => toast.error(e.message || 'Upload failed'),
  });
};

export const useUpdateMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { altText?: string; filename?: string } }) =>
      mediaApi.files.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success('File updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.files.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success('File deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// No backend "replace in place" exists — emulate it by uploading the new file then
// deleting the old asset. The new asset gets a fresh id/URL (references must be repointed).
export const useReplaceMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldId, file }: { oldId: string; file: File }): Promise<MediaFile> => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await mediaApi.files.upload(fd);
      await mediaApi.files.delete(oldId);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success('File replaced');
    },
    onError: (e: { message: string }) => toast.error(e.message || 'Replace failed'),
  });
};
