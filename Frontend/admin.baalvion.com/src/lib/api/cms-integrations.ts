import { cmsApiClient } from './client';
import type {
  Integration,
  UpsertIntegrationPayload,
  IntegrationTestResult,
  WebsiteIntegrationSummary,
} from '@/lib/types/cms-integration.types';
import type { ApiResponse } from '@/lib/types/common.types';

export const integrationsApi = {
  list: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<Integration[]>>(`/cms/websites/${websiteId}/integrations`),

  upsert: (websiteId: string, provider: string, payload: UpsertIntegrationPayload) =>
    cmsApiClient.put<ApiResponse<Integration>>(`/cms/websites/${websiteId}/integrations/${provider}`, payload),

  test: (websiteId: string, provider: string) =>
    cmsApiClient.post<ApiResponse<IntegrationTestResult>>(`/cms/websites/${websiteId}/integrations/${provider}/test`),

  remove: (websiteId: string, provider: string) =>
    cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${websiteId}/integrations/${provider}`),

  // Org-wide rollup for the dashboard "Website Connections" widget.
  summary: () =>
    cmsApiClient.get<ApiResponse<WebsiteIntegrationSummary[]>>(`/cms/integrations/summary`),
};
