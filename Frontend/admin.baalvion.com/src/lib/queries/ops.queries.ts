import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { opsApi } from '@/lib/api/ops';
import type { ReconciliationRange } from '@/lib/api/ops';

export const opsKeys = {
  all: (storeId: string) => ['ops', storeId] as const,
  reconciliation: (storeId: string, range?: ReconciliationRange) =>
    ['ops', storeId, 'reconciliation', range] as const,
};

export const useReconciliation = (storeId: string, range?: ReconciliationRange) =>
  useQuery({
    queryKey: opsKeys.reconciliation(storeId, range),
    queryFn: () => opsApi.reconciliation(storeId, range).then((r) => r.data.data),
    enabled: !!storeId,
  });

export const useRunBackfill = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (range?: ReconciliationRange) =>
      opsApi.backfill(storeId, range).then((r) => r.data.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: opsKeys.all(storeId) });
      toast.success(`Backfill complete — ${result.posted} posted, ${result.failed} failed`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
