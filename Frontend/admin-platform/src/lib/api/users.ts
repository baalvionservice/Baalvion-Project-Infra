import apiClient from './client';
import type { AdminUser, UserDetail, UpdateUserPayload, SuspendUserPayload } from '@/lib/types/user.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export const usersApi = {
  list: (params?: PaginationParams & { status?: string; role?: string }) =>
    apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params }),

  get: (id: number) => apiClient.get<ApiResponse<UserDetail>>(`/admin/users/${id}`),

  update: (id: number, payload: UpdateUserPayload) =>
    apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, payload),

  suspend: (id: number, payload: SuspendUserPayload) =>
    apiClient.post<ApiResponse<AdminUser>>(`/admin/users/${id}/suspend`, payload),

  unsuspend: (id: number) =>
    apiClient.post<ApiResponse<AdminUser>>(`/admin/users/${id}/unsuspend`),

  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`),

  sendVerification: (id: number) =>
    apiClient.post<ApiResponse<void>>(`/admin/users/${id}/send-verification`),

  revokeSessions: (id: number) =>
    apiClient.post<ApiResponse<void>>(`/admin/users/${id}/revoke-sessions`),

  exportCsv: (params?: PaginationParams) =>
    apiClient.get('/admin/users/export', { params, responseType: 'blob' }),
};
