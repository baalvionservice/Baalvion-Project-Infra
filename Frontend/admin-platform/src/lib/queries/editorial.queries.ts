import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editorialApi, editorialPipelineApi } from '@/lib/api/editorial';
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

// ── Stage 3-5 ────────────────────────────────────────────────────────────────

export const pipelineKeys = {
  preflight: (id: string) => [...editorialKeys.all, 'preflight', id] as const,
  briefs: (id: string, p?: Record<string, unknown>) => [...editorialKeys.all, 'briefs', id, p] as const,
  drafts: (id: string, p?: Record<string, unknown>) => [...editorialKeys.all, 'drafts', id, p] as const,
  draft: (id: string, draftId: string) => [...editorialKeys.all, 'draft', id, draftId] as const,
  coverage: (id: string) => [...editorialKeys.all, 'coverage', id] as const,
};

export const usePreflight = (websiteId: string) =>
  useQuery({
    queryKey: pipelineKeys.preflight(websiteId),
    queryFn: () => editorialPipelineApi.preflight(websiteId).then((r) => r.data.data),
    enabled: Boolean(websiteId),
    retry: false,
  });

export const useBriefs = (websiteId: string, params?: { status?: string; limit?: number }) =>
  useQuery({
    queryKey: pipelineKeys.briefs(websiteId, params),
    queryFn: () => editorialPipelineApi.listBriefs(websiteId, params).then((r) => r.data.data),
    enabled: Boolean(websiteId),
  });

export const useDrafts = (websiteId: string, params?: { status?: string; gateStatus?: string; limit?: number }) =>
  useQuery({
    queryKey: pipelineKeys.drafts(websiteId, params),
    queryFn: () => editorialPipelineApi.listDrafts(websiteId, params).then((r) => r.data.data),
    enabled: Boolean(websiteId),
  });

export const useDraft = (websiteId: string, draftId: string | null) =>
  useQuery({
    queryKey: pipelineKeys.draft(websiteId, draftId ?? ''),
    queryFn: () => editorialPipelineApi.getDraft(websiteId, draftId as string).then((r) => r.data.data),
    enabled: Boolean(websiteId && draftId),
  });

/** Everything on this screen derives from a run, so invalidate the whole subtree. */
const useEditorialMutation = <TArgs, TData>(
  websiteId: string,
  fn: (args: TArgs) => Promise<TData>,
  onOk: (data: TData) => string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: editorialKeys.all });
      toast.success(onOk(data));
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? 'Request failed');
    },
  });
};

export const useRunPipeline = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (body: { stopAfter?: string; briefLimit?: number; draftLimit?: number } = {}) =>
      editorialPipelineApi.run(websiteId, body).then((r) => r.data.data),
    (run) => {
      const s = run.stages;
      const parts = [
        s.intake?.accepted != null ? `${s.intake.accepted} accepted` : null,
        s.cluster?.clusters != null ? `${s.cluster.clusters} clusters` : null,
        s.brief?.ready != null ? `${s.brief.ready} briefs` : null,
        s.draft?.drafted != null ? `${s.draft.drafted} drafts` : null,
        s.gate?.passed != null ? `${s.gate.passed} passed gates` : null,
      ].filter(Boolean);
      return parts.length ? `Run complete — ${parts.join(' · ')}` : 'Run complete';
    },
  );

export const useRunBriefing = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (body: { limit?: number; force?: boolean } = {}) =>
      editorialPipelineApi.runBriefing(websiteId, body).then((r) => r.data.data),
    () => 'Briefing run complete',
  );

export const useRunDrafting = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (body: { briefId?: string; limit?: number } = {}) =>
      editorialPipelineApi.runDrafting(websiteId, body).then((r) => r.data.data),
    () => 'Drafting run complete',
  );

export const useGateDraft = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (draftId: string) => editorialPipelineApi.gateDraft(websiteId, draftId).then((r) => r.data.data),
    (v) => (v.allowed ? 'All gates passed' : `${v.failedCount} gate(s) refuse this draft`),
  );

export const useApproveDraft = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (args: { draftId: string; reviewerSlug?: string }) =>
      editorialPipelineApi.approveDraft(websiteId, args.draftId, { reviewerSlug: args.reviewerSlug }).then((r) => r.data.data),
    () => 'Published',
  );

export const useRejectDraft = (websiteId: string) =>
  useEditorialMutation(
    websiteId,
    (args: { draftId: string; notes?: string }) =>
      editorialPipelineApi.rejectDraft(websiteId, args.draftId, { notes: args.notes }).then((r) => r.data.data),
    () => 'Draft rejected',
  );

export const useCoverage = (websiteId: string) =>
  useQuery({
    queryKey: pipelineKeys.coverage(websiteId),
    queryFn: () => editorialPipelineApi.coverage(websiteId).then((r) => r.data.data),
    enabled: Boolean(websiteId),
    retry: false,
  });
