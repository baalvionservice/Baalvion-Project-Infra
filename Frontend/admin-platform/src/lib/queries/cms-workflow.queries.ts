import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsWorkflowApi } from '@/lib/api/cms-workflow';
import { contentKeys } from './cms-content.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { WorkflowTransitionPayload } from '@/lib/types/cms-workflow.types';

export const workflowKeys = {
  all: ['cms', 'workflow'] as const,
  approvals: (params?: Record<string, unknown>) => [...workflowKeys.all, 'approvals', params] as const,
  stats: (websiteId: string) => [...workflowKeys.all, 'stats', websiteId] as const,
  mine: () => [...workflowKeys.all, 'mine'] as const,
};

export const useWorkflowApprovals = (params?: {
  websiteId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: workflowKeys.approvals(params),
    queryFn: () => cmsWorkflowApi.approvals.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useWorkflowStats = (websiteId: string) =>
  useQuery({
    queryKey: workflowKeys.stats(websiteId),
    queryFn: () => cmsWorkflowApi.stats(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useMyPendingApprovals = () => {
  const setPendingCount = useCmsStore((s) => s.setPendingApprovalsCount);
  return useQuery({
    queryKey: workflowKeys.mine(),
    queryFn: async () => {
      const res = await cmsWorkflowApi.myPendingApprovals();
      setPendingCount(res.data.data.length);
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });
};

export const useWorkflowTransition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkflowTransitionPayload) => cmsWorkflowApi.transition(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: contentKeys.detail(vars.contentId) });
      qc.invalidateQueries({ queryKey: contentKeys.all });
      qc.invalidateQueries({ queryKey: workflowKeys.all });
      toast.success('Status updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useApproveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      cmsWorkflowApi.approvals.approve(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.all });
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Request approved');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRejectRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      cmsWorkflowApi.approvals.reject(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.all });
      qc.invalidateQueries({ queryKey: contentKeys.all });
      toast.success('Request rejected');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
