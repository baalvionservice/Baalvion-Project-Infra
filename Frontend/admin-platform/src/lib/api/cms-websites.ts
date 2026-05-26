import apiClient from './client';
import type {
  Website,
  WebsiteStats,
  WebsiteMember,
  CreateWebsitePayload,
  UpdateWebsitePayload,
  AddWebsiteMemberPayload,
} from '@/lib/types/cms-website.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

export const websitesApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<Website>>('/admin/cms/websites', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<Website>>(`/admin/cms/websites/${id}`),

  stats: (id: string) =>
    apiClient.get<ApiResponse<WebsiteStats>>(`/admin/cms/websites/${id}/stats`),

  create: (payload: CreateWebsitePayload) =>
    apiClient.post<ApiResponse<Website>>('/admin/cms/websites', payload),

  update: (id: string, payload: UpdateWebsitePayload) =>
    apiClient.patch<ApiResponse<Website>>(`/admin/cms/websites/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/cms/websites/${id}`),

  activate: (id: string) =>
    apiClient.post<ApiResponse<Website>>(`/admin/cms/websites/${id}/activate`),

  suspend: (id: string) =>
    apiClient.post<ApiResponse<Website>>(`/admin/cms/websites/${id}/suspend`),

  // Members
  members: {
    list: (websiteId: string) =>
      apiClient.get<ApiResponse<WebsiteMember[]>>(`/admin/cms/websites/${websiteId}/members`),

    add: (websiteId: string, payload: AddWebsiteMemberPayload) =>
      apiClient.post<ApiResponse<WebsiteMember>>(`/admin/cms/websites/${websiteId}/members`, payload),

    updateRole: (websiteId: string, userId: number, cmsRole: string) =>
      apiClient.patch<ApiResponse<WebsiteMember>>(`/admin/cms/websites/${websiteId}/members/${userId}`, { cmsRole }),

    remove: (websiteId: string, userId: number) =>
      apiClient.delete<ApiResponse<void>>(`/admin/cms/websites/${websiteId}/members/${userId}`),
  },
};
