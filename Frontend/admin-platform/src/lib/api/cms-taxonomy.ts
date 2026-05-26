import apiClient from './client';
import type {
  WebsiteCategory,
  WebsiteTag,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ReorderCategoryPayload,
  CreateTagPayload,
} from '@/lib/types/cms-taxonomy.types';
import type { ApiResponse } from '@/lib/types/common.types';

export const cmsTaxonomyApi = {
  categories: {
    list: (websiteId: string) =>
      apiClient.get<ApiResponse<WebsiteCategory[]>>('/admin/cms/categories', {
        params: { websiteId },
      }),

    get: (id: string) =>
      apiClient.get<ApiResponse<WebsiteCategory>>(`/admin/cms/categories/${id}`),

    create: (payload: CreateCategoryPayload) =>
      apiClient.post<ApiResponse<WebsiteCategory>>('/admin/cms/categories', payload),

    update: (id: string, payload: UpdateCategoryPayload) =>
      apiClient.patch<ApiResponse<WebsiteCategory>>(`/admin/cms/categories/${id}`, payload),

    delete: (id: string) =>
      apiClient.delete<ApiResponse<void>>(`/admin/cms/categories/${id}`),

    reorder: (websiteId: string, payload: ReorderCategoryPayload) =>
      apiClient.post<ApiResponse<void>>('/admin/cms/categories/reorder', {
        websiteId,
        ...payload,
      }),
  },

  tags: {
    list: (websiteId: string) =>
      apiClient.get<ApiResponse<WebsiteTag[]>>('/admin/cms/tags', { params: { websiteId } }),

    create: (payload: CreateTagPayload) =>
      apiClient.post<ApiResponse<WebsiteTag>>('/admin/cms/tags', payload),

    delete: (id: string) =>
      apiClient.delete<ApiResponse<void>>(`/admin/cms/tags/${id}`),
  },
};
