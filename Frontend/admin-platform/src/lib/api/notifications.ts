import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  templateKey?: string;
  channel: string;
  recipient: string;
  subject?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened';
  errorMessage?: string;
  sentAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  templates: {
    list: () => apiClient.get<ApiResponse<NotificationTemplate[]>>('/admin/notifications/templates'),
    get: (id: string) =>
      apiClient.get<ApiResponse<NotificationTemplate>>(`/admin/notifications/templates/${id}`),
    create: (payload: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiClient.post<ApiResponse<NotificationTemplate>>('/admin/notifications/templates', payload),
    update: (id: string, payload: Partial<NotificationTemplate>) =>
      apiClient.patch<ApiResponse<NotificationTemplate>>(
        `/admin/notifications/templates/${id}`,
        payload,
      ),
    delete: (id: string) =>
      apiClient.delete<ApiResponse<void>>(`/admin/notifications/templates/${id}`),
  },

  logs: {
    list: (params?: PaginationParams & { channel?: string; status?: string }) =>
      apiClient.get<PaginatedResponse<NotificationLog>>('/admin/notifications/logs', { params }),
  },

  send: (payload: {
    templateKey: string;
    recipients: string[];
    variables?: Record<string, string>;
  }) => apiClient.post<ApiResponse<void>>('/admin/notifications/send', payload),
};
