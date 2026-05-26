import apiClient from './client';
import type {
  ContentItem,
  ContentRevision,
  CreateContentPayload,
  UpdateContentPayload,
  ContentListParams,
} from '@/lib/types/cms-content.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

export const cmsContentApi = {
  list: (params: ContentListParams) =>
    apiClient.get<PaginatedResponse<ContentItem>>('/admin/cms/content', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<ContentItem>>(`/admin/cms/content/${id}`),

  create: (payload: CreateContentPayload) =>
    apiClient.post<ApiResponse<ContentItem>>('/admin/cms/content', payload),

  update: (id: string, payload: UpdateContentPayload) =>
    apiClient.patch<ApiResponse<ContentItem>>(`/admin/cms/content/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/cms/content/${id}`),

  duplicate: (id: string) =>
    apiClient.post<ApiResponse<ContentItem>>(`/admin/cms/content/${id}/duplicate`),

  // Revisions
  revisions: {
    list: (contentId: string) =>
      apiClient.get<ApiResponse<ContentRevision[]>>(`/admin/cms/content/${contentId}/revisions`),

    get: (contentId: string, revisionId: string) =>
      apiClient.get<ApiResponse<ContentRevision>>(`/admin/cms/content/${contentId}/revisions/${revisionId}`),

    restore: (contentId: string, revisionId: string) =>
      apiClient.post<ApiResponse<ContentItem>>(
        `/admin/cms/content/${contentId}/revisions/${revisionId}/restore`
      ),
  },

  // Autosave
  autosave: (id: string, payload: UpdateContentPayload) =>
    apiClient.patch<ApiResponse<{ savedAt: string }>>(`/admin/cms/content/${id}/autosave`, payload),

  // Bulk operations
  bulkUpdateStatus: (ids: string[], status: string) =>
    apiClient.post<ApiResponse<void>>('/admin/cms/content/bulk/status', { ids, status }),

  bulkDelete: (ids: string[]) =>
    apiClient.post<ApiResponse<void>>('/admin/cms/content/bulk/delete', { ids }),
};
