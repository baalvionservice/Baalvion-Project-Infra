import { sessionApiClient, adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

export interface SessionDetail {
  id:                string;
  user_id:           string;
  org_id:            string | null;
  ip_address:        string;
  user_agent:        string;
  geo_country:       string | null;
  geo_region:        string | null;
  geo_city:          string | null;
  geo_timezone:      string | null;
  device_browser:    string | null;
  device_os:         string | null;
  device_type:       string | null;
  risk_score:        number;
  risk_level:        'low' | 'medium' | 'high';
  risk_signals:      Array<{ type: string; weight: number; [key: string]: unknown }>;
  created_at:        string;
  last_seen_at:      string;
  expires_at:        string;
  revoked_at:        string | null;
}

export interface SessionStats {
  active_count:    number;
  total_count:     number;
  countries:       number;
  devices:         number;
  last_active:     string;
  avg_risk_score:  number;
}

export const sessionsApi = {
  listMine: (params?: { page?: number; limit?: number; includeRevoked?: boolean }) =>
    sessionApiClient.get<ApiResponse<{ items: SessionDetail[]; total: number }>>('/sessions', { params }),

  myStats: () =>
    sessionApiClient.get<ApiResponse<SessionStats>>('/sessions/stats'),

  revokeOne: (sessionId: string) =>
    sessionApiClient.delete<ApiResponse<{ message: string }>>(`/sessions/${sessionId}`),

  revokeAllOthers: () =>
    sessionApiClient.delete<ApiResponse<{ message: string }>>('/sessions'),

  // Admin-wide session views are served by admin-service (:3021), which queries
  // auth.sessions directly. (session-service :3022 owns the per-user "my sessions"
  // methods above; it is optional for the core identity slice.)
  adminListAll: (params?: { page?: number; limit?: number; userId?: string; orgId?: string; riskLevel?: string }) =>
    adminApiClient.get<ApiResponse<{ items: SessionDetail[]; total: number }>>('/admin/sessions', { params }),

  adminGetUserSessions: (userId: string, params?: { page?: number; limit?: number; includeRevoked?: boolean }) =>
    adminApiClient.get<ApiResponse<{ items: SessionDetail[]; total: number }>>('/admin/sessions', { params: { ...params, userId } }),

  adminRevokeOne: (sessionId: string) =>
    adminApiClient.delete<ApiResponse<{ message: string }>>(`/admin/sessions/${sessionId}`),
};
