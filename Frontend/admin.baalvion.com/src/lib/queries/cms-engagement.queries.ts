import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsEngagementApi } from '@/lib/api/cms-engagement';

export const engagementKeys = {
  all: ['cms', 'engagement'] as const,
  pendingComments: (websiteId: string, params?: Record<string, unknown>) =>
    [...engagementKeys.all, 'pending-comments', websiteId, params] as const,
};

export const usePendingComments = (websiteId: string, params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: engagementKeys.pendingComments(websiteId, params),
    queryFn: () => cmsEngagementApi.pendingComments(websiteId, params).then((r) => r.data),
    enabled: !!websiteId,
    placeholderData: keepPreviousData,
  });

export const useModerateComment = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, status }: { commentId: string; status: 'approved' | 'rejected' }) =>
      cmsEngagementApi.moderateComment(websiteId, commentId, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: engagementKeys.all });
      toast.success(vars.status === 'approved' ? 'Comment approved' : 'Comment rejected');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
