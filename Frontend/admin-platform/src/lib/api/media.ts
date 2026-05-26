import apiClient from './client';
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
      apiClient.get<PaginatedResponse<MediaFile>>('/admin/media/files', { params }),
    get: (id: string) => apiClient.get<ApiResponse<MediaFile>>(`/admin/media/files/${id}`),
    upload: (formData: FormData, onProgress?: (pct: number) => void) =>
      apiClient.post<ApiResponse<MediaFile>>('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
    update: (id: string, payload: { altText?: string; filename?: string }) =>
      apiClient.patch<ApiResponse<MediaFile>>(`/admin/media/files/${id}`, payload),
    delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/admin/media/files/${id}`),
    bulkDelete: (ids: string[]) =>
      apiClient.post<ApiResponse<void>>('/admin/media/files/bulk-delete', { ids }),
    signedUrl: (id: string) =>
      apiClient.get<ApiResponse<{ url: string; expiresAt: string }>>(`/admin/media/files/${id}/signed-url`),
  },

  folders: {
    list: () => apiClient.get<ApiResponse<MediaFolder[]>>('/admin/media/folders'),
    create: (payload: { name: string; parentId?: string }) =>
      apiClient.post<ApiResponse<MediaFolder>>('/admin/media/folders', payload),
    delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/admin/media/folders/${id}`),
  },
};
