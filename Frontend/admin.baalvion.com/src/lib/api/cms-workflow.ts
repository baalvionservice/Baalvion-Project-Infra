import apiClient, { cmsApiClient } from './client';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  WorkflowApprovalRequest,
  WorkflowTransitionPayload,
  WorkflowStatsForWebsite,
} from '@/lib/types/cms-workflow.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

export const cmsWorkflowApi = {
  // Workflow transitions are website-scoped on cms-service:
  //   POST /cms/websites/:websiteId/content/:contentId/workflow/transition  { action, notes?, scheduledAt? }
  // The console's WorkflowPanel sends a flat { contentId, action, note, scheduledAt }, so we
  // resolve the active website from the cms store (same as cms-content.ts) and adapt the body
  // (note → notes; datetime-local → ISO for the zod .datetime() validator).
  transition: (payload: WorkflowTransitionPayload) => {
    const websiteId = useCmsStore.getState().activeWebsiteId;
    if (!websiteId) return Promise.reject(new Error('No active website selected'));
    const { contentId, action, note, scheduledAt } = payload;
    return cmsApiClient.post<ApiResponse<{ workflow: unknown; content: { id: string; status: string } }>>(
      `/cms/websites/${websiteId}/content/${contentId}/workflow/transition`,
      {
        action,
        ...(note ? { notes: note } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      },
    );
  },

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
