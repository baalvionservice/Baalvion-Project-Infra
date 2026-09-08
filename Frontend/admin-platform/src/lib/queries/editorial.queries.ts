import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editorialApi } from '@/lib/api/editorial';
import type { EditorialCharter, PublicationPolicy } from '@/lib/types/editorial.types';

export const editorialKeys = {
  all: ['cms', 'editorial'] as const,
  charter: (id: string) => [...editorialKeys.all, 'charter', id] as const,
  policy: (id: string) => [...editorialKeys.all, 'policy', id] as const,
  quota: (id: string) => [...editorialKeys.all, 'quota', id] as const,
  signals: (id: string, params?: Record<string, unknown>) =>
    [...editorialKeys.all, 'signals', id, params] as const,
};

export const useCharter = (websiteId: string) =>
  useQuery({
    queryKey: editorialKeys.charter(websiteId),
    queryFn: () => editorialApi.getCharter(websiteId).then((r) => r.data.data),
    enabled: Boolean(websiteId),
  });

export const usePolicy = (websiteId: string) =>
  useQuery({
    queryKey: editorialKeys.policy(websiteId),
    queryFn: () => editorialApi.getPolicy(websiteId).then((r) => r.data.data),
    enabled: Boolean(websiteId),
  });

// The quota reflects what has actually been published, so it moves without the
// user doing anything here — refetch on an interval rather than only on mount.
export const useQuota = (websiteId: string) =>
  useQuery({
    queryKey: editorialKeys.quota(websiteId),
    queryFn: () => editorialApi.getQuota(websiteId).then((r) => r.data.data),
    enabled: Boolean(websiteId),
    refetchInterval: 60_000,
    retry: false,
  });

export const useSignals = (websiteId: string, params?: { decision?: string; limit?: number; sinceHours?: number }) =>
  useQuery({
    queryKey: editorialKeys.signals(websiteId, params),
    queryFn: () => editorialApi.listSignals(websiteId, params).then((r) => r.data.data),
    enabled: Boolean(websiteId),
  });

export const useSaveCharter = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EditorialCharter>) => editorialApi.saveCharter(websiteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorialKeys.charter(websiteId) });
      toast.success('Editorial charter saved');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Could not save the charter')),
  });
};

export const useSavePolicy = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PublicationPolicy>) => editorialApi.savePolicy(websiteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorialKeys.policy(websiteId) });
      qc.invalidateQueries({ queryKey: editorialKeys.quota(websiteId) });
      toast.success('Publication rules saved');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Could not save the publication rules')),
  });
};

export const useRunIntake = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => editorialApi.runIntake(websiteId).then((r) => r.data.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: editorialKeys.all });
      // The wire error is surfaced rather than swallowed: "0 accepted" because
      // news-service is unreachable is a different problem from "0 accepted"
      // because nothing matched the charter.
      if (result?.wireError) toast.warning(`Wire partially unavailable: ${result.wireError}`);
      toast.success(`Scanned ${result?.scanned ?? 0} — ${result?.accepted ?? 0} on beat, ${result?.rejected ?? 0} rejected`);
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Intake failed')),
  });
};

function errorMessage(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: { message?: string } } } })?.response;
  return res?.data?.error?.message ?? fallback;
}
