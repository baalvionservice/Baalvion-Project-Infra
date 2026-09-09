import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  EditorialCharter,
  PublicationPolicy,
  PolicyWithCategories,
  QuotaState,
  StorySignal,
  IntakeResult,
  StoryCluster,
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

  runClustering: (websiteId: string, body?: { windowHours?: number }) =>
    cmsApiClient.post<ApiResponse<StoryCluster[]>>(`${base(websiteId)}/cluster`, body ?? {}),
};
