import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsPollApi } from '@/lib/api/cms-poll';

export const pollKeys = {
  detail: (contentId: string) => ['cms', 'poll', contentId] as const,
};

export const usePoll = (contentId: string) =>
  useQuery({
    queryKey: pollKeys.detail(contentId),
    queryFn: () => cmsPollApi.get(contentId).then((r) => r.data.data),
    enabled: !!contentId,
  });

export const useUpsertPoll = (contentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { question: string; options: string[] }) => cmsPollApi.upsert(contentId, payload),
    onSuccess: (res) => {
      qc.setQueryData(pollKeys.detail(contentId), res.data.data);
      toast.success('Poll saved');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeletePoll = (contentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cmsPollApi.remove(contentId),
    onSuccess: () => {
      qc.setQueryData(pollKeys.detail(contentId), null);
      toast.success('Poll removed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
