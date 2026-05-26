import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type {
  WebhookEndpoint, WebhookDelivery, RateLimitPolicy,
  ChangelogEntry, SdkRelease, ApiEndpointStat, SandboxEnvironment,
} from '@/lib/types/developer.types';

export const developersApi = {
  // API usage stats
  getApiStats: (params: { period: '1d' | '7d' | '30d' }) =>
    adminApiClient.get<ApiResponse<{ endpoints: ApiEndpointStat[]; totalCalls: number; totalErrors: number; avgLatencyMs: number }>>('/developer/stats', { params }),

  // Webhooks
  listWebhooks: (params?: PaginationParams & { orgId?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<WebhookEndpoint>>>('/developer/webhooks', { params }),

  getWebhook: (id: string) =>
    adminApiClient.get<ApiResponse<WebhookEndpoint>>(`/developer/webhooks/${id}`),

  createWebhook: (data: Partial<WebhookEndpoint>) =>
    adminApiClient.post<ApiResponse<WebhookEndpoint>>('/developer/webhooks', data),

  updateWebhook: (id: string, data: Partial<WebhookEndpoint>) =>
    adminApiClient.patch<ApiResponse<WebhookEndpoint>>(`/developer/webhooks/${id}`, data),

  deleteWebhook: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/developer/webhooks/${id}`),

  testWebhook: (id: string) =>
    adminApiClient.post<ApiResponse<{ statusCode: number; latencyMs: number }>>(`/developer/webhooks/${id}/test`),

  // Webhook deliveries
  listDeliveries: (webhookId: string, params?: PaginationParams) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<WebhookDelivery>>>(`/developer/webhooks/${webhookId}/deliveries`, { params }),

  retryDelivery: (deliveryId: string) =>
    adminApiClient.post<ApiResponse<void>>(`/developer/deliveries/${deliveryId}/retry`),

  // Rate limits
  listRateLimits: () =>
    adminApiClient.get<ApiResponse<RateLimitPolicy[]>>('/developer/rate-limits'),

  updateRateLimit: (id: string, data: Partial<RateLimitPolicy>) =>
    adminApiClient.patch<ApiResponse<RateLimitPolicy>>(`/developer/rate-limits/${id}`, data),

  // Changelog
  listChangelog: (params?: PaginationParams) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<ChangelogEntry>>>('/developer/changelog', { params }),

  createChangelogEntry: (data: Partial<ChangelogEntry>) =>
    adminApiClient.post<ApiResponse<ChangelogEntry>>('/developer/changelog', data),

  publishChangelogEntry: (id: string) =>
    adminApiClient.post<ApiResponse<ChangelogEntry>>(`/developer/changelog/${id}/publish`),

  // SDK releases
  listSdks: () =>
    adminApiClient.get<ApiResponse<SdkRelease[]>>('/developer/sdks'),

  // Sandbox
  listSandboxes: (params?: PaginationParams) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<SandboxEnvironment>>>('/developer/sandboxes', { params }),

  createSandbox: (data: { name: string; orgId?: string }) =>
    adminApiClient.post<ApiResponse<SandboxEnvironment>>('/developer/sandboxes', data),

  resetSandbox: (id: string) =>
    adminApiClient.post<ApiResponse<void>>(`/developer/sandboxes/${id}/reset`),

  deleteSandbox: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/developer/sandboxes/${id}`),
};
