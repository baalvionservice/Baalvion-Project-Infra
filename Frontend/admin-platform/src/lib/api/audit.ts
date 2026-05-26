import { authClient } from './client';
import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export interface AuditLog {
  id: number;
  userId: number;
  orgId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export const auditApi = {
  list: (
    params?: PaginationParams & {
      userId?: number;
      orgId?: string;
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => authClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),

  adminList: (params?: PaginationParams & { userId?: number; resourceType?: string }) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params }),

  export: (params?: Record<string, unknown>) =>
    apiClient.get('/admin/audit-logs/export', { params, responseType: 'blob' }),
};
