import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { featureFlagsApi, FeatureFlagPayload } from '@/lib/api/feature-flags';

export const flagKeys = {
  all: ['feature-flags'] as const,
  list: () => [...flagKeys.all, 'list'] as const,
  detail: (id: string) => [...flagKeys.all, 'detail', id] as const,
};

export const useFeatureFlags = () =>
  useQuery({
    queryKey: flagKeys.list(),
    queryFn: () => featureFlagsApi.list().then((r) => r.data.data),
  });

export const useToggleFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      featureFlagsApi.toggle(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: flagKeys.list() });
      const prev = qc.getQueryData(flagKeys.list());
      qc.setQueryData(flagKeys.list(), (old: ReturnType<typeof featureFlagsApi.list> extends Promise<infer R> ? R : never) => old);
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flagKeys.list() });
    },
    onError: (e: { message: string }, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(flagKeys.list(), ctx.prev);
      toast.error(e.message);
    },
  });
};

export const useCreateFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FeatureFlagPayload) => featureFlagsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flagKeys.all });
      toast.success('Feature flag created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => featureFlagsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flagKeys.all });
      toast.success('Feature flag deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
