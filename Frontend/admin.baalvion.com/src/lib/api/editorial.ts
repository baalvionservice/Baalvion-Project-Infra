import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  EditorialCharter,
  PublicationPolicy,
  PolicyWithCategories,
  QuotaState,
  StorySignal,
  IntakeResult,
  TrendIntakeResult,
  PhotoCandidate,
  DraftArt,
  ClaimReport,
  StoryCluster,
  StoryBrief,
  ArticleDraft,
  GateVerdict,
  Preflight,
  PipelineRun,
  Coverage,
} from '@/lib/types/editorial.types';

// Editorial pipeline API (cms-service /cms/websites/:websiteId/editorial/*).
// The charter is the site's editorial identity; the policy is its operating
// rules — volume, beat mix, publishing windows, auto-publish.
const base = (websiteId: string) => `/cms/websites/${websiteId}/editorial`;

export const editorialApi = {
  getCharter: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<EditorialCharter | null>>(`${base(websiteId)}/charter`),

  saveCharter: (websiteId: string, data: Partial<EditorialCharter>) =>
    cmsApiClient.put<ApiResponse<EditorialCharter>>(`${base(websiteId)}/charter`, data),

  getPolicy: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<PolicyWithCategories>>(`${base(websiteId)}/policy`),

  savePolicy: (websiteId: string, data: Partial<PublicationPolicy>) =>
    cmsApiClient.put<ApiResponse<PublicationPolicy>>(`${base(websiteId)}/policy`, data),

  getQuota: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<QuotaState>>(`${base(websiteId)}/quota`),

  listSignals: (websiteId: string, params?: { decision?: string; limit?: number; sinceHours?: number }) =>
    cmsApiClient.get<ApiResponse<StorySignal[]>>(`${base(websiteId)}/signals`, { params }),

  runIntake: (websiteId: string, body?: { limit?: number; sinceHours?: number }) =>
    cmsApiClient.post<ApiResponse<IntakeResult>>(`${base(websiteId)}/intake`, body ?? {}),

  /** Trending entertainment topics into the same signal queue. Slow (several public APIs): up to a minute. */
  runTrends: (websiteId: string) =>
    cmsApiClient.post<ApiResponse<TrendIntakeResult>>(`${base(websiteId)}/trends`, {}, { timeout: 180_000 }),

  runClustering: (websiteId: string, body?: { windowHours?: number }) =>
    cmsApiClient.post<ApiResponse<StoryCluster[]>>(`${base(websiteId)}/cluster`, body ?? {}),
};

// Stage 3-5. Split from the object above only to keep the rule surface (charter,
// policy) readable next to the run surface (briefs, drafts, gates).
export const editorialPipelineApi = {
  preflight: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<Preflight>>(`${base(websiteId)}/preflight`),

  run: (websiteId: string, body?: { stopAfter?: string; briefLimit?: number; draftLimit?: number }) =>
    cmsApiClient.post<ApiResponse<PipelineRun>>(`${base(websiteId)}/run`, body ?? {}),

  listBriefs: (websiteId: string, params?: { status?: string; limit?: number }) =>
    cmsApiClient.get<ApiResponse<StoryBrief[]>>(`${base(websiteId)}/briefs`, { params }),

  runBriefing: (websiteId: string, body?: { limit?: number; windowHours?: number; force?: boolean }) =>
    cmsApiClient.post<ApiResponse<unknown>>(`${base(websiteId)}/briefs`, body ?? {}),

  listDrafts: (websiteId: string, params?: { status?: string; gateStatus?: string; limit?: number }) =>
    cmsApiClient.get<ApiResponse<ArticleDraft[]>>(`${base(websiteId)}/drafts`, { params }),

  getDraft: (websiteId: string, draftId: string) =>
    cmsApiClient.get<ApiResponse<ArticleDraft>>(`${base(websiteId)}/drafts/${draftId}`),

  runDrafting: (websiteId: string, body?: { briefId?: string; limit?: number; authorSlug?: string; format?: 'news' | 'brief' }) =>
    cmsApiClient.post<ApiResponse<unknown>>(`${base(websiteId)}/drafts`, body ?? {}),

  gateDraft: (websiteId: string, draftId: string, body?: { reviewerSlug?: string }) =>
    cmsApiClient.post<ApiResponse<GateVerdict>>(`${base(websiteId)}/drafts/${draftId}/gate`, body ?? {}),

  approveDraft: (websiteId: string, draftId: string, body?: { reviewerSlug?: string; notes?: string }) =>
    cmsApiClient.post<ApiResponse<{ contentId: string; slug: string }>>(`${base(websiteId)}/drafts/${draftId}/approve`, body ?? {}),

  rejectDraft: (websiteId: string, draftId: string, body?: { notes?: string }) =>
    cmsApiClient.post<ApiResponse<ArticleDraft>>(`${base(websiteId)}/drafts/${draftId}/reject`, body ?? {}),

  /** Free-licensed photos (CC0, public domain, CC BY, CC BY-SA) from Wikimedia Commons. */
  searchPhotos: (websiteId: string, q: string) =>
    cmsApiClient.get<ApiResponse<PhotoCandidate[]>>(`${base(websiteId)}/photos/search`, { params: { q } }),

  claimCheck: (websiteId: string, draftId: string) =>
    cmsApiClient.get<ApiResponse<ClaimReport>>(`${base(websiteId)}/drafts/${draftId}/claims`),

  listDraftArt: (websiteId: string, draftId: string) =>
    cmsApiClient.get<ApiResponse<DraftArt[]>>(`${base(websiteId)}/drafts/${draftId}/art`),

  attachPhoto: (websiteId: string, draftId: string, body: { title: string; subject: string; altText?: string; confirmedDepictsSubject: boolean }) =>
    cmsApiClient.post<ApiResponse<DraftArt>>(`${base(websiteId)}/drafts/${draftId}/photo`, body),

  coverage: (websiteId: string, params?: { days?: number }) =>
    cmsApiClient.get<ApiResponse<Coverage>>(`${base(websiteId)}/coverage`, { params }),
};
