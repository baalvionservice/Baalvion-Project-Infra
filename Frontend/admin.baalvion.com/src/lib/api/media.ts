import { cmsApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string | null;
  altText?: string;
  width?: number;
  height?: number;
  optimizedAt?: string | null;
  uploadedBy: number;
  createdAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  createdAt: string;
}

export const mediaApi = {
  files: {
    list: (params?: PaginationParams & { folderId?: string; mimeType?: string }) =>
      cmsApiClient.get<PaginatedResponse<MediaFile>>('/cms/media/files', { params }),
    get: (id: string) => cmsApiClient.get<ApiResponse<MediaFile>>(`/cms/media/files/${id}`),
    upload: (formData: FormData, onProgress?: (pct: number) => void) =>
      cmsApiClient.post<ApiResponse<MediaFile>>('/cms/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
    update: (id: string, payload: { altText?: string; filename?: string }) =>
      cmsApiClient.patch<ApiResponse<MediaFile>>(`/cms/media/files/${id}`, payload),
    delete: (id: string) => cmsApiClient.delete<ApiResponse<void>>(`/cms/media/files/${id}`),
    bulkDelete: (ids: string[]) =>
      cmsApiClient.post<ApiResponse<void>>('/cms/media/files/bulk-delete', { ids }),
    signedUrl: (id: string) =>
      cmsApiClient.get<ApiResponse<{ url: string; expiresAt: string }>>(`/cms/media/files/${id}/signed-url`),
  },

  folders: {
    list: () => cmsApiClient.get<ApiResponse<MediaFolder[]>>('/cms/media/folders'),
    create: (payload: { name: string; parentId?: string }) =>
      cmsApiClient.post<ApiResponse<MediaFolder>>('/cms/media/folders', payload),
    delete: (id: string) => cmsApiClient.delete<ApiResponse<void>>(`/cms/media/folders/${id}`),
  },
};
