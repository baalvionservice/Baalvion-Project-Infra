import apiClient from './client';
import type {
  CmsPage,
  CmsPost,
  Category,
  Tag,
  CreatePagePayload,
  CreatePostPayload,
} from '@/lib/types/cms.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export const cmsApi = {
  // Pages
  pages: {
    list: (params?: PaginationParams & { status?: string }) =>
      apiClient.get<PaginatedResponse<CmsPage>>('/admin/cms/pages', { params }),
    get: (id: number) => apiClient.get<ApiResponse<CmsPage>>(`/admin/cms/pages/${id}`),
    create: (payload: CreatePagePayload) =>
      apiClient.post<ApiResponse<CmsPage>>('/admin/cms/pages', payload),
    update: (id: number, payload: Partial<CreatePagePayload>) =>
      apiClient.patch<ApiResponse<CmsPage>>(`/admin/cms/pages/${id}`, payload),
    publish: (id: number) =>
      apiClient.post<ApiResponse<CmsPage>>(`/admin/cms/pages/${id}/publish`),
    unpublish: (id: number) =>
      apiClient.post<ApiResponse<CmsPage>>(`/admin/cms/pages/${id}/unpublish`),
    delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/cms/pages/${id}`),
  },

  // Posts
  posts: {
    list: (params?: PaginationParams & { status?: string; categoryId?: number }) =>
      apiClient.get<PaginatedResponse<CmsPost>>('/admin/cms/posts', { params }),
    get: (id: number) => apiClient.get<ApiResponse<CmsPost>>(`/admin/cms/posts/${id}`),
    create: (payload: CreatePostPayload) =>
      apiClient.post<ApiResponse<CmsPost>>('/admin/cms/posts', payload),
    update: (id: number, payload: Partial<CreatePostPayload>) =>
      apiClient.patch<ApiResponse<CmsPost>>(`/admin/cms/posts/${id}`, payload),
    publish: (id: number) =>
      apiClient.post<ApiResponse<CmsPost>>(`/admin/cms/posts/${id}/publish`),
    delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/cms/posts/${id}`),
  },

  // Categories
  categories: {
    list: () => apiClient.get<ApiResponse<Category[]>>('/admin/cms/categories'),
    create: (payload: { name: string; slug: string; description?: string; parentId?: number }) =>
      apiClient.post<ApiResponse<Category>>('/admin/cms/categories', payload),
    update: (id: number, payload: Partial<Category>) =>
      apiClient.patch<ApiResponse<Category>>(`/admin/cms/categories/${id}`, payload),
    delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/cms/categories/${id}`),
  },

  // Tags
  tags: {
    list: () => apiClient.get<ApiResponse<Tag[]>>('/admin/cms/tags'),
    create: (payload: { name: string; slug: string }) =>
      apiClient.post<ApiResponse<Tag>>('/admin/cms/tags', payload),
    delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/cms/tags/${id}`),
  },
};
