import apiClient from './client';
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
  list: () => apiClient.get<PaginatedResponse<FeatureFlag>>('/admin/feature-flags'),

  get: (id: string) => apiClient.get<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`),

  create: (payload: FeatureFlagPayload) =>
    apiClient.post<ApiResponse<FeatureFlag>>('/admin/feature-flags', payload),

  update: (id: string, payload: Partial<FeatureFlagPayload>) =>
    apiClient.patch<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`, payload),

  toggle: (id: string, enabled: boolean) =>
    apiClient.patch<ApiResponse<FeatureFlag>>(`/admin/feature-flags/${id}`, { enabled }),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/admin/feature-flags/${id}`),
};
