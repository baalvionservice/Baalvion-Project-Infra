import { oauthApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

export interface OAuthClient {
  id:               string;
  name:             string;
  client_id:        string;
  client_secret?:   string;
  redirect_uris:    string[];
  grant_types:      string[];
  scopes:           string[];
  is_confidential:  boolean;
  revoked_at:       string | null;
  created_at:       string;
}

export interface CreateClientPayload {
  name:            string;
  redirectUris?:   string[];
  grantTypes?:     string[];
  scopes?:         string[];
  isConfidential?: boolean;
}

export const oauthClientsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    oauthApiClient.get<ApiResponse<{ items: OAuthClient[]; total: number }>>('/v1/clients', { params }),

  create: (payload: CreateClientPayload) =>
    oauthApiClient.post<ApiResponse<OAuthClient>>('/v1/clients', payload),

  rotateSecret: (clientId: string) =>
    oauthApiClient.post<ApiResponse<{ clientSecret: string }>>(`/v1/clients/${clientId}/rotate`),

  delete: (clientId: string) =>
    oauthApiClient.delete<ApiResponse<{ message: string }>>(`/v1/clients/${clientId}`),

  introspect: (token: string) =>
    oauthApiClient.post<{ active: boolean; sub?: string; scope?: string; exp?: number }>('/oauth/introspect', { token }),
};
