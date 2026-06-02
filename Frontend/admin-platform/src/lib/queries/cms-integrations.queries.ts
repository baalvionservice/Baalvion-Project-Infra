import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { integrationsApi } from '@/lib/api/cms-integrations';
import type { UpsertIntegrationPayload } from '@/lib/types/cms-integration.types';

export const integrationKeys = {
  all: ['cms', 'integrations'] as const,
  list: (websiteId: string) => [...integrationKeys.all, 'list', websiteId] as const,
  summary: () => [...integrationKeys.all, 'summary'] as const,
};

export const useWebsiteIntegrations = (websiteId: string) =>
  useQuery({
    queryKey: integrationKeys.list(websiteId),
    queryFn: () => integrationsApi.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
  });

export const useIntegrationsSummary = () =>
  useQuery({
    queryKey: integrationKeys.summary(),
    queryFn: () => integrationsApi.summary().then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useUpsertIntegration = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, payload }: { provider: string; payload: UpsertIntegrationPayload }) =>
      integrationsApi.upsert(websiteId, provider, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(websiteId) });
      qc.invalidateQueries({ queryKey: integrationKeys.summary() });
      toast.success('Saved');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useTestIntegration = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.test(websiteId, provider).then((r) => r.data.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(websiteId) });
      if (res.ok) toast.success(res.message || 'Connection OK');
      else toast.error(res.message || 'Connection failed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRemoveIntegration = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.remove(websiteId, provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(websiteId) });
      qc.invalidateQueries({ queryKey: integrationKeys.summary() });
      toast.success('Integration removed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
