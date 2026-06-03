import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercent: number;
  environments: string[];
  targetOrgIds?: string[];
  targetUserIds?: number[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagPayload {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercent?: number;
  environments?: string[];
  targetOrgIds?: string[];
  targetUserIds?: number[];
}

export const featureFlagsApi = {
  list: () => adminApiClient.get<PaginatedResponse<FeatureFlag>>('/admin/feature-flags'),

  get: (id: string) => adminApiClient.get<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`),

  create: (payload: FeatureFlagPayload) =>
    adminApiClient.post<ApiResponse<FeatureFlag>>('/admin/feature-flags', payload),

  update: (id: string, payload: Partial<FeatureFlagPayload>) =>
    adminApiClient.patch<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`, payload),

  toggle: (id: string, enabled: boolean) =>
    adminApiClient.patch<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`, { enabled }),

  delete: (id: string) => adminApiClient.delete<ApiResponse<void>>(`/admin/feature-flags/${id}`),
};
