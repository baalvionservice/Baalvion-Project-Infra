import apiClient from './client';
import type {
  WorkflowApprovalRequest,
  WorkflowTransitionPayload,
  WorkflowStatsForWebsite,
} from '@/lib/types/cms-workflow.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

export const cmsWorkflowApi = {
  transition: (payload: WorkflowTransitionPayload) =>
    apiClient.post<ApiResponse<{ contentId: string; newStatus: string }>>('/admin/cms/workflow/transition', payload),

  approvals: {
    list: (params?: {
      websiteId?: string;
      status?: 'pending' | 'approved' | 'rejected';
      page?: number;
      limit?: number;
    }) =>
      apiClient.get<PaginatedResponse<WorkflowApprovalRequest>>('/admin/cms/workflow/approvals', {
        params,
      }),

    get: (id: string) =>
      apiClient.get<ApiResponse<WorkflowApprovalRequest>>(`/admin/cms/workflow/approvals/${id}`),

    approve: (id: string, note?: string) =>
      apiClient.post<ApiResponse<WorkflowApprovalRequest>>(`/admin/cms/workflow/approvals/${id}/approve`, { note }),

    reject: (id: string, note: string) =>
      apiClient.post<ApiResponse<WorkflowApprovalRequest>>(`/admin/cms/workflow/approvals/${id}/reject`, { note }),
  },

  stats: (websiteId: string) =>
    apiClient.get<ApiResponse<WorkflowStatsForWebsite>>(`/admin/cms/workflow/stats/${websiteId}`),

  myPendingApprovals: () =>
    apiClient.get<ApiResponse<WorkflowApprovalRequest[]>>('/admin/cms/workflow/mine/approvals'),
};
